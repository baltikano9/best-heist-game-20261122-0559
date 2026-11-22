// Wall cameras: sweep on a timer, freeze under EMP, can be cut by hand.
import { CAMERA } from './config.js';
import { clearLine, inCone } from './geometry.js';

export function createCameras(defs) {
  return defs.map((d) => ({ ...d, angle: d.base, disabled: false, seeing: false }));
}

export const cameraLive = (c, g) => !c.disabled && g.empT <= 0;

export function updateCameras(g) {
  for (const c of g.cameras) {
    if (!cameraLive(c, g)) continue;
    c.angle = c.base + Math.sin((g.time * Math.PI * 2) / c.period + c.phase) * c.sweep;
  }
}

export function cameraCanSee(c, g) {
  if (!cameraLive(c, g)) return false;
  const p = g.player;
  const range = c.range * (p.sneaking ? CAMERA.sneakSight : 1);
  if (!inCone(c.x, c.y, c.angle, CAMERA.half, range, p.x, p.y)) return false;
  return clearLine(c.x, c.y, p.x, p.y, g.level.sight, g.smokes);
}
