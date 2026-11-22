// Tuning numbers for The Gilded Vault. Everything balance-related lives here.

export const W = 1280;
export const H = 800;
export const HUD_H = 70;

export const PLAYER = {
  r: 10,
  run: 150,        // px/s while walking normally
  sneak: 70,       // px/s while holding Shift
  crawlMul: 0.7,   // speed multiplier inside the maintenance corridor
  carryMul: 0.92,  // the Diamond is heavy-ish
  noiseRun: 120,   // hearing radius of normal footsteps
};

export const GUARD = {
  r: 12,
  speed: 58,
  chase: 112,
  turn: 3.2,       // rad/s
  range: 230,
  half: 0.6,       // half-angle of the vision cone (rad)
  pause: 1.4,      // seconds spent scanning at each waypoint
  sneakSight: 0.8, // sneaking shrinks how far a guard can pick you out
};

export const CAMERA = { range: 250, half: 0.4, sneakSight: 0.9 };

export const ALARM = {
  guardRate: 44,   // %/s at the edge of a guard's cone (more when close)
  cameraRate: 68,  // %/s while a camera sees you
  decay: 13,       // %/s once nobody has seen you for decayDelay
  decayDelay: 1.1,
  lockdown: 3.5,   // grace window at 100% before the bust
  afterLockdown: 62,
  diamondSpike: 22,
};

export const TOOLS = { smoke: 2, emp: 1, smokeR: 76, smokeTime: 7, empTime: 8 };

export const INTERACT = { reach: 46, diamond: 1.6, safe: 2.4, camera: 1.1 };

export const COLORS = {
  gold: '#e2b84f',
  goldDim: '#8a6b2a',
  wall: '#262838',
  wallTop: '#343748',
  ink: '#f3ecdc',
  danger: '#ff3b3b',
  guardCone: '255,196,84',
  camCone: '86,214,255',
  seenCone: '255,64,64',
  wren: '#7b4fd6',
  wrenScarf: '#2fe0c0',
  diamond: '#ff8a3d',
  safe: '#4f7d9c',
};
