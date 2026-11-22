// render.js — all canvas drawing: the museum room, vision cones, cameras,
// characters, loot, smoke, and the title / win / caught screens. The look is
// a night museum: deep-blue marble floor, gold trim, a red carpet runner,
// warm display cases — safe cover, danger and loot obvious at a glance.
import { CONE_HALF, CONE_RANGE } from './guards.js';
import { drawHud, formatTime } from './hud.js';

function conePath(ctx, x, y, angle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - CONE_HALF, angle + CONE_HALF);
  ctx.closePath();
}

export function drawRoom(ctx, state) {
  const { level, time } = state;
  // Floor: dark marble checker.
  ctx.fillStyle = '#232742';
  ctx.fillRect(0, 0, 1280, 720);
  const ts = 80;
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = '#272c4a';
        ctx.fillRect(x * ts, y * ts, ts, ts);
      }
    }
  }
  // Red carpet runner down the main hall.
  ctx.fillStyle = '#6e1f2a';
  ctx.fillRect(560, 24, 160, 672);
  ctx.fillStyle = '#8a2a36';
  ctx.fillRect(568, 24, 144, 672);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(568, 24, 144, 672);

  // Vent crawlspace (west wall): dark grate strip with arrows.
  ctx.fillStyle = '#14161f';
  ctx.fillRect(level.vent.x, level.vent.y, level.vent.w, level.vent.h);
  ctx.strokeStyle = '#4a5168';
  ctx.lineWidth = 2;
  ctx.strokeRect(level.vent.x, level.vent.y, level.vent.w, level.vent.h);
  ctx.fillStyle = '#7dd3a8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VENT', level.vent.x + level.vent.w / 2, level.vent.y + 18);
  ctx.fillText('▼ HIDDEN ▼', level.vent.x + level.vent.w / 2, level.vent.y + level.vent.h - 12);
  ctx.textAlign = 'left';

  // Vault: gold-trimmed room at the north wall holding the Gilded Star.
  ctx.fillStyle = '#3a2f14';
  ctx.fillRect(540, 24, 200, 96);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 3;
  ctx.strokeRect(540, 24, 200, 96);
  ctx.fillStyle = '#ffd75e';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ VAULT ★', 640, 44);
  ctx.textAlign = 'left';

  // Getaway door (south-west) with the van waiting outside the wall.
  ctx.fillStyle = '#1d3a24';
  ctx.fillRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
  ctx.strokeStyle = '#37c978';
  ctx.lineWidth = 3;
  ctx.strokeRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
  ctx.fillStyle = '#7dd3a8';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY', level.exit.x + level.exit.w / 2, level.exit.y + 30);
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('→ VAN', level.exit.x + level.exit.w / 2, level.exit.y + 52);
  ctx.textAlign = 'left';
  // Van silhouette just outside the south wall.
  ctx.fillStyle = '#2c4a63';
  ctx.fillRect(30, 700, 96, 18);
  ctx.fillStyle = '#0e1420';
  ctx.beginPath(); ctx.arc(52, 718, 7, 0, Math.PI * 2); ctx.arc(104, 718, 7, 0, Math.PI * 2); ctx.fill();

  // Walls.
  for (const w of level.walls) {
    ctx.fillStyle = '#3d4260';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#c9a227';
    if (w.h <= 24) ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
    if (w.w <= 26) ctx.fillRect(w.x + w.w - 3, w.y, 3, w.h);
  }

  // Cover: cases (glass + gold), statues (marble), planters (green).
  for (const c of level.cover) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#4a3f1d';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(150,200,255,0.28)';
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
    } else if (c.kind === 'statue') {
      ctx.fillStyle = '#8d93a8';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#b9bfd1';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6e7488';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 8, 12, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#2c5a34';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#3f7d47';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 18, 0, Math.PI * 2); ctx.fill();
    }
    if (c.label) {
      ctx.fillStyle = '#d8c27a';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h - 6);
      ctx.textAlign = 'left';
    }
  }

  // Loot: sparkle + label. The target diamond pulses gold.
  for (const item of level.loot) {
    if (item.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(time * 4 + item.x);
    if (item.kind === 'diamond') {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(Math.PI / 4);
      const s = 16 + 3 * pulse;
      ctx.fillStyle = '#bfe9ff';
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.strokeStyle = '#ffd75e';
      ctx.lineWidth = 3;
      ctx.strokeRect(-s / 2, -s / 2, s, s);
      ctx.restore();
      ctx.fillStyle = '#ffd75e';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◆ GILDED STAR ◆', item.x, item.y + 34);
      ctx.textAlign = 'left';
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(item.x - 26, item.y - 18, 52, 36);
      ctx.fillStyle = item.id === 'paint1' ? '#3f6d8e' : item.id === 'paint2' ? '#8e3f5a' : '#c98a2e';
      ctx.fillRect(item.x - 21, item.y - 13, 42, 26);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x - 26, item.y - 18, 52, 36);
      ctx.fillStyle = '#ffd75e';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`$${item.value}`, item.x, item.y + 32);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = item.id === 'gem1' ? '#37c978' : '#e5484d';
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
      ctx.fillStyle = '#fff';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`$${item.value}`, item.x, item.y + 26);
      ctx.textAlign = 'left';
    }
  }
}

function drawVisionCones(ctx, state) {
  // Camera cones first (amber, underneath guard cones).
  for (const cam of state.cameras) {
    ctx.fillStyle = cam.spotted ? 'rgba(229,72,77,0.30)' : 'rgba(242,176,30,0.22)';
    conePath(ctx, cam.x, cam.y, cam.angle, cam.range);
    ctx.fill();
  }
  for (const g of state.guards) {
    const alert = g.state === 'chase' || g.state === 'alert';
    ctx.fillStyle = alert ? 'rgba(229,72,77,0.34)' : 'rgba(242,214,80,0.20)';
    conePath(ctx, g.x, g.y, g.angle, CONE_RANGE);
    ctx.fill();
    ctx.strokeStyle = alert ? 'rgba(229,72,77,0.6)' : 'rgba(242,214,80,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawCameras(ctx, state) {
  for (const cam of state.cameras) {
    ctx.fillStyle = '#1a1d2b';
    ctx.fillRect(cam.x - 12, cam.y - 8, 24, 16);
    ctx.fillStyle = cam.spotted ? '#e5484d' : '#f2b01e';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAM', cam.x, cam.y - 14);
    ctx.textAlign = 'left';
  }
}

function drawGuards(ctx, state) {
  for (const g of state.guards) {
    // Body: navy uniform, direction tick, name + state tag.
    ctx.fillStyle = '#2b3a6e';
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8fa3e8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath(); ctx.arc(g.x, g.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 22, g.y + Math.sin(g.angle) * 22);
    ctx.stroke();
    ctx.fillStyle = '#cdd3e8';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const tag = g.state === 'chase' ? '!' : g.state === 'investigate' ? '?' : g.state === 'alert' ? '…' : '';
    ctx.fillText(`${g.name} ${tag}`, g.x, g.y - 22);
    ctx.textAlign = 'left';
    if (g.state === 'chase') {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPOTTED!', g.x, g.y - 36);
      ctx.textAlign = 'left';
    }
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  // Sneak = crouched (smaller, dimmer); smoke cloud around the thief.
  ctx.fillStyle = '#101018';
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r + (p.sneak ? -3 : 0), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd75e';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Mask + eyes.
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(p.x - 4, p.y - 2, 2.5, 0, Math.PI * 2); ctx.arc(p.x + 4, p.y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#101018';
  ctx.beginPath(); ctx.arc(p.x - 4, p.y - 2, 1.2, 0, Math.PI * 2); ctx.arc(p.x + 4, p.y - 2, 1.2, 0, Math.PI * 2); ctx.fill();
  // Facing tick + loot sack when carrying the Star.
  ctx.strokeStyle = '#ffd75e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.angle) * 20, p.y + Math.sin(p.angle) * 20);
  ctx.stroke();
  if (p.hasStar) {
    ctx.fillStyle = '#ffd75e';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', p.x, p.y - 20);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.sneak ? 'THIEF · SNEAKING' : 'THIEF', p.x, p.y + 28);
  ctx.textAlign = 'left';
}

function drawEffects(ctx, state) {
  for (const c of state.smokes) {
    ctx.fillStyle = 'rgba(180,190,210,0.45)';
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,230,245,0.35)';
    ctx.beginPath(); ctx.arc(c.x - 20, c.y + 10, c.r * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  for (const d of state.distractions) {
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd75e';
    ctx.beginPath(); ctx.arc(d.x, d.y, 10 + 4 * Math.sin(state.time * 8), 0, Math.PI * 2); ctx.stroke();
  }
  // Alarm vignette: the higher the alarm, the redder the edges.
  if (state.alarm > 35) {
    const a = Math.min(0.45, (state.alarm - 35) / 100 * 0.8);
    const grad = ctx.createRadialGradient(640, 360, 260, 640, 360, 720);
    grad.addColorStop(0, 'rgba(229,72,77,0)');
    grad.addColorStop(1, `rgba(229,72,77,${a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
  }
}

export function drawPlay(ctx, state) {
  drawRoom(ctx, state);
  drawVisionCones(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawPlayer(ctx, state);
  drawEffects(ctx, state);
  drawHud(ctx, state);
  if (state.screen === 'paused') {
    ctx.fillStyle = 'rgba(8,10,18,0.7)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 640, 350);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Press P to resume', 640, 395);
    ctx.textAlign = 'left';
  }
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8,10,18,0.92)';
  ctx.fillRect(290, 110, 700, 500);
  ctx.strokeStyle = accent || '#c9a227';
  ctx.lineWidth = 3;
  ctx.strokeRect(290, 110, 700, 500);
  ctx.fillStyle = accent || '#ffd75e';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 180);
  ctx.fillStyle = '#e8eaf2';
  ctx.font = '18px system-ui, sans-serif';
  let y = 235;
  for (const line of lines) { ctx.fillText(line, 640, y); y += 34; }
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, state) {
  // Night museum backdrop: reuse the room, dimmed, behind the panel.
  drawRoom(ctx, state);
  drawVisionCones(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawPlayer(ctx, state);
  ctx.fillStyle = 'rgba(8,10,18,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ffd75e';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— A ONE-ROOM STEALTH HEIST —', 640, 96);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('THE MARLOW', 640, 168);
  ctx.fillText('MUSEUM HEIST', 640, 238);
  ctx.fillStyle = '#d8c27a';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Steal the Gilded Star diamond. Dodge the cones. Reach the getaway van.', 640, 282);
  ctx.fillStyle = '#e8eaf2';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('WASD / Arrows — move      Shift — sneak (slower, harder to spot)', 640, 340);
  ctx.fillText('E — grab loot      Q — toss a coin (distracts a guard, −$50)', 640, 372);
  ctx.fillText('1 — smoke pellet (blocks vision, −$100)      P — pause      M — mute', 640, 404);
  ctx.fillText('Hide behind cases and statues — they block vision cones.', 640, 436);
  ctx.fillText('The vent along the west wall hides you, but you crawl slowly.', 640, 468);
  const blink = 0.6 + 0.4 * Math.sin(state.time * 4);
  ctx.fillStyle = `rgba(255,215,94,${blink})`;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('Press ENTER to start', 640, 540);
  ctx.fillStyle = '#9aa3b8';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('3 guards on patrol · 3 security cameras · 1 alarm meter · 1 getaway van', 640, 580);
  ctx.textAlign = 'left';
}

export function drawWin(ctx, state) {
  drawPlay(ctx, state);
  ctx.fillStyle = 'rgba(8,10,18,0.75)';
  ctx.fillRect(0, 0, 1280, 720);
  const p = state.player;
  const timeBonus = Math.max(0, 600 - Math.floor(state.elapsed) * 2);
  const total = p.score + timeBonus;
  const rating = total >= 1600 ? 'S — LEGENDARY THIEF' : total >= 1200 ? 'A — MASTER THIEF' : total >= 800 ? 'B — CLEAN GETAWAY' : 'C — JUST MADE IT';
  panel(ctx, 'CLEAN GETAWAY!', [
    'You slipped out with the Gilded Star and vanished into the night.',
    `Loot stolen: $${p.lootValue}  (${p.lootCount} pieces)`,
    `Tools spent: $${p.toolCost}   Time: ${formatTime(state.elapsed)}`,
    `Time bonus: $${timeBonus}   Final score: $${total}`,
    `Rating: ${rating}`,
    '',
    'Press ENTER to play again — or R to restart at once.',
  ], '#37c978');
}

export function drawCaught(ctx, state) {
  drawPlay(ctx, state);
  ctx.fillStyle = 'rgba(40,6,10,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, 'CAUGHT!', [
    state.caughtReason || 'Security caught you.',
    `Loot kept: $${state.player.lootValue}  (${state.player.lootCount} pieces)`,
    `Alarm reached: ${Math.round(state.alarm)}%   Time: ${formatTime(state.elapsed)}`,
    '',
    'Tip: watch the cones sweep, sneak past, and use the vent or a coin',
    'to pull a guard away before you cross the open floor.',
    '',
    'Press ENTER or R to try again.',
  ], '#e5484d');
}
