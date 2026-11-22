// Guards: patrol routes, sweeping vision cones, hearing, investigation and the lockdown chase.
import { GUARD, PLAYER } from './config.js';
import { clearLine, dist, inCone, pushOutCircle, turnToward } from './geometry.js';

export function createGuards(defs) {
  return defs.map((d) => ({
    id: d.id,
    name: d.name,
    path: d.path,
    flashlight: !!d.flashlight,
    range: d.range ?? GUARD.range,
    half: d.half ?? GUARD.half,
    x: d.path[0].x,
    y: d.path[0].y,
    wp: 1,
    facing: Math.atan2(d.path[1].y - d.path[0].y, d.path[1].x - d.path[0].x),
    look: 0,
    state: 'patrol',
    pause: 0,
    t: 0,
    seeing: false,
    target: null,
    leave: null,
    invT: 0,
  }));
}

export const viewAngle = (gd) => gd.facing + gd.look;

export function guardCanSee(gd, g) {
  const p = g.player;
  const range = gd.range * (p.sneaking ? GUARD.sneakSight : 1);
  if (!inCone(gd.x, gd.y, viewAngle(gd), gd.half, range, p.x, p.y)) return false;
  return clearLine(gd.x, gd.y, p.x, p.y, g.level.sight, g.smokes);
}

function moveToward(gd, tx, ty, speed, dt, solids) {
  const dx = tx - gd.x, dy = ty - gd.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return d;
  const step = Math.min(d, speed * dt);
  gd.x += (dx / d) * step;
  gd.y += (dy / d) * step;
  pushOutCircle(gd, GUARD.r, solids);
  gd.want = Math.atan2(dy, dx);
  return d;
}

function leaveRoute(gd) {
  if (gd.state === 'patrol') gd.leave = { x: gd.x, y: gd.y };
}

export function updateGuards(g, dt, detect) {
  const p = g.player;
  const solids = g.level.solids;
  const hurry = g.diamondTaken ? 1.15 : 1;
  for (const gd of g.guards) {
    gd.t += dt;
    gd.want = gd.facing;
    let lookTarget = 0;

    if (detect) {
      if (g.lockdown) {
        leaveRoute(gd);
        gd.state = 'chase';
      } else if (gd.seeing) {
        leaveRoute(gd);
        gd.state = 'alert';
        gd.target = { x: p.x, y: p.y };
        gd.invT = 3.5;
      } else if (gd.state === 'alert') {
        gd.state = 'investigate';
      } else if (p.noise > 0 && (gd.state === 'patrol' || gd.state === 'return') && dist(gd, p) < p.noise &&
                 clearLine(gd.x, gd.y, p.x, p.y, g.level.sight, [])) {
        leaveRoute(gd);
        gd.state = 'investigate';
        gd.target = { x: p.x, y: p.y };
        gd.invT = 3;
        g.events.push('huh');
      }
    }

    switch (gd.state) {
      case 'patrol': {
        const wp = gd.path[gd.wp];
        if (gd.pause > 0) {
          gd.pause -= dt;
          const k = 1 - gd.pause / GUARD.pause;
          lookTarget = Math.sin(k * Math.PI * 2) * 0.85;
        } else {
          const d = moveToward(gd, wp.x, wp.y, GUARD.speed * hurry, dt, solids);
          lookTarget = Math.sin(gd.t * 1.7) * 0.32;
          if (d < 4) {
            gd.pause = GUARD.pause;
            gd.wp = (gd.wp + 1) % gd.path.length;
          }
        }
        break;
      }
      case 'alert':
        gd.want = Math.atan2(p.y - gd.y, p.x - gd.x);
        break;
      case 'investigate': {
        gd.invT -= dt;
        const d = moveToward(gd, gd.target.x, gd.target.y, GUARD.speed * 1.2 * hurry, dt, solids);
        if (d < 10) lookTarget = Math.sin(gd.t * 2.6) * 1.0;
        if (gd.invT <= 0) gd.state = 'return';
        break;
      }
      case 'return': {
        const home = gd.leave || gd.path[gd.wp];
        const d = moveToward(gd, home.x, home.y, GUARD.speed * hurry, dt, solids);
        lookTarget = Math.sin(gd.t * 1.7) * 0.32;
        if (d < 4) { gd.state = 'patrol'; gd.leave = null; }
        break;
      }
      case 'chase':
        moveToward(gd, p.x, p.y, GUARD.chase, dt, solids);
        gd.want = Math.atan2(p.y - gd.y, p.x - gd.x);
        break;
    }
    gd.facing = turnToward(gd.facing, gd.want, GUARD.turn * dt);
    gd.look += (lookTarget - gd.look) * Math.min(1, dt * 4);
  }
}

export function guardsGiveUp(g) {
  for (const gd of g.guards) {
    gd.state = 'investigate';
    gd.target = { x: gd.x, y: gd.y };
    gd.invT = 2;
  }
}

export function touchingGuard(g) {
  for (const gd of g.guards) if (dist(gd, g.player) < GUARD.r + PLAYER.r + 4) return gd;
  return null;
}
