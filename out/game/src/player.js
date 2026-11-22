// Wren: movement, sneaking, footstep noise.
import { PLAYER } from './config.js';
import { pushOutCircle, turnToward } from './geometry.js';
import { zoneAt } from './level.js';

export function createPlayer(start) {
  return { x: start.x, y: start.y, facing: -Math.PI / 2, sneaking: false, moving: false, stepT: 0, noise: 0, carrying: false };
}

export function updatePlayer(g, dt, ctl) {
  const p = g.player;
  let { x, y } = ctl;
  const len = Math.hypot(x, y);
  if (len > 0) { x /= len; y /= len; }
  p.sneaking = ctl.sneak;
  const zone = zoneAt(p.x, p.y);
  let speed = p.sneaking ? PLAYER.sneak : PLAYER.run;
  if (zone && zone.slow) speed *= PLAYER.crawlMul;
  if (p.carrying) speed *= PLAYER.carryMul;
  if (g.interact.ref) speed = 0; // hands busy
  p.moving = len > 0 && speed > 0;
  if (p.moving) {
    p.x += x * speed * dt;
    p.y += y * speed * dt;
    p.facing = turnToward(p.facing, Math.atan2(y, x), 12 * dt);
    pushOutCircle(p, PLAYER.r, g.level.solids);
    p.stepT += dt * (p.sneaking ? 2.2 : 4.4);
    if (p.stepT >= 1) {
      p.stepT -= 1;
      g.events.push(p.sneaking ? 'stepSoft' : 'step');
    }
  }
  p.noise = p.moving && !p.sneaking ? PLAYER.noiseRun * (zone && zone.slow ? 0.6 : 1) : 0;
}
