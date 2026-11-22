// cameras.js — wall-mounted security cameras with rotating amber cones.
// A camera that spots the thief raises the alarm, but never catches alone:
// the thief can break line of sight and let the alarm decay.
import { lineBlocked, pointInRect } from './level.js';
import { playerInSmoke } from './player.js';
import { angleDiff, CONE_HALF } from './guards.js';

export function createCameras(defs) {
  return defs.map((d) => ({ ...d, angle: d.base, spotted: false }));
}

export function updateCameras(cameras, t) {
  for (const c of cameras) {
    c.angle = c.base + Math.sin(t * c.speed + c.phase) * c.sweep;
  }
}

export function cameraSeesThief(cam, player, level, state) {
  if (playerInSmoke(state, player.x, player.y)) return false;
  const dx = player.x - cam.x, dy = player.y - cam.y;
  const dist = Math.hypot(dx, dy);
  let range = cam.range;
  if (player.sneak) range *= 0.62;
  if (pointInRect(player.x, player.y, level.vent)) range *= 0.5;
  if (dist > range) return false;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, cam.angle)) > CONE_HALF) return false;
  if (lineBlocked(level, cam.x, cam.y, player.x, player.y)) return false;
  return true;
}
