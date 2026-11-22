// Loot and hands-on work: the Sunset Diamond, side safes, cutting cameras.
// Every interaction is "hold E" with a progress ring, so greed costs time.
import { ALARM, INTERACT } from './config.js';
import { dist } from './geometry.js';
import { DIAMOND, EXIT, SAFES } from './level.js';

export function createLoot() {
  return {
    diamond: { ...DIAMOND, taken: false },
    safes: SAFES.map((s) => ({ ...s, opened: false })),
  };
}

export function findInteractable(g) {
  const p = g.player;
  let best = null;
  const consider = (ref, kind, d, reach, time, label) => {
    if (d <= reach && (!best || d < best.d)) best = { ref, kind, d, time, label };
  };
  const dm = g.loot.diamond;
  if (!dm.taken) consider(dm, 'diamond', dist(p, dm), 32 + INTERACT.reach * 0.6, INTERACT.diamond, 'Lift the Sunset Diamond');
  for (const s of g.loot.safes) if (!s.opened) consider(s, 'safe', dist(p, s), INTERACT.reach, INTERACT.safe, 'Crack safe');
  for (const c of g.cameras) if (!c.disabled) consider(c, 'camera', dist(p, c), INTERACT.reach, INTERACT.camera, 'Cut camera wires');
  return best;
}

export function updateInteract(g, dt, holding) {
  const t = findInteractable(g);
  g.focus = t;
  if (!holding || !t) {
    g.interact = { ref: null, p: 0, dur: 1, tick: 0 };
    return;
  }
  if (g.interact.ref !== t.ref) g.interact = { ref: t.ref, kind: t.kind, p: 0, dur: t.time, tick: 0 };
  g.interact.p += dt;
  g.interact.tick += dt;
  if (g.interact.tick > 0.22) { g.interact.tick = 0; g.events.push('tick'); }
  if (g.interact.p >= g.interact.dur) {
    complete(g, t);
    g.interact = { ref: null, p: 0, dur: 1, tick: 0 };
  }
}

function complete(g, t) {
  if (t.kind === 'diamond') {
    t.ref.taken = true;
    g.diamondTaken = true;
    g.player.carrying = true;
    g.lootValue += t.ref.value;
    g.haul.push({ name: 'The Sunset Diamond', value: t.ref.value });
    g.alarm = Math.min(99, g.alarm + ALARM.diamondSpike);
    g.events.push('grab');
    g.say('Got it! The case\'s pressure plate tripped: alarm up, guards on edge. Get to the rope!');
  } else if (t.kind === 'safe') {
    t.ref.opened = true;
    g.lootValue += t.ref.value;
    g.haul.push({ name: t.ref.name, value: t.ref.value });
    g.events.push('chime');
    g.say(`Safe cracked: ${t.ref.name} (+$${t.ref.value.toLocaleString('en-US')})`);
  } else if (t.kind === 'camera') {
    t.ref.disabled = true;
    g.events.push('zap');
    g.say('Camera wires cut. That lens is blind for good.');
  }
}

export function atExit(g) {
  return dist(g.player, EXIT) < 30;
}
