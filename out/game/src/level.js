// The Gilded Vault floor plan: one gallery shown whole on one screen.
// Three bands, three routes: the Side Gallery (safes, one camera) on top,
// the guarded Main Hall in the middle, the dark Maintenance Corridor below.

const T = 16;
const rect = (x, y, w, h, kind = 'wall', extra = {}) => ({ x, y, w, h, kind, ...extra });

function hWall(y, x0, x1, doors) {
  const out = [];
  let x = x0;
  for (const [a, b] of doors) {
    out.push(rect(x, y, a - x, T));
    x = b;
  }
  out.push(rect(x, y, x1 - x, T));
  return out;
}

export const DOORS_UPPER = [[190, 250], [640, 700], [1060, 1120]];
export const DOORS_LOWER = [[110, 170], [870, 920], [1150, 1210]];

export const WALLS = [
  rect(20, 76, 1240, T),
  rect(20, 772, 1240, T),
  rect(20, 76, T, 712),
  rect(1244, 76, T, 712),
  ...hWall(280, 36, 1244, DOORS_UPPER),
  ...hWall(650, 36, 1244, DOORS_LOWER),
];

export const ZONES = [
  { id: 'gallery', name: 'SIDE GALLERY', x: 36, y: 92, w: 1208, h: 188 },
  { id: 'hall', name: 'MAIN HALL', x: 36, y: 296, w: 1208, h: 354 },
  { id: 'corridor', name: 'MAINTENANCE CORRIDOR', x: 36, y: 666, w: 1208, h: 106, dark: true, slow: true },
];

// Cover: everything here blocks movement and sight.
export const PROPS = [
  // Main Hall
  rect(290, 356, 76, 36, 'case', { label: 'Amber Moths' }),
  rect(290, 566, 76, 36, 'case', { label: 'Glass Tide' }),
  rect(516, 396, 40, 40, 'pedestal'),
  rect(516, 546, 40, 40, 'pedestal'),
  rect(110, 420, 44, 44, 'statue'),
  rect(700, 330, 36, 36, 'pedestal'),
  rect(600, 598, 96, 22, 'bench'),
  rect(1150, 380, 48, 48, 'statue'),
  rect(1150, 536, 48, 48, 'pedestal'),
  // Side Gallery
  rect(400, 92, 14, 92, 'panel'),
  rect(880, 92, 14, 92, 'panel'),
  rect(560, 124, 32, 32, 'pedestal'),
  rect(980, 110, 64, 22, 'bench'),
  // Maintenance Corridor
  rect(260, 666, 44, 30, 'crate'),
  rect(480, 740, 54, 32, 'crate'),
  rect(700, 666, 34, 34, 'crate'),
  rect(1010, 738, 44, 34, 'crate'),
];

export const DIAMOND = { x: 900, y: 470, w: 64, h: 64, value: 2400000, name: 'the Sunset Diamond' };

export const SAFES = [
  { id: 's1', x: 300, y: 108, w: 36, h: 30, value: 48000, name: 'bearer bonds' },
  { id: 's2', x: 740, y: 108, w: 36, h: 30, value: 72500, name: 'a sapphire brooch' },
  { id: 's3', x: 1226, y: 200, w: 34, h: 36, value: 31000, name: 'gold sovereigns' },
];

export const START = { x: 70, y: 722 };
export const EXIT = { x: 84, y: 140, label: 'SKYLIGHT ROPE' };

export const CAMERAS = [
  { id: 'c1', x: 460, y: 300, base: Math.PI / 2, sweep: 0.9, period: 7, phase: 0, range: 255 },
  { id: 'c2', x: 1240, y: 470, base: Math.PI, sweep: 0.75, period: 6, phase: 1.3, range: 290 },
  { id: 'c3', x: 640, y: 96, base: Math.PI / 2, sweep: 1.0, period: 8, phase: 2.1, range: 195 },
];

export const GUARDS = [
  { id: 'g1', name: 'Brannock', path: [{ x: 770, y: 350 }, { x: 1080, y: 350 }, { x: 1080, y: 610 }, { x: 770, y: 610 }] },
  { id: 'g2', name: 'Ottoline', path: [{ x: 220, y: 470 }, { x: 660, y: 470 }] },
  { id: 'g3', name: 'Pell', path: [{ x: 290, y: 228 }, { x: 1010, y: 228 }] },
  { id: 'g4', name: 'Moss', path: [{ x: 330, y: 718 }, { x: 1090, y: 718 }], flashlight: true, range: 150, half: 0.42 },
];

function safeRect(s) {
  return rect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, 'safe');
}

export function buildLevel() {
  const diamondRect = rect(DIAMOND.x - DIAMOND.w / 2, DIAMOND.y - DIAMOND.h / 2, DIAMOND.w, DIAMOND.h, 'diamond');
  const solids = [...WALLS, ...PROPS, diamondRect, ...SAFES.map(safeRect)];
  return { walls: WALLS, props: PROPS, zones: ZONES, solids, sight: solids, diamondRect };
}

export function zoneAt(x, y) {
  for (const z of ZONES) if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
  return null;
}
