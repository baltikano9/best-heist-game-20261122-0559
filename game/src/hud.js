// Top bar: title + objective, the alarm meter, loot, tools and the clock.
import { W, HUD_H, COLORS } from './config.js';
import { objective } from './game.js';

const SANS = '"Segoe UI", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

export const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
export const clock = (t) => {
  const s = Math.floor(t);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function pips(x, n, max, cx, cy, col) {
  for (let i = 0; i < max; i++) {
    x.beginPath(); x.arc(cx + i * 13, cy, 4.5, 0, Math.PI * 2);
    x.fillStyle = i < n ? col : 'rgba(255,255,255,0.12)';
    x.fill();
  }
}

function alarmMeter(x, g) {
  const mx = 470, my = 30, mw = 330, mh = 18;
  const a = g.alarm / 100;
  x.font = `800 11px ${SANS}`;
  x.fillStyle = g.lockdown ? COLORS.danger : '#c9c3b4';
  x.fillText(g.lockdown ? `LOCKDOWN — BUST IN ${Math.max(0, g.lockdownT).toFixed(1)}s` : 'ALARM', mx, my - 8);
  x.textAlign = 'right';
  x.fillStyle = '#fff';
  x.fillText(`${Math.round(g.alarm)}%`, mx + mw, my - 8);
  x.textAlign = 'left';
  x.fillStyle = '#0b0c12'; x.fillRect(mx, my, mw, mh);
  const gr = x.createLinearGradient(mx, 0, mx + mw, 0);
  gr.addColorStop(0, '#3ddc84'); gr.addColorStop(0.5, '#ffc53d'); gr.addColorStop(1, '#ff2e2e');
  x.fillStyle = gr; x.fillRect(mx, my, mw * a, mh);
  if (g.lockdown && Math.sin(g.time * 18) > 0) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(mx, my, mw, mh); }
  x.strokeStyle = 'rgba(0,0,0,0.6)';
  for (let i = 1; i < 10; i++) { x.beginPath(); x.moveTo(mx + (mw / 10) * i, my); x.lineTo(mx + (mw / 10) * i, my + mh); x.stroke(); }
  x.strokeStyle = g.lockdown ? COLORS.danger : COLORS.gold; x.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
  // who is watching
  const watchers = g.guards.filter((gd) => gd.seeing).length + g.cameras.filter((c) => c.seeing).length;
  x.font = `600 11px ${SANS}`;
  x.fillStyle = watchers ? COLORS.danger : 'rgba(200,200,200,0.6)';
  const extra = g.empT > 0 ? `  ·  EMP ${g.empT.toFixed(1)}s` : '';
  x.fillText((watchers ? `SEEN BY ${watchers}` : 'UNSEEN') + extra, mx, my + mh + 14);
}

export function renderHud(x, g) {
  const gr = x.createLinearGradient(0, 0, 0, HUD_H);
  gr.addColorStop(0, '#15131e'); gr.addColorStop(1, '#0c0b12');
  x.fillStyle = gr; x.fillRect(0, 0, W, HUD_H);
  x.fillStyle = COLORS.gold; x.fillRect(0, HUD_H - 2, W, 2);

  x.font = `700 21px ${SERIF}`; x.fillStyle = COLORS.gold;
  x.fillText('The Gilded Vault', 22, 29);
  x.font = `600 12px ${SANS}`; x.fillStyle = '#e8e1cf';
  x.fillText('▸ ' + objective(g), 22, 52);

  alarmMeter(x, g);

  // loot
  x.font = `800 11px ${SANS}`; x.fillStyle = '#c9c3b4';
  x.fillText('LOOT', 836, 22);
  x.font = `800 20px ${SANS}`; x.fillStyle = g.lootValue ? '#ffd36b' : '#7d7766';
  x.fillText(money(g.lootValue), 836, 46);
  x.font = `600 10px ${SANS}`; x.fillStyle = 'rgba(220,210,190,0.7)';
  const safes = g.loot.safes.filter((s) => s.opened).length;
  x.fillText(`Diamond ${g.diamondTaken ? '✓' : '—'}  ·  Safes ${safes}/3`, 836, 61);

  // tools
  x.font = `800 11px ${SANS}`; x.fillStyle = '#c9c3b4';
  x.fillText('TOOLS', 1010, 22);
  x.font = `700 12px ${SANS}`; x.fillStyle = '#e8e1cf';
  x.fillText('[Q] Smoke', 1010, 42); pips(x, g.tools.smoke, 2, 1086, 38, '#cfd4dc');
  x.fillText('[F] EMP', 1010, 60); pips(x, g.tools.emp, 1, 1086, 56, '#8f9bff');

  // timer
  x.font = `800 11px ${SANS}`; x.fillStyle = '#c9c3b4'; x.textAlign = 'right';
  x.fillText('TIME', 1258, 22);
  x.font = `700 22px ui-monospace, Menlo, Consolas, monospace`; x.fillStyle = '#fff';
  x.fillText(clock(g.runTime), 1258, 48);
  x.textAlign = 'left';

  // controls strip on the bottom wall
  x.font = `600 11px ${SANS}`; x.fillStyle = 'rgba(226,184,79,0.85)'; x.textAlign = 'center';
  x.fillText('WASD/Arrows move  ·  Shift sneak  ·  hold E interact  ·  Q smoke  ·  F EMP  ·  M mute', W / 2, 784);
  x.textAlign = 'left';

  // toast
  if (g.msg && g.mode === 'play') {
    x.font = `700 14px ${SANS}`;
    const w = x.measureText(g.msg.text).width + 30;
    x.globalAlpha = Math.min(1, g.msg.t * 2);
    x.fillStyle = 'rgba(10,8,18,0.88)'; x.fillRect(W / 2 - w / 2, 300, w, 30);
    x.strokeStyle = g.lockdown ? COLORS.danger : COLORS.gold; x.strokeRect(W / 2 - w / 2 + 0.5, 300.5, w - 1, 29);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(g.msg.text, W / 2, 320);
    x.textAlign = 'left'; x.globalAlpha = 1;
  }
}
