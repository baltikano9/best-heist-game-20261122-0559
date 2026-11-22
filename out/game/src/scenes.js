// Deterministic scene setups for screenshots: ?scene=heist | patrol | loot | menu | win | busted
// Each one builds a fresh game, scripts Wren's position, runs the fixed-step
// simulation for a set time and then freezes it. No randomness is involved.
import { createGame, stepGame } from './game.js';

const DT = 1 / 60;
const IDLE = { x: 0, y: 0, sneak: false, interact: false, smoke: false, emp: false };

function run(g, seconds, ctl = IDLE) {
  for (let i = 0; i < Math.round(seconds / DT); i++) stepGame(g, DT, ctl);
}

function place(g, x, y, facing, sneak = true) {
  g.player.x = x;
  g.player.y = y;
  g.player.facing = facing;
  g.player.sneaking = sneak;
}

export function buildScene(name) {
  if (name === 'menu') {
    const g = createGame('menu');
    run(g, 4);
    g.frozen = true;
    return g;
  }
  const g = createGame('play');
  if (name === 'heist') {
    run(g, 6.0);
    place(g, 600, 520, -0.3);
    g.player.moving = true;
    g.tools.smoke = 1;
    g.smokes.push({ x: 430, y: 610, r: 60, age: 2, life: 7, seed: 3 });
    run(g, 0.5, { ...IDLE, sneak: true });
    g.alarm = 41; g.peak = 41;
    g.lootValue = 72500; g.loot.safes[1].opened = true; g.haul.push({ name: 'a sapphire brooch', value: 72500 });
    g.runTime = 47;
    g.say('Safe cracked: a sapphire brooch (+$72,500)', 2);
  } else if (name === 'patrol') {
    run(g, 9.0);
    place(g, 700, 560, 0.2);
    run(g, 0.6, { ...IDLE, sneak: true });
    g.runTime = 63;
  } else if (name === 'loot') {
    run(g, 3.0);
    place(g, 900, 526, -Math.PI / 2);
    g.cameras[1].disabled = true;
    g.runTime = 81;
    g.alarm = 18;
    run(g, 1.0, { ...IDLE, sneak: true, interact: true });
  } else if (name === 'win') {
    g.loot.diamond.taken = true; g.diamondTaken = true;
    g.lootValue = 2400000 + 48000; g.haul.push({ name: 'The Sunset Diamond', value: 2400000 }, { name: 'bearer bonds', value: 48000 });
    g.peak = 37; g.runTime = 132; g.mode = 'won';
  } else if (name === 'busted') {
    run(g, 5);
    place(g, 780, 420, 0);
    g.alarm = 100; g.lockdown = true; g.lockdownT = 0.01;
    run(g, 0.1);
    run(g, 2);
  }
  g.frozen = true;
  return g;
}
