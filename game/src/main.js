// main.js — boot, game loop and screen state machine for The Marlow Museum Heist.
// Screens: title -> play <-> paused -> win / caught. Also owns the debug and
// staging hooks the playtester drives (window.__game) and the ?stage= query
// param that stages a screenshot state on load.
import { buildLevel } from './level.js';
import { createPlayer, updatePlayer, tryGrabLoot, tossCoin, throwSmoke } from './player.js';
import { createGuards, updateGuards, guardTouchingPlayer } from './guards.js';
import { createCameras, updateCameras, cameraSeesThief } from './cameras.js';
import { createAudio } from './audio.js';
import { drawTitle, drawPlay, drawWin, drawCaught } from './render.js';
import { setMessage } from './hud.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 720;

const sfx = createAudio();
const keys = {};

function newGame() {
  const level = buildLevel();
  return {
    screen: 'title', // title | play | paused | win | caught
    time: 0, elapsed: 0, alarm: 0, fps: 60,
    level, player: createPlayer(level.spawn),
    guards: createGuards(level.guards),
    cameras: createCameras(level.cameras),
    distractions: [], smokes: [],
    message: '', messageTimer: 0,
    caughtReason: '', spottedBefore: false, alarmTickTimer: 0,
    frames: 0, fpsTimer: 0,
  };
}

let state = newGame();

function startPlay() {
  if (state.screen === 'title' || state.screen === 'win' || state.screen === 'caught') {
    if (state.screen !== 'title') state = newGame();
    state.screen = 'play';
    sfx.unlock();
    setMessage(state, 'Stay out of the cones. Grab the Gilded Star!', 3);
  }
}

function endCaught(reason) {
  if (state.screen !== 'play') return;
  state.screen = 'caught';
  state.caughtReason = reason;
  sfx.lose();
}

function endWin() {
  if (state.screen !== 'play') return;
  state.screen = 'win';
  sfx.win();
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;
  sfx.unlock();
  if (e.code === 'Enter') startPlay();
  if (e.code === 'KeyR' && state.screen !== 'title') { state = newGame(); state.screen = 'play'; }
  if (e.code === 'KeyP' && (state.screen === 'play' || state.screen === 'paused')) {
    state.screen = state.screen === 'play' ? 'paused' : 'play';
  }
  if (e.code === 'KeyM') {
    const muted = sfx.toggleMute();
    setMessage(state, muted ? 'Sound muted (M to unmute)' : 'Sound on', 1.5);
  }
  if (state.screen !== 'play') return;
  if (e.code === 'KeyE') {
    const item = tryGrabLoot(state.player, state.level);
    if (item) {
      sfx.pickup();
      setMessage(state, item.target
        ? '★ GILDED STAR SECURED! Now reach the GETAWAY door!'
        : `Grabbed ${item.name} (+$${item.value})`, 2.5);
    } else if (state.player.hasStar && nearExit()) {
      endWin();
    }
  }
  if (e.code === 'KeyQ') {
    const coin = tossCoin(state.player, state);
    if (coin) { sfx.coin(); setMessage(state, 'Coin tossed — a guard goes to check the clink (−$50)', 2); }
    else setMessage(state, 'No coins left!', 1.5);
  }
  if (e.code === 'Digit1') {
    const cloud = throwSmoke(state.player, state);
    if (cloud) { sfx.smoke(); setMessage(state, 'Smoke pellet! Vision blocked for 4s (−$100)', 2); }
    else setMessage(state, 'No smoke pellets left!', 1.5);
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

// Click to interact too (mouse support): grab loot / reach the exit.
canvas.addEventListener('click', () => {
  if (state.screen !== 'play') { startPlay(); return; }
  const item = tryGrabLoot(state.player, state.level);
  if (item) { sfx.pickup(); setMessage(state, `Grabbed ${item.name} (+$${item.value})`, 2); }
  else if (state.player.hasStar && nearExit()) endWin();
});

function nearExit() {
  const p = state.player, ex = state.level.exit;
  return p.x > ex.x - 10 && p.x < ex.x + ex.w + 10 && p.y > ex.y - 10 && p.y < ex.y + ex.h + 10;
}

function update(dt) {
  state.time += dt;
  if (state.screen !== 'play') return;
  state.elapsed += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;

  updatePlayer(state.player, keys, state.level, dt, sfx);
  updateCameras(state.cameras, state.time);

  // Detection: guards + cameras feed one shared alarm meter.
  const guardSees = updateGuards(state.guards, state.player, state.level, state, dt);
  let cameraSees = false;
  for (const cam of state.cameras) {
    cam.spotted = cameraSeesThief(cam, state.player, state.level, state);
    if (cam.spotted) cameraSees = true;
  }
  const seen = guardSees || cameraSees;
  if (seen) {
    state.alarm += ((guardSees ? 42 : 0) + (cameraSees ? 26 : 0)) * dt;
    if (!state.spottedBefore) {
      state.spottedBefore = true;
      sfx.spotted();
      setMessage(state, 'SPOTTED! Break line of sight — the alarm is rising!', 2);
    }
    state.alarmTickTimer -= dt;
    if (state.alarmTickTimer <= 0) { state.alarmTickTimer = 0.5; sfx.alarmTick(); }
  } else {
    state.alarm = Math.max(0, state.alarm - 10 * dt);
    if (state.alarm < 5) state.spottedBefore = false;
  }
  state.alarm = Math.min(100, state.alarm);

  // Distractions and smoke expire.
  for (const d of state.distractions) d.t -= dt;
  state.distractions = state.distractions.filter((d) => d.t > 0);
  for (const c of state.smokes) c.t -= dt;
  state.smokes = state.smokes.filter((c) => c.t > 0);

  // Win: star in hand and standing at the getaway door.
  if (state.player.hasStar && nearExit()) { endWin(); return; }
  // Caught: alarm maxed out, or a guard lays hands on the thief.
  if (state.alarm >= 100) { endCaught('The alarm hit 100% — security sealed the museum.'); return; }
  const grabber = guardTouchingPlayer(state.guards, state.player);
  if (grabber) { endCaught(`Guard ${grabber.name} grabbed you in the gallery.`); }
}

function draw() {
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'win') drawWin(ctx, state);
  else if (state.screen === 'caught') drawCaught(ctx, state);
  else drawPlay(ctx, state);
}

let last = performance.now();
let shotReady = false;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.frames += 1;
  state.fpsTimer += dt;
  if (state.fpsTimer >= 1) {
    state.fps = Math.round(state.frames / state.fpsTimer);
    state.frames = 0; state.fpsTimer = 0;
  }
  update(dt);
  draw();
  if (!shotReady) { shotReady = true; window.__shotReady = true; }
  requestAnimationFrame(loop);
}

// ---- Staging helpers (screenshots / playtests only, not cheats in play) ----
function stageCover() {
  state = newGame();
  state.screen = 'play';
  state.alarm = 35;
  state.player.x = 640; state.player.y = 480; state.player.angle = -Math.PI / 2;
  state.player.lootValue = 400; state.player.lootCount = 2; state.player.score = 400;
  state.level.loot[3].taken = true; state.level.loot[4].taken = true;
  state.guards[0].x = 500; state.guards[0].y = 300; state.guards[0].angle = 0.3;
  state.guards[1].x = 760; state.guards[1].y = 170; state.guards[1].angle = Math.PI;
  state.guards[2].x = 880; state.guards[2].y = 580; state.guards[2].angle = Math.PI * 0.9;
  state.cameras[0].angle = 0.9; state.cameras[1].angle = 2.2; state.cameras[2].angle = 1.2;
  setMessage(state, 'The Gilded Star waits in the vault — cross the hall!', 10);
}
function stagePatrol() {
  state = newGame();
  state.screen = 'play';
  state.alarm = 5;
  state.player.x = 255; state.player.y = 290; state.player.angle = 0; state.player.sneak = true;
  state.guards[0].x = 640; state.guards[0].y = 300; state.guards[0].angle = Math.PI;
  state.guards[1].x = 500; state.guards[1].y = 170; state.guards[1].angle = 0;
  setMessage(state, 'Sneak behind the case — wait for the cone to sweep past.', 10);
}
function stageAlarm() {
  state = newGame();
  state.screen = 'play';
  state.alarm = 72;
  state.player.x = 760; state.player.y = 380; state.player.angle = -Math.PI / 2;
  state.player.hasStar = true; state.player.lootValue = 1000; state.player.lootCount = 1; state.player.score = 1000;
  state.level.loot[0].taken = true;
  state.guards[0].x = 760; state.guards[0].y = 300; state.guards[0].angle = Math.PI / 2; state.guards[0].state = 'chase';
  state.guards[1].x = 900; state.guards[1].y = 200; state.guards[1].angle = Math.PI * 0.6; state.guards[1].state = 'alert';
  state.cameras[2].spotted = true;
  state.spottedBefore = true;
  setMessage(state, 'SPOTTED! Break line of sight — the alarm is rising!', 10);
}
function stageWin() {
  state = newGame();
  state.screen = 'win';
  state.elapsed = 187;
  state.player.hasStar = true; state.player.lootValue = 1400; state.player.lootCount = 3;
  state.player.score = 1400; state.player.toolCost = 50;
  state.level.loot[0].taken = true;
  state.player.x = 80; state.player.y = 660;
}

window.__game = {
  get state() { return state; },
  snapshot() {
    return {
      screen: state.screen,
      player: { x: Math.round(state.player.x), y: Math.round(state.player.y), angle: +state.player.angle.toFixed(3), speed: state.player.speed },
      camera: { x: 640, y: 360 },
      alarm: Math.round(state.alarm),
      loot: state.player.lootValue,
      lootTarget: state.player.hasStar,
      tools: { coins: state.player.coins, smoke: state.player.smoke },
      guards: state.guards.map((g) => ({ x: Math.round(g.x), y: Math.round(g.y), angle: +g.angle.toFixed(3), state: g.state })),
      fps: state.fps,
      state: state.screen,
    };
  },
  stage(name) {
    if (name === 'cover') stageCover();
    else if (name === 'patrol') stagePatrol();
    else if (name === 'alarm') stageAlarm();
    else if (name === 'win') stageWin();
    else throw new Error('unknown stage: ' + name);
    return state.screen;
  },
  start() { startPlay(); return state.screen; },
  teleport(x, y) { state.player.x = x; state.player.y = y; return { x: state.player.x, y: state.player.y }; },
  setAlarm(v) { state.alarm = v; return state.alarm; },
};

// ?stage=cover|patrol|alarm|win stages a screenshot state on load.
const stageParam = new URLSearchParams(location.search).get('stage');
if (stageParam) {
  try { window.__game.stage(stageParam); } catch { /* unknown stage: title screen */ }
}

requestAnimationFrame(loop);
