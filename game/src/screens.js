// Full-screen overlays: the title/start screen, the Busted screen and the getaway results.
import { W, H, COLORS } from './config.js';
import { clock, money } from './hud.js';

const SANS = '"Segoe UI", Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

export const START_BUTTON = { x: W / 2 - 150, y: 610, w: 300, h: 54 };

function panel(x, px, py, pw, ph, edge) {
  x.fillStyle = 'rgba(9,8,16,0.9)'; x.fillRect(px, py, pw, ph);
  x.strokeStyle = edge; x.lineWidth = 2; x.strokeRect(px + 1, py + 1, pw - 2, ph - 2); x.lineWidth = 1;
}

function centered(x, text, y, font, color) {
  x.font = font; x.fillStyle = color; x.textAlign = 'center'; x.fillText(text, W / 2, y); x.textAlign = 'left';
}

export function renderMenu(x, g) {
  x.fillStyle = 'rgba(5,4,10,0.62)'; x.fillRect(0, 0, W, H);
  panel(x, W / 2 - 360, 120, 720, 570, COLORS.gold);
  centered(x, 'A WREN HEIST', 170, `800 14px ${SANS}`, COLORS.wrenScarf);
  centered(x, 'The Gilded Vault', 228, `700 56px ${SERIF}`, COLORS.gold);
  const story = [
    'Midnight in Ignatius Vell\'s private gallery. Under glass at its heart',
    'glows the Sunset Diamond — and Wren has one night to lift it.',
    'Read the patrols, pick your route, take the stone, climb out the skylight.',
  ];
  story.forEach((s, i) => centered(x, s, 274 + i * 24, `italic 17px ${SERIF}`, '#e8e1cf'));

  const rows = [
    ['WASD / Arrows', 'move'],
    ['Shift', 'sneak: slower, quieter, harder to spot'],
    ['hold E', 'lift loot · crack safes · cut a camera up close'],
    ['Q', 'smoke pellet (×2): blocks every line of sight'],
    ['F', 'EMP (×1): freezes all cameras for 8 s'],
  ];
  rows.forEach(([k, v], i) => {
    const y = 375 + i * 26;
    x.font = `800 14px ${SANS}`; x.fillStyle = COLORS.gold; x.textAlign = 'right'; x.fillText(k, W / 2 - 70, y);
    x.font = `500 14px ${SANS}`; x.fillStyle = '#ddd6c6'; x.textAlign = 'left'; x.fillText(v, W / 2 - 54, y);
  });
  centered(x, 'Three routes: the guarded Main Hall · the Side Gallery and its safes · the dark Maintenance Corridor.', 520, `600 13px ${SANS}`, '#9fd8cf');
  centered(x, 'Cones fill the alarm. At 100% it\'s LOCKDOWN: break line of sight within 3.5 s or you\'re busted.', 544, `600 13px ${SANS}`, '#ff9f8a');

  const b = START_BUTTON;
  const pulse = 0.5 + 0.5 * Math.sin(g.time * 3);
  x.fillStyle = `rgba(226,184,79,${0.85 + pulse * 0.15})`; x.fillRect(b.x, b.y, b.w, b.h);
  x.strokeStyle = '#fff3c4'; x.lineWidth = 2; x.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2); x.lineWidth = 1;
  centered(x, 'START THE HEIST', b.y + 35, `800 22px ${SANS}`, '#1a1208');
  centered(x, 'press Enter or click', b.y + b.h + 18, `500 12px ${SANS}`, 'rgba(230,220,200,0.7)');
}

export function renderBusted(x, g) {
  const k = g.mode === 'caught' ? 1 - Math.max(0, g.caughtT - 1.0) / 0.6 : 1;
  x.save();
  x.globalAlpha = Math.min(1, k);
  centered(x, 'BUSTED', 260, `900 ${Math.round(110 - k * 20)}px ${SANS}`, COLORS.danger);
  centered(x, `${g.catcher} caught Wren at ${clock(g.runTime)}.`, 304, `italic 20px ${SERIF}`, '#ffe0d6');
  x.restore();
  if (g.mode !== 'busted') return;
  panel(x, W / 2 - 230, 340, 460, 160, COLORS.danger);
  centered(x, `Loot left behind: ${money(g.lootValue)}`, 384, `700 18px ${SANS}`, '#fff');
  centered(x, `Peak alarm ${Math.round(g.peak)}%  ·  tools left: smoke ${g.tools.smoke}, EMP ${g.tools.emp}`, 414, `500 14px ${SANS}`, '#ddd');
  centered(x, 'Tip: sneak behind cases, smoke a cone, or EMP the cameras.', 442, `italic 14px ${SERIF}`, '#e8c9a0');
  centered(x, '[Enter] try again', 482, `800 16px ${SANS}`, COLORS.gold);
}

function rating(g) {
  if (g.peak < 1) return ['GHOST', 'Nobody ever knew Wren was there.'];
  if (g.peak < 50) return ['PROFESSIONAL', 'A few raised eyebrows. Nothing more.'];
  if (g.peak < 100) return ['NERVE OF STEEL', 'The alarm sang, but Wren was faster.'];
  return ['BY A WHISKER', 'A lockdown survived. Legendary — and reckless.'];
}

export function renderWon(x, g) {
  x.fillStyle = 'rgba(5,4,10,0.7)'; x.fillRect(0, 0, W, H);
  panel(x, W / 2 - 320, 140, 640, 500, '#50ffa0');
  centered(x, 'CLEAN GETAWAY', 200, `900 52px ${SANS}`, '#50ffa0');
  centered(x, 'Wren rides the skylight rope into the dawn with the Sunset Diamond.', 236, `italic 18px ${SERIF}`, '#e8e1cf');
  g.haul.forEach((h, i) => {
    const y = 290 + i * 28;
    x.font = `600 16px ${SANS}`; x.fillStyle = '#ddd6c6'; x.fillText(h.name, W / 2 - 220, y);
    x.textAlign = 'right'; x.fillStyle = '#ffd36b'; x.fillText(money(h.value), W / 2 + 220, y); x.textAlign = 'left';
  });
  const ty = 290 + g.haul.length * 28 + 14;
  x.strokeStyle = COLORS.gold; x.beginPath(); x.moveTo(W / 2 - 220, ty - 14); x.lineTo(W / 2 + 220, ty - 14); x.stroke();
  x.font = `800 20px ${SANS}`; x.fillStyle = '#fff'; x.fillText('TOTAL HAUL', W / 2 - 220, ty + 10);
  x.textAlign = 'right'; x.fillStyle = '#ffd36b'; x.fillText(money(g.lootValue), W / 2 + 220, ty + 10); x.textAlign = 'left';
  const [title, line] = rating(g);
  centered(x, `Time ${clock(g.runTime)}  ·  Peak alarm ${Math.round(g.peak)}%`, ty + 50, `600 15px ${SANS}`, '#ccc');
  centered(x, title, ty + 100, `900 34px ${SANS}`, COLORS.gold);
  centered(x, line, ty + 128, `italic 16px ${SERIF}`, '#e8e1cf');
  centered(x, '[Enter] plan another heist', 618, `800 16px ${SANS}`, '#50ffa0');
}
