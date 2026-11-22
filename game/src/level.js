// level.js — the Marlow Museum floor plan: walls, cover, loot, routes, spawn points.
// One room, 1280x720, fully visible in a single frame. Three routes cross it:
// the main hall (guarded, fastest), the side corridor (longer, quieter) and the
// vent crawlspace along the west wall (slow, hidden from cones).
export const ROOM = { w: 1280, h: 720, wall: 24 };

export function buildLevel() {
  const W = ROOM.wall;
  // Solid walls: outer border + two interior partitions that split the hall
  // into routes without ever closing the room off.
  const walls = [
    { x: 0, y: 0, w: 1280, h: W, kind: 'wall' },
    { x: 0, y: 720 - W, w: 1280, h: W, kind: 'wall' },
    { x: 0, y: 0, w: W, h: 720, kind: 'wall' },
    { x: 1280 - W, y: 0, w: W, h: 720, kind: 'wall' },
    // Interior partitions: each leaves a gap so every route stays open.
    { x: 420, y: 150, w: 26, h: 170, kind: 'wall' },
    { x: 834, y: 400, w: 26, h: 170, kind: 'wall' },
    // Vault shell around the Gilded Star (open at the bottom).
    { x: 540, y: 24, w: 200, h: 18, kind: 'wall' },
    { x: 540, y: 24, w: 18, h: 96, kind: 'wall' },
    { x: 722, y: 24, w: 18, h: 96, kind: 'wall' },
  ];
  // Cover objects: display cases, statues and planters. They block movement
  // AND block vision cones, so the thief plans routes from cover to cover.
  const cover = [
    { x: 190, y: 190, w: 130, h: 64, kind: 'case', label: 'CASE' },
    { x: 960, y: 190, w: 130, h: 64, kind: 'case', label: 'CASE' },
    { x: 190, y: 470, w: 130, h: 64, kind: 'case', label: 'CASE' },
    { x: 960, y: 470, w: 130, h: 64, kind: 'case', label: 'CASE' },
    { x: 600, y: 330, w: 80, h: 80, kind: 'statue', label: 'STATUE' },
    { x: 300, y: 330, w: 46, h: 46, kind: 'planter', label: '' },
    { x: 934, y: 330, w: 46, h: 46, kind: 'planter', label: '' },
    { x: 600, y: 560, w: 80, h: 56, kind: 'case', label: 'CASE' },
  ];
  // Loot: the Gilded Star diamond is the target; the rest is optional bonus
  // placed so grabbing it forces a detour through a patrol lane.
  const loot = [
    { id: 'star', x: 640, y: 78, value: 1000, kind: 'diamond', name: 'Gilded Star', target: true, taken: false },
    { id: 'paint1', x: 300, y: 56, value: 200, kind: 'painting', name: 'Moonlit Canal', target: false, taken: false },
    { id: 'paint2', x: 980, y: 56, value: 200, kind: 'painting', name: 'The Duchess', target: false, taken: false },
    { id: 'paint3', x: 300, y: 668, value: 200, kind: 'painting', name: 'Harbour at Dusk', target: false, taken: false },
    { id: 'gem1', x: 255, y: 282, value: 150, kind: 'gem', name: 'Emerald Brooch', target: false, taken: false },
    { id: 'gem2', x: 1025, y: 445, value: 150, kind: 'gem', name: 'Ruby Pendant', target: false, taken: false },
  ];
  // Vent crawlspace: a marked strip along the west wall. Inside it the thief
  // is hard to spot (detection range halved) but moves slowly.
  const vent = { x: 34, y: 150, w: 58, h: 400 };
  // Getaway door at the south-west corner, with the van waiting outside.
  const exit = { x: 24, y: 620, w: 110, h: 76 };
  const spawn = { x: 90, y: 640 };
  const guards = [
    {
      name: 'Bram', x: 350, y: 300, angle: 0, speed: 55,
      waypoints: [[350, 300], [640, 300], [930, 300], [640, 430], [350, 430]],
    },
    {
      name: 'Odo', x: 420, y: 170, angle: 0, speed: 60,
      waypoints: [[420, 170], [880, 170], [880, 120], [420, 120]],
    },
    {
      name: 'Mira', x: 300, y: 580, angle: 0, speed: 58,
      waypoints: [[300, 580], [980, 580], [980, 630], [300, 630]],
    },
  ];
  const cameras = [
    { id: 'cam1', x: 70, y: 46, base: Math.PI * 0.35, sweep: 0.9, speed: 0.45, phase: 0, range: 260 },
    { id: 'cam2', x: 1210, y: 46, base: Math.PI * 0.65, sweep: 0.9, speed: 0.4, phase: 1.6, range: 260 },
    { id: 'cam3', x: 640, y: 240, base: Math.PI * 0.5, sweep: 1.1, speed: 0.55, phase: 3.1, range: 240 },
  ];
  return { walls, cover, loot, vent, exit, spawn, guards, cameras };
}

// Every solid rectangle that blocks movement and sight.
export function allSolids(level) {
  return level.walls.concat(level.cover);
}

// True when the segment from (x1,y1) to (x2,y2) is blocked by any solid rect.
export function lineBlocked(level, x1, y1, x2, y2) {
  for (const r of allSolids(level)) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: segment vs axis-aligned rect.
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;
  for (const [p, d, lo, hi] of [[x1, dx, r.x, r.x + r.w], [y1, dy, r.y, r.y + r.h]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return false; }
    else {
      let t1 = (lo - p) / d, t2 = (hi - p) / d;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}

// Push a circle (x,y,r) out of every solid rect; returns corrected position.
export function resolveCircleCollision(level, x, y, r) {
  for (const rect of allSolids(level)) {
    const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    const dx = x - cx, dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r; y = cy + (dy / d) * r;
      } else {
        // Centre inside the rect: push out along the smallest penetration.
        const left = x - rect.x, right = rect.x + rect.w - x;
        const top = y - rect.y, bottom = rect.y + rect.h - y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) x = rect.x - r;
        else if (m === right) x = rect.x + rect.w + r;
        else if (m === top) y = rect.y - r;
        else y = rect.y + rect.h + r;
      }
    }
  }
  return { x, y };
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
