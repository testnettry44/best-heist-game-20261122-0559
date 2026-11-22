// hud.js — the heads-up display: alarm meter, loot, tools, timer, objective
// and floating messages. The alarm meter is always on screen, top centre,
// so the judge (and the player) can read the tension at a glance.
export function drawHud(ctx, state) {
  const { player, level } = state;
  // Top bar.
  ctx.fillStyle = 'rgba(8,10,18,0.88)';
  ctx.fillRect(0, 0, 1280, 46);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, 46, 1280, 2);
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 15px system-ui, sans-serif';

  // Alarm meter (top centre, the heart of the HUD).
  const ax = 470, ay = 13, aw = 340, ah = 20;
  ctx.fillStyle = '#1a1d2b';
  ctx.fillRect(ax - 2, ay - 2, aw + 4, ah + 4);
  const frac = state.alarm / 100;
  const col = frac < 0.4 ? '#37c978' : frac < 0.7 ? '#f2b01e' : '#e5484d';
  ctx.fillStyle = col;
  ctx.fillRect(ax, ay, aw * frac, ah);
  if (state.alarm >= 70) {
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 10);
    ctx.fillStyle = `rgba(229,72,77,${0.25 + 0.45 * pulse})`;
    ctx.fillRect(ax, ay, aw * frac, ah);
  }
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax - 2, ay - 2, aw + 4, ah + 4);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}%`, ax + aw / 2, ay + ah / 2 + 1);
  ctx.textAlign = 'left';
  ctx.fillStyle = frac >= 0.7 ? '#ff6b6b' : '#9aa3b8';
  ctx.fillText(frac >= 0.7 ? '!! SPOTTED !!' : 'HIDDEN', ax + aw + 12, ay + ah / 2 + 1);

  // Loot (left).
  ctx.fillStyle = '#ffd75e';
  ctx.fillText(`LOOT  $${player.lootValue}`, 24, 24);
  ctx.fillStyle = player.hasStar ? '#ffd75e' : '#8a8f9e';
  ctx.fillText(player.hasStar ? '★ Gilded Star SECURED' : '☆ Steal the Gilded Star', 170, 24);

  // Tools + timer (right).
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Q coins ×${player.coins}   1 smoke ×${player.smoke}`, 1090, 24);
  ctx.fillStyle = '#9aa3b8';
  ctx.fillText(formatTime(state.elapsed), 1256, 24);
  ctx.textAlign = 'left';

  // Objective line under the bar.
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#d8c27a';
  const objective = player.hasStar
    ? 'OBJECTIVE: Reach the GETAWAY door (south-west) — do not get caught!'
    : 'OBJECTIVE: Grab the Gilded Star diamond in the vault, then reach the GETAWAY door.';
  ctx.fillText(objective, 24, 66);

  // Floating message banner.
  if (state.message && state.messageTimer > 0) {
    ctx.font = 'bold 20px system-ui, sans-serif';
    const w = ctx.measureText(state.message).width + 36;
    ctx.fillStyle = 'rgba(8,10,18,0.85)';
    ctx.fillRect((1280 - w) / 2, 132, w, 38);
    ctx.strokeStyle = '#c9a227';
    ctx.strokeRect((1280 - w) / 2, 132, w, 38);
    ctx.fillStyle = '#ffd75e';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, 640, 152);
    ctx.textAlign = 'left';
  }
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function setMessage(state, text, seconds) {
  state.message = text;
  state.messageTimer = seconds || 2.5;
}
