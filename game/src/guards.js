// guards.js — patrol guards: waypoints, vision cones, detection, chase, catch.
// A guard sees the thief only inside its cone, within range, with a clear
// line of sight. Being seen raises the alarm; the alarm is the fair warning
// before any capture.
import { lineBlocked, resolveCircleCollision, pointInRect } from './level.js';
import { playerInSmoke } from './player.js';

export const CONE_HALF = 0.61; // ~35 degrees each side
export const CONE_RANGE = 225;
export const CHASE_SPEED = 122;

export function createGuards(defs) {
  return defs.map((d) => ({
    name: d.name, x: d.x, y: d.y, angle: d.angle, r: 15,
    waypoints: d.waypoints, wp: 0, speed: d.speed,
    state: 'patrol', // patrol | alert | chase | investigate
    investigate: null, investigateTimer: 0, pauseTimer: 0, seenTimer: 0,
  }));
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this guard see the thief right now? Cones, range, line of sight,
// smoke and the vent all matter — and sneaking shrinks the detection range.
export function guardSeesThief(guard, player, level, state) {
  if (playerInSmoke(state, player.x, player.y)) return false;
  const dx = player.x - guard.x, dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  let range = CONE_RANGE;
  if (player.sneak) range *= 0.62;
  if (pointInRect(player.x, player.y, level.vent)) range *= 0.5;
  if (dist > range) return false;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, guard.angle)) > CONE_HALF) return false;
  if (lineBlocked(level, guard.x, guard.y, player.x, player.y)) return false;
  return true;
}

function moveToward(g, tx, ty, speed, level, dt) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  g.x += (dx / d) * step;
  g.y += (dy / d) * step;
  g.angle = Math.atan2(dy, dx);
  const fixed = resolveCircleCollision(level, g.x, g.y, g.r);
  g.x = fixed.x; g.y = fixed.y;
  return false;
}

export function updateGuards(guards, player, level, state, dt) {
  let anySeeing = false;
  for (const g of guards) {
    const sees = guardSeesThief(g, player, level, state);
    if (sees) { anySeeing = true; g.seenTimer += dt; } else { g.seenTimer = 0; }

    if (g.state === 'chase') {
      if (sees) {
        moveToward(g, player.x, player.y, CHASE_SPEED, level, dt);
      } else {
        g.state = 'alert';
        g.pauseTimer = 1.2;
      }
    } else if (g.state === 'investigate') {
      if (g.investigate) {
        const arrived = moveToward(g, g.investigate.x, g.investigate.y, g.speed * 1.5, level, dt);
        if (arrived) {
          g.investigateTimer -= dt;
          g.angle += dt * 2.2; // look around the spot
          if (g.investigateTimer <= 0) { g.state = 'patrol'; g.investigate = null; }
        }
      } else { g.state = 'patrol'; }
      if (sees && g.seenTimer > 0.25) g.state = 'chase';
    } else {
      // patrol / alert
      if (sees && g.seenTimer > 0.35) g.state = 'chase';
      if (g.state === 'alert') {
        g.pauseTimer -= dt;
        g.angle += dt * 1.6; // scan the room while suspicious
        if (g.pauseTimer <= 0) g.state = 'patrol';
      } else {
        const wp = g.waypoints[g.wp];
        if (g.pauseTimer > 0) {
          g.pauseTimer -= dt;
        } else {
          const arrived = moveToward(g, wp[0], wp[1], g.speed, level, dt);
          if (arrived) {
            g.wp = (g.wp + 1) % g.waypoints.length;
            g.pauseTimer = 0.9; // linger at each waypoint, cone sweeping
          }
        }
      }
    }
    // Coin distraction: the nearest patrolling guard goes to investigate.
    if (state.distractions.length && g.state === 'patrol') {
      const coin = state.distractions[0];
      const d = Math.hypot(coin.x - g.x, coin.y - g.y);
      if (d < 460) {
        g.state = 'investigate';
        g.investigate = { x: coin.x, y: coin.y };
        g.investigateTimer = 2.5;
      }
    }
  }
  return anySeeing;
}

// Touching a guard is a capture — but only after the alarm has been
// warning the player, so the caught moment stays fair.
export function guardTouchingPlayer(guards, player) {
  for (const g of guards) {
    if (Math.hypot(g.x - player.x, g.y - player.y) < g.r + player.r - 2) return g;
  }
  return null;
}
