// Draws the gallery: floors, walls and cover, vision cones, guards, cameras,
// loot, Wren, smoke, the dark corridor and alarm effects.
import { W, H, COLORS, GUARD, CAMERA } from './config.js';
import { conePoly } from './geometry.js';
import { ZONES, DOORS_UPPER, DOORS_LOWER, EXIT, START } from './level.js';
import { viewAngle } from './guards.js';
import { cameraLive } from './cameras.js';

let bgLayer = null;
let propLayer = null;
let darkLayer = null;

const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
}

function clipRect(x, z) {
  x.beginPath();
  x.rect(z.x, z.y, z.w, z.h);
  x.clip();
}

// ---------- static layers ----------

function buildFloor() {
  const c = makeCanvas();
  const x = c.getContext('2d');
  x.fillStyle = '#06070b';
  x.fillRect(0, 0, W, H);
  const [gal, hall, cor] = ZONES;

  // Side Gallery: warm parquet
  x.save(); clipRect(x, gal);
  const woods = ['#2d2119', '#33261c', '#291e16', '#30231a'];
  for (let r = 0, y = gal.y; y < gal.y + gal.h; r++, y += 16) {
    for (let k = -1, xx = gal.x - (r % 2) * 32; xx < gal.x + gal.w; k++, xx += 64) {
      x.fillStyle = woods[Math.floor(hash(r * 97 + k) * woods.length)];
      x.fillRect(xx, y, 64, 16);
      x.strokeStyle = 'rgba(0,0,0,0.35)';
      x.strokeRect(xx + 0.5, y + 0.5, 64, 16);
    }
  }
  x.restore();

  // Main Hall: dark marble tiles with veins
  x.save(); clipRect(x, hall);
  for (let i = 0; i < 27; i++) {
    for (let j = 0; j < 8; j++) {
      const tx = hall.x + i * 48, ty = hall.y + j * 48;
      x.fillStyle = (i + j) % 2 ? '#1c1f2e' : '#222638';
      x.fillRect(tx, ty, 48, 48);
      x.strokeStyle = 'rgba(255,255,255,0.045)';
      x.beginPath();
      x.moveTo(tx + hash(i * 13 + j) * 48, ty);
      x.quadraticCurveTo(tx + hash(i + j * 7) * 48, ty + 24, tx + hash(i * 5 + j * 3) * 48, ty + 48);
      x.stroke();
    }
  }
  // crimson rug around the Diamond plinth
  x.fillStyle = '#3b1322';
  x.fillRect(742, 322, 356, 304);
  x.strokeStyle = 'rgba(226,184,79,0.75)';
  x.lineWidth = 3;
  x.strokeRect(752, 332, 336, 284);
  x.lineWidth = 1;
  x.strokeStyle = 'rgba(226,184,79,0.25)';
  for (let k = 0; k < 6; k++) {
    x.beginPath();
    const cx = 920, cy = 474, s = 40 + k * 22;
    x.moveTo(cx, cy - s); x.lineTo(cx + s * 1.2, cy); x.lineTo(cx, cy + s); x.lineTo(cx - s * 1.2, cy); x.closePath();
    x.stroke();
  }
  // runner carpet from the west door
  x.fillStyle = '#2a1630';
  x.fillRect(36, 486, 200, 30);
  x.restore();

  // Maintenance Corridor: steel grating and pipes
  x.save(); clipRect(x, cor);
  x.fillStyle = '#14171c';
  x.fillRect(cor.x, cor.y, cor.w, cor.h);
  x.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let gx = cor.x; gx < cor.x + cor.w; gx += 12) { x.beginPath(); x.moveTo(gx, cor.y); x.lineTo(gx, cor.y + cor.h); x.stroke(); }
  for (let gy = cor.y; gy < cor.y + cor.h; gy += 12) { x.beginPath(); x.moveTo(cor.x, gy); x.lineTo(cor.x + cor.w, gy); x.stroke(); }
  x.strokeStyle = '#2f4544'; x.lineWidth = 6;
  x.beginPath(); x.moveTo(cor.x, 767); x.lineTo(cor.x + cor.w, 767); x.stroke();
  x.strokeStyle = '#4a3a2a'; x.lineWidth = 4;
  x.beginPath(); x.moveTo(cor.x, 671); x.lineTo(cor.x + cor.w, 671); x.stroke();
  x.lineWidth = 1;
  x.restore();

  // door thresholds
  x.fillStyle = 'rgba(226,184,79,0.18)';
  for (const [a, b] of DOORS_UPPER) x.fillRect(a, 280, b - a, 16);
  for (const [a, b] of DOORS_LOWER) x.fillRect(a, 650, b - a, 16);

  // zone signage: the three routes
  x.font = '700 13px "Segoe UI", Helvetica, Arial, sans-serif';
  x.fillStyle = 'rgba(226,184,79,0.55)';
  x.fillText('SIDE GALLERY  ·  3 SAFES  ·  1 CAMERA', 440, 272);
  x.fillText('MAIN HALL  ·  GUARDED  ·  2 CAMERAS', 180, 316);
  x.fillStyle = 'rgba(140,200,190,0.5)';
  x.fillText('MAINTENANCE CORRIDOR  ·  DARK  ·  NO CAMERAS  ·  SLOW', 330, 760);
  return c;
}

function drawWall(x, q) {
  x.fillStyle = 'rgba(0,0,0,0.35)';
  x.fillRect(q.x + 3, q.y + 4, q.w, q.h);
  const gr = x.createLinearGradient(0, q.y, 0, q.y + q.h);
  gr.addColorStop(0, COLORS.wallTop);
  gr.addColorStop(1, COLORS.wall);
  x.fillStyle = gr;
  x.fillRect(q.x, q.y, q.w, q.h);
  x.strokeStyle = 'rgba(226,184,79,0.55)';
  x.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
}

function drawProp(x, q) {
  x.fillStyle = 'rgba(0,0,0,0.4)';
  x.fillRect(q.x + 4, q.y + 5, q.w, q.h);
  const cx = q.x + q.w / 2, cy = q.y + q.h / 2;
  switch (q.kind) {
    case 'case': {
      x.fillStyle = '#2b3348'; x.fillRect(q.x, q.y, q.w, q.h);
      x.fillStyle = 'rgba(150,215,255,0.16)'; x.fillRect(q.x + 3, q.y + 3, q.w - 6, q.h - 6);
      for (let i = 0; i < 4; i++) {
        x.fillStyle = q.label === 'Amber Moths' ? '#e9a33a' : '#5fd0d8';
        x.beginPath(); x.arc(q.x + 14 + i * 16, cy + (i % 2 ? 4 : -4), 4, 0, Math.PI * 2); x.fill();
      }
      x.strokeStyle = 'rgba(255,255,255,0.35)';
      x.beginPath(); x.moveTo(q.x + 6, q.y + q.h - 6); x.lineTo(q.x + 22, q.y + 6); x.stroke();
      x.strokeStyle = '#a9c3d6'; x.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
      break;
    }
    case 'pedestal': case 'statue': {
      x.fillStyle = '#cfc8b8'; x.fillRect(q.x, q.y, q.w, q.h);
      x.fillStyle = '#e8e2d4'; x.fillRect(q.x + 3, q.y + 3, q.w - 6, q.h - 6);
      if (q.kind === 'statue') {
        const g = x.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, q.w * 0.42);
        g.addColorStop(0, '#d8a85a'); g.addColorStop(1, '#5a3c18');
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, q.w * 0.36, 0, Math.PI * 2); x.fill();
      } else {
        x.fillStyle = '#4f6fa8'; x.beginPath(); x.arc(cx, cy, q.w * 0.24, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#9fb8e8'; x.beginPath(); x.arc(cx - 3, cy - 3, q.w * 0.08, 0, Math.PI * 2); x.fill();
      }
      x.strokeStyle = '#8f887a'; x.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
      break;
    }
    case 'bench':
      x.fillStyle = '#5a3d29'; x.fillRect(q.x, q.y, q.w, q.h);
      x.strokeStyle = 'rgba(0,0,0,0.4)';
      for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(q.x, q.y + (q.h / 4) * i); x.lineTo(q.x + q.w, q.y + (q.h / 4) * i); x.stroke(); }
      break;
    case 'panel':
      x.fillStyle = '#3a3d52'; x.fillRect(q.x, q.y, q.w, q.h);
      x.strokeStyle = COLORS.gold; x.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
      break;
    case 'crate':
      x.fillStyle = '#5b4631'; x.fillRect(q.x, q.y, q.w, q.h);
      x.strokeStyle = '#2e2217'; x.lineWidth = 2;
      x.strokeRect(q.x + 1, q.y + 1, q.w - 2, q.h - 2);
      x.beginPath(); x.moveTo(q.x, q.y); x.lineTo(q.x + q.w, q.y + q.h); x.moveTo(q.x + q.w, q.y); x.lineTo(q.x, q.y + q.h); x.stroke();
      x.lineWidth = 1;
      break;
  }
}

function drawPaintings(x) {
  // Original abstract canvases hung on the gallery walls.
  const spots = [[150, 92, 0], [520, 92, 1], [640, 280, 2], [1000, 92, 3], [420, 280, 4], [980, 280, 5], [1140, 280, 6]];
  const palettes = [['#e86f51', '#f4c95d'], ['#3d6fd6', '#91e0ff'], ['#7b4fd6', '#ff7ab6'], ['#2fa36b', '#d8f06a'], ['#d6493d', '#3a2b5c'], ['#f0a35e', '#5c2a4f'], ['#4fc3c3', '#1f3c6b']];
  for (const [px, py, k] of spots) {
    if (py === 280 && DOORS_UPPER.some(([a, b]) => px + 48 > a && px < b)) continue;
    const g = x.createLinearGradient(px, py, px + 48, py);
    g.addColorStop(0, palettes[k][0]); g.addColorStop(1, palettes[k][1]);
    const yy = py === 92 ? py : py + 16;
    x.fillStyle = COLORS.gold; x.fillRect(px - 2, yy - 1, 52, 9);
    x.fillStyle = g; x.fillRect(px, yy, 48, 6);
  }
}

function buildProps(level) {
  const c = makeCanvas();
  const x = c.getContext('2d');
  for (const q of level.props) drawProp(x, q);
  for (const q of level.walls) drawWall(x, q);
  drawPaintings(x);
  // the entry vent where Wren drops in
  x.fillStyle = '#0c0e12'; x.fillRect(START.x - 18, START.y - 14, 36, 28);
  x.strokeStyle = '#6a7c80';
  for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(START.x - 15, START.y - 10 + i * 5); x.lineTo(START.x + 15, START.y - 10 + i * 5); x.stroke(); }
  return c;
}

// ---------- dynamic pieces ----------

function fillPoly(x, pts) {
  x.beginPath();
  x.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]);
  x.closePath();
}

function drawCone(x, ox, oy, pts, range, rgb, a0, a1) {
  const g = x.createRadialGradient(ox, oy, 4, ox, oy, range);
  g.addColorStop(0, `rgba(${rgb},${a0})`);
  g.addColorStop(1, `rgba(${rgb},${a1})`);
  fillPoly(x, pts);
  x.fillStyle = g;
  x.fill();
  x.strokeStyle = `rgba(${rgb},0.55)`;
  x.lineWidth = 1.2;
  x.stroke();
  x.lineWidth = 1;
}

function guardConeColor(gd, g) {
  if (g.lockdown || gd.seeing) return COLORS.seenCone;
  if (gd.state === 'investigate' || gd.state === 'alert') return '255,130,50';
  return COLORS.guardCone;
}

function drawCones(x, g) {
  const sight = g.level.sight;
  for (const c of g.cameras) {
    if (c.disabled) continue;
    const pts = conePoly(c.x, c.y, c.angle, CAMERA.half, c.range, sight, g.smokes, 30);
    if (!cameraLive(c, g)) drawCone(x, c.x, c.y, pts, c.range, '120,130,255', 0.12, 0.02);
    else drawCone(x, c.x, c.y, pts, c.range, c.seeing ? COLORS.seenCone : COLORS.camCone, c.seeing ? 0.5 : 0.34, 0.05);
  }
  for (const gd of g.guards) {
    const a = viewAngle(gd);
    const pts = conePoly(gd.x, gd.y, a, gd.half, gd.range, sight, g.smokes, 44);
    const rgb = guardConeColor(gd, g);
    drawCone(x, gd.x, gd.y, pts, gd.range, rgb, gd.seeing ? 0.55 : 0.4, 0.04);
  }
}

function drawDiamond(x, g) {
  const d = g.loot.diamond;
  const t = g.time;
  const r = d.w / 2;
  // glow
  if (!d.taken) {
    x.save();
    x.globalCompositeOperation = 'lighter';
    const gr = x.createRadialGradient(d.x, d.y, 6, d.x, d.y, 120 + Math.sin(t * 2.4) * 12);
    gr.addColorStop(0, 'rgba(255,150,70,0.55)');
    gr.addColorStop(0.4, 'rgba(255,90,90,0.18)');
    gr.addColorStop(1, 'rgba(255,90,90,0)');
    x.fillStyle = gr;
    x.fillRect(d.x - 140, d.y - 140, 280, 280);
    x.restore();
  }
  // plinth + glass case
  x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(d.x - r + 5, d.y - r + 6, d.w, d.h);
  x.fillStyle = '#e9e1cf'; x.fillRect(d.x - r, d.y - r, d.w, d.h);
  x.fillStyle = '#4a0f22'; x.fillRect(d.x - r + 7, d.y - r + 7, d.w - 14, d.h - 14);
  x.strokeStyle = COLORS.gold; x.lineWidth = 2; x.strokeRect(d.x - r + 1, d.y - r + 1, d.w - 2, d.h - 2); x.lineWidth = 1;
  if (!d.taken) {
    const s = 15;
    const gg = x.createLinearGradient(d.x - s, d.y - s, d.x + s, d.y + s);
    gg.addColorStop(0, '#fff3a8'); gg.addColorStop(0.45, '#ff9a3c'); gg.addColorStop(1, '#ff3d6e');
    x.fillStyle = gg;
    x.beginPath();
    x.moveTo(d.x, d.y - s); x.lineTo(d.x + s, d.y - 4); x.lineTo(d.x + s * 0.7, d.y + 5); x.lineTo(d.x, d.y + s);
    x.lineTo(d.x - s * 0.7, d.y + 5); x.lineTo(d.x - s, d.y - 4); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.7)';
    x.beginPath(); x.moveTo(d.x - s, d.y - 4); x.lineTo(d.x + s, d.y - 4); x.moveTo(d.x, d.y - s); x.lineTo(d.x - 5, d.y - 4); x.lineTo(d.x, d.y + s); x.lineTo(d.x + 5, d.y - 4); x.lineTo(d.x, d.y - s); x.stroke();
    // twinkle
    const k = (Math.sin(t * 3.1) + 1) / 2;
    x.strokeStyle = `rgba(255,255,255,${0.4 + k * 0.6})`;
    const sx = d.x + 9, sy = d.y - 10, L = 4 + k * 6;
    x.beginPath(); x.moveTo(sx - L, sy); x.lineTo(sx + L, sy); x.moveTo(sx, sy - L); x.lineTo(sx, sy + L); x.stroke();
  } else {
    x.fillStyle = 'rgba(255,255,255,0.25)';
    x.font = '700 9px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center';
    x.fillText('EMPTY', d.x, d.y + 3); x.textAlign = 'left';
  }
  // glass sheen
  x.fillStyle = 'rgba(190,230,255,0.12)'; x.fillRect(d.x - r + 3, d.y - r + 3, d.w - 6, d.h - 6);
  x.strokeStyle = 'rgba(255,255,255,0.4)';
  x.beginPath(); x.moveTo(d.x - r + 8, d.y + r - 10); x.lineTo(d.x - r + 26, d.y - r + 8); x.stroke();
}

function drawSafes(x, g) {
  for (const s of g.loot.safes) {
    const L = s.x - s.w / 2, T = s.y - s.h / 2;
    x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(L + 3, T + 4, s.w, s.h);
    x.fillStyle = s.opened ? '#1a2128' : '#506a82';
    x.fillRect(L, T, s.w, s.h);
    x.strokeStyle = s.opened ? '#3c4a56' : '#a9c0d4';
    x.strokeRect(L + 0.5, T + 0.5, s.w - 1, s.h - 1);
    if (!s.opened) {
      x.fillStyle = '#c9d6e2'; x.beginPath(); x.arc(s.x, s.y, 7, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#2b3a48'; x.beginPath(); x.moveTo(s.x, s.y); x.lineTo(s.x + Math.cos(g.time) * 6, s.y + Math.sin(g.time) * 6); x.stroke();
      // loot sparkle tag
      x.fillStyle = COLORS.gold; x.font = '700 11px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center';
      x.fillText('$', s.x + s.w / 2 + 6, T + 4); x.textAlign = 'left';
    } else {
      x.fillStyle = '#5bd68a'; x.font = '700 12px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center';
      x.fillText('✓', s.x, s.y + 4); x.textAlign = 'left';
    }
  }
}

function drawExit(x, g) {
  const t = g.time;
  const ready = g.diamondTaken;
  const col = ready ? '80,255,160' : '226,184,79';
  x.save();
  x.setLineDash([6, 5]);
  x.lineDashOffset = -t * 20;
  x.strokeStyle = `rgba(${col},${0.6 + Math.sin(t * 4) * 0.3})`;
  x.lineWidth = 2;
  x.beginPath(); x.arc(EXIT.x, EXIT.y, 24 + Math.sin(t * 3) * 2, 0, Math.PI * 2); x.stroke();
  x.restore();
  x.fillStyle = `rgba(${col},0.14)`; x.beginPath(); x.arc(EXIT.x, EXIT.y, 22, 0, Math.PI * 2); x.fill();
  // rope coil
  x.strokeStyle = '#c8a46a'; x.lineWidth = 3;
  x.beginPath(); x.arc(EXIT.x, EXIT.y, 7, 0, Math.PI * 1.7); x.stroke();
  x.beginPath(); x.moveTo(EXIT.x, EXIT.y); x.lineTo(EXIT.x + 2, EXIT.y - 40); x.stroke();
  x.lineWidth = 1;
  x.fillStyle = `rgb(${col})`;
  x.font = '700 11px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center';
  x.fillText(ready ? 'GETAWAY ▲' : 'EXIT · SKYLIGHT ROPE', EXIT.x + 30, EXIT.y + 40);
  x.textAlign = 'left';
}

function drawCameras(x, g) {
  for (const c of g.cameras) {
    x.save();
    x.translate(c.x, c.y);
    x.fillStyle = '#1d2230'; x.beginPath(); x.arc(0, 0, 7, 0, Math.PI * 2); x.fill();
    x.rotate(c.angle);
    x.fillStyle = c.disabled ? '#3d3d44' : '#c8ccd8';
    x.fillRect(-2, -6, 18, 12);
    x.fillStyle = '#111'; x.fillRect(14, -4, 4, 8);
    x.restore();
    let led = '#ff3b3b';
    if (c.disabled) led = '#555';
    else if (!cameraLive(c, g)) led = '#7f8cff';
    else if (!c.seeing && Math.sin(g.time * 6) < 0) led = '#661515';
    x.fillStyle = led; x.beginPath(); x.arc(c.x, c.y, 3, 0, Math.PI * 2); x.fill();
    if (c.disabled) {
      x.strokeStyle = '#ff6b6b'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(c.x - 6, c.y - 6); x.lineTo(c.x + 6, c.y + 6); x.moveTo(c.x + 6, c.y - 6); x.lineTo(c.x - 6, c.y + 6); x.stroke();
      x.lineWidth = 1;
    }
  }
}

function drawGuards(x, g) {
  for (const gd of g.guards) {
    const a = gd.facing;
    x.fillStyle = 'rgba(0,0,0,0.4)'; x.beginPath(); x.ellipse(gd.x + 3, gd.y + 4, 14, 11, 0, 0, Math.PI * 2); x.fill();
    x.save();
    x.translate(gd.x, gd.y);
    x.rotate(a);
    x.fillStyle = '#2b3d6b'; x.beginPath(); x.ellipse(0, 0, 9, GUARD.r + 2, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = COLORS.gold; x.fillRect(-3, -GUARD.r - 1, 5, 4); x.fillRect(-3, GUARD.r - 3, 5, 4);
    if (gd.flashlight) { x.fillStyle = '#ffe9a8'; x.fillRect(8, 5, 8, 4); }
    x.fillStyle = '#d9b48c'; x.beginPath(); x.arc(1, 0, 6.5, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#141b33'; x.beginPath(); x.arc(-1, 0, 6, Math.PI * 0.5, Math.PI * 1.5); x.fill();
    x.fillRect(4, -4, 4, 8);
    x.restore();
    let mark = null, col = '#ff3b3b';
    if (gd.state === 'chase') mark = '!!';
    else if (gd.seeing) mark = '!';
    else if (gd.state === 'investigate' || gd.state === 'return') { mark = '?'; col = '#ffb347'; }
    if (mark) {
      x.font = '900 18px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center';
      x.fillStyle = '#000'; x.fillText(mark, gd.x + 1, gd.y - 19);
      x.fillStyle = col; x.fillText(mark, gd.x, gd.y - 20);
      x.textAlign = 'left';
    }
  }
}

function drawWren(x, g) {
  const p = g.player;
  if (p.noise > 0) {
    x.save();
    x.setLineDash([3, 6]);
    x.strokeStyle = 'rgba(255,255,255,0.22)';
    x.beginPath(); x.arc(p.x, p.y, p.noise, 0, Math.PI * 2); x.stroke();
    x.restore();
  }
  if (p.carrying) {
    const gr = x.createRadialGradient(p.x, p.y, 2, p.x, p.y, 34);
    gr.addColorStop(0, 'rgba(255,140,60,0.55)'); gr.addColorStop(1, 'rgba(255,140,60,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(p.x, p.y, 34, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.ellipse(p.x + 3, p.y + 4, 12, 10, 0, 0, Math.PI * 2); x.fill();
  x.save();
  x.translate(p.x, p.y);
  x.rotate(p.facing);
  // scarf tail streaming behind
  x.strokeStyle = COLORS.wrenScarf; x.lineWidth = 3; x.lineCap = 'round';
  const wave = Math.sin(g.time * 10) * (p.moving ? 3 : 1);
  x.beginPath(); x.moveTo(-4, 2); x.quadraticCurveTo(-12, 4 + wave, -19, wave * 1.5); x.stroke();
  x.lineWidth = 1; x.lineCap = 'butt';
  const s = p.sneaking ? 0.9 : 1;
  x.fillStyle = COLORS.wren; x.beginPath(); x.ellipse(0, 0, 9 * s, 12 * s, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#2a1846'; x.beginPath(); x.arc(1, 0, 7 * s, 0, Math.PI * 2); x.fill();
  x.fillStyle = COLORS.wrenScarf; x.fillRect(-2, -6 * s, 3, 12 * s);
  x.fillStyle = '#f6f0ff'; x.fillRect(5, -3, 2, 2); x.fillRect(5, 1, 2, 2);
  x.restore();
  // name tag
  x.font = '800 10px "Segoe UI", Arial, sans-serif'; x.textAlign = 'center';
  x.fillStyle = 'rgba(10,8,20,0.75)'; x.fillRect(p.x - 18, p.y - 30, 36, 13);
  x.fillStyle = COLORS.wrenScarf; x.fillText('WREN', p.x, p.y - 20);
  x.textAlign = 'left';
}

function drawSmoke(x, g) {
  for (const s of g.smokes) {
    if (s.r < 2) continue;
    for (let i = 0; i < 9; i++) {
      const a = hash(s.seed * 31 + i) * Math.PI * 2 + s.age * 0.3 * (i % 2 ? 1 : -1);
      const d = hash(s.seed * 17 + i * 3) * s.r * 0.55;
      const px = s.x + Math.cos(a) * d, py = s.y + Math.sin(a) * d;
      const rr = s.r * (0.45 + hash(i + s.seed) * 0.3);
      const gr = x.createRadialGradient(px, py, 2, px, py, rr);
      gr.addColorStop(0, 'rgba(200,205,215,0.75)');
      gr.addColorStop(1, 'rgba(160,165,180,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(px, py, rr, 0, Math.PI * 2); x.fill();
    }
  }
}

function drawDarkness(ctx, g) {
  if (!darkLayer) darkLayer = makeCanvas();
  const x = darkLayer.getContext('2d');
  const cor = ZONES[2];
  x.clearRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = 'rgba(2,3,9,0.86)';
  x.fillRect(cor.x, cor.y, cor.w, cor.h);
  x.globalCompositeOperation = 'destination-out';
  const p = g.player;
  if (g.mode !== 'menu') {
    const gr = x.createRadialGradient(p.x, p.y, 8, p.x, p.y, 80);
    gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(p.x - 80, p.y - 80, 160, 160);
  }
  for (const gd of g.guards) {
    if (!gd.flashlight) continue;
    fillPoly(x, conePoly(gd.x, gd.y, viewAngle(gd), gd.half, gd.range, g.level.sight, g.smokes, 30));
    x.fillStyle = 'rgba(0,0,0,0.85)'; x.fill();
    x.beginPath(); x.arc(gd.x, gd.y, 22, 0, Math.PI * 2); x.fill();
  }
  // light spilling under the hall doors
  for (const [a, b] of DOORS_LOWER) {
    const gr = x.createLinearGradient(0, 666, 0, 720);
    gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(a - 10, 666, b - a + 20, 54);
  }
  x.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkLayer, 0, 0);
}

function drawPrompt(x, g) {
  const f = g.focus;
  if (!f || g.mode !== 'play') return;
  const tx = f.ref.x, ty = f.ref.y;
  const busy = g.interact.ref === f.ref;
  if (busy) {
    const k = g.interact.p / g.interact.dur;
    x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 6;
    x.beginPath(); x.arc(tx, ty, 26, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = COLORS.wrenScarf; x.lineWidth = 4;
    x.beginPath(); x.arc(tx, ty, 26, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); x.stroke();
    x.lineWidth = 1;
  }
  const label = busy ? `${f.label}…` : `[E] ${f.label}`;
  x.font = '700 12px "Segoe UI", Arial, sans-serif';
  const w = x.measureText(label).width + 14;
  const py = ty < 160 ? ty + 40 : ty - 46;
  x.fillStyle = 'rgba(8,8,16,0.85)'; x.fillRect(tx - w / 2, py - 13, w, 19);
  x.strokeStyle = COLORS.wrenScarf; x.strokeRect(tx - w / 2 + 0.5, py - 12.5, w - 1, 18);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(label, tx, py + 1); x.textAlign = 'left';
}

function drawEffects(x, g) {
  if (g.empWave) {
    const r = g.empWave.age * 1100;
    x.strokeStyle = `rgba(130,150,255,${Math.max(0, 1 - g.empWave.age / 1.4)})`;
    x.lineWidth = 6;
    x.beginPath(); x.arc(g.empWave.x, g.empWave.y, r, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 1;
  }
  if (g.lockdown) {
    const k = 0.5 + 0.5 * Math.sin(g.time * 18);
    const gr = x.createRadialGradient(W / 2, H / 2, 260, W / 2, H / 2, 760);
    gr.addColorStop(0, 'rgba(255,0,0,0)');
    gr.addColorStop(1, `rgba(255,20,20,${0.25 + k * 0.3})`);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
  } else if (g.alarm > 60 && g.mode === 'play') {
    const gr = x.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 800);
    gr.addColorStop(0, 'rgba(255,0,0,0)');
    gr.addColorStop(1, `rgba(255,40,20,${(g.alarm - 60) / 220})`);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
  }
  if (g.mode === 'caught' || g.mode === 'busted') {
    // spotlight on Wren: the moment of the bust
    x.save();
    x.fillStyle = 'rgba(30,0,0,0.6)';
    x.beginPath(); x.rect(0, 0, W, H); x.arc(g.player.x, g.player.y, 46, 0, Math.PI * 2, true); x.fill('evenodd');
    x.strokeStyle = '#ff3b3b'; x.lineWidth = 3;
    x.beginPath(); x.arc(g.player.x, g.player.y, 46, 0, Math.PI * 2); x.stroke();
    x.restore();
  }
}

export function renderWorld(ctx, g) {
  if (!bgLayer) { bgLayer = buildFloor(); propLayer = buildProps(g.level); }
  ctx.drawImage(bgLayer, 0, 0);
  drawCones(ctx, g);
  drawExit(ctx, g);
  ctx.drawImage(propLayer, 0, 0);
  drawSafes(ctx, g);
  drawDiamond(ctx, g);
  drawCameras(ctx, g);
  drawGuards(ctx, g);
  if (g.mode !== 'menu' && g.mode !== 'won') drawWren(ctx, g);
  drawSmoke(ctx, g);
  drawDarkness(ctx, g);
  drawPrompt(ctx, g);
  drawEffects(ctx, g);
}

