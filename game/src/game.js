// Game state and the fixed-step simulation tying all systems together.
import { TOOLS } from './config.js';
import { buildLevel, CAMERAS, EXIT, GUARDS, START } from './level.js';
import { createPlayer, updatePlayer } from './player.js';
import { createGuards, updateGuards } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { atExit, createLoot, updateInteract } from './loot.js';
import { updateTools, useEmp, useSmoke } from './tools.js';
import { senseWren, updateAlarm } from './alarm.js';

export function createGame(mode = 'menu') {
  const g = {
    mode,
    time: 0,
    runTime: 0,
    level: buildLevel(),
    player: createPlayer(START),
    guards: createGuards(GUARDS),
    cameras: createCameras(CAMERAS),
    loot: createLoot(),
    tools: { smoke: TOOLS.smoke, emp: TOOLS.emp },
    smokes: [],
    empT: 0,
    empWave: null,
    alarm: 0,
    peak: 0,
    calm: 0,
    beepT: 1,
    lockdown: false,
    lockdownT: 0,
    lootValue: 0,
    haul: [],
    diamondTaken: false,
    interact: { ref: null, p: 0, dur: 1, tick: 0 },
    focus: null,
    events: [],
    msg: null,
    caughtT: 0,
    escapeT: 0,
    catcher: '',
    frozen: false,
  };
  g.say = (text, secs = 3.2) => { g.msg = { text, t: secs }; };
  return g;
}

export function objective(g) {
  if (g.lockdown) return 'Break line of sight! Smoke [Q] or run.';
  if (!g.diamondTaken) return 'Steal the Sunset Diamond (centre-right, glowing case)';
  return 'Escape: climb the skylight rope (top-left)';
}

export function stepGame(g, dt, ctl) {
  if (g.frozen) return;
  g.time += dt;
  if (g.msg) { g.msg.t -= dt; if (g.msg.t <= 0) g.msg = null; }

  if (g.mode === 'menu') {
    updateCameras(g);
    updateGuards(g, dt, false);
    return;
  }
  if (g.mode === 'caught') {
    g.caughtT -= dt;
    if (g.caughtT <= 0) g.mode = 'busted';
    return;
  }
  if (g.mode === 'escape') {
    g.escapeT -= dt;
    g.player.x += (EXIT.x - g.player.x) * Math.min(1, dt * 6);
    g.player.y += (EXIT.y - g.player.y) * Math.min(1, dt * 6);
    updateCameras(g);
    if (g.escapeT <= 0) { g.mode = 'won'; g.events.push('win'); }
    return;
  }
  if (g.mode !== 'play') return;

  g.runTime += dt;
  if (ctl.smoke) useSmoke(g);
  if (ctl.emp) useEmp(g);
  updateInteract(g, dt, ctl.interact);
  updatePlayer(g, dt, ctl);
  updateTools(g, dt);
  updateCameras(g);
  const rate = senseWren(g);
  updateGuards(g, dt, true);
  updateAlarm(g, dt, rate);

  if (g.mode === 'play' && atExit(g)) {
    if (g.diamondTaken) {
      g.mode = 'escape';
      g.escapeT = 1.2;
      g.events.push('rope');
    } else if (!g.msg) {
      g.say('Not without the Sunset Diamond.', 1.6);
    }
  }
}
