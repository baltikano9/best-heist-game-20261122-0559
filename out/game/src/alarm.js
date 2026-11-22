// The alarm meter: who sees Wren, how fast it climbs, the lockdown grace window and the bust.
import { ALARM } from './config.js';
import { dist } from './geometry.js';
import { guardCanSee, guardsGiveUp, touchingGuard } from './guards.js';
import { cameraCanSee } from './cameras.js';

export function senseWren(g) {
  let rate = 0;
  for (const gd of g.guards) {
    gd.seeing = guardCanSee(gd, g);
    if (gd.seeing) rate += ALARM.guardRate * (1.3 - (dist(gd, g.player) / gd.range) * 0.8);
  }
  for (const c of g.cameras) {
    c.seeing = cameraCanSee(c, g);
    if (c.seeing) rate += ALARM.cameraRate;
  }
  return rate;
}

export function updateAlarm(g, dt, rate) {
  if (rate > 0) {
    g.alarm = Math.min(100, g.alarm + rate * dt);
    g.calm = 0;
  } else {
    g.calm += dt;
    if (g.calm > ALARM.decayDelay && !g.lockdown) g.alarm = Math.max(0, g.alarm - ALARM.decay * dt);
  }
  g.peak = Math.max(g.peak, g.alarm);

  // heartbeat beeps speed up as the meter fills
  if (g.alarm > 35) {
    g.beepT -= dt * (0.6 + g.alarm / 40);
    if (g.beepT <= 0) { g.beepT = 1; g.events.push(g.lockdown ? 'siren' : 'beep'); }
  }

  if (!g.lockdown && g.alarm >= 100) {
    g.lockdown = true;
    g.lockdownT = ALARM.lockdown;
    g.events.push('lockdown');
    g.say('LOCKDOWN! Break line of sight before the timer runs out!');
  }
  if (!g.lockdown) return;

  g.lockdownT -= dt;
  const catcher = touchingGuard(g);
  if (catcher) return bust(g, catcher);
  if (g.lockdownT <= 0) {
    if (rate > 0) {
      const seer = g.guards.find((gd) => gd.seeing);
      return bust(g, seer || null);
    }
    g.lockdown = false;
    g.alarm = ALARM.afterLockdown;
    guardsGiveUp(g);
    g.events.push('slip');
    g.say('They lost you... for now. Stay low.');
  }
}

function bust(g, gd) {
  g.mode = 'caught';
  g.caughtT = 1.6;
  g.catcher = gd ? gd.name : 'A camera';
  g.lockdown = false;
  g.events.push('busted');
}
