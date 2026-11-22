// player.js — the thief: movement, sneaking, tools and interaction.
import { resolveCircleCollision, pointInRect } from './level.js';

export function createPlayer(spawn) {
  return {
    x: spawn.x, y: spawn.y, r: 14, angle: -Math.PI / 2,
    speed: 0, sneak: false, moving: false,
    coins: 3, smoke: 2, score: 0, lootValue: 0, lootCount: 0,
    hasStar: false, stepTimer: 0, smokeTimer: 0, toolCost: 0,
  };
}

const WALK_SPEED = 150;
const SNEAK_SPEED = 80;
const VENT_SPEED = 55;

export function updatePlayer(player, keys, level, dt, sfx) {
  let dx = 0, dy = 0;
  if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
  player.sneak = !!(keys['ShiftLeft'] || keys['ShiftRight']);
  const inVent = pointInRect(player.x, player.y, level.vent);
  let speed = player.sneak ? SNEAK_SPEED : WALK_SPEED;
  if (inVent) speed = Math.min(speed, VENT_SPEED);
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    player.x += dx * speed * dt;
    player.y += dy * speed * dt;
    player.angle = Math.atan2(dy, dx);
    player.speed = speed;
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.sneak ? 0.55 : 0.34;
      if (sfx) sfx.footstep(player.sneak);
    }
  } else {
    player.speed = 0;
  }
  // Keep the thief inside the room.
  player.x = Math.max(24 + player.r, Math.min(1280 - 24 - player.r, player.x));
  player.y = Math.max(24 + player.r, Math.min(720 - 24 - player.r, player.y));
  const fixed = resolveCircleCollision(level, player.x, player.y, player.r);
  player.x = fixed.x; player.y = fixed.y;
  if (player.smokeTimer > 0) player.smokeTimer -= dt;
  return inVent;
}

// E (or click): grab the nearest loot within reach. Returns the loot taken.
export function tryGrabLoot(player, level) {
  for (const item of level.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - player.x, item.y - player.y);
    if (d < 46) {
      item.taken = true;
      player.lootValue += item.value;
      player.lootCount += 1;
      player.score += item.value;
      if (item.target) player.hasStar = true;
      return item;
    }
  }
  return null;
}

// Q: toss a coin — a clink 130px ahead of the thief. The nearest guard
// abandons its patrol to investigate. Costs 50 score, 3 coins total.
export function tossCoin(player, state) {
  if (player.coins <= 0) return null;
  player.coins -= 1;
  player.score -= 50;
  player.toolCost += 50;
  const cx = player.x + Math.cos(player.angle) * 130;
  const cy = player.y + Math.sin(player.angle) * 130;
  const coin = { x: Math.max(40, Math.min(1240, cx)), y: Math.max(40, Math.min(680, cy)), t: 3.5 };
  state.distractions.push(coin);
  return coin;
}

// 1: smoke pellet — a cloud at the thief's feet that blocks all vision
// for 4 seconds. Costs 100 score, 2 pellets total.
export function throwSmoke(player, state) {
  if (player.smoke <= 0) return null;
  player.smoke -= 1;
  player.score -= 100;
  player.toolCost += 100;
  const cloud = { x: player.x, y: player.y, r: 95, t: 4 };
  state.smokes.push(cloud);
  return cloud;
}

export function playerInSmoke(state, x, y) {
  for (const c of state.smokes) {
    if (Math.hypot(x - c.x, y - c.y) < c.r) return true;
  }
  return false;
}
