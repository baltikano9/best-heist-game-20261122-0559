// Limited tools: smoke pellets (break line of sight) and one EMP (freeze cameras).
import { TOOLS } from './config.js';

export function useSmoke(g) {
  if (g.tools.smoke <= 0) { g.events.push('deny'); g.say('Out of smoke pellets.'); return; }
  g.tools.smoke -= 1;
  g.smokes.push({ x: g.player.x, y: g.player.y, r: 0, age: 0, life: TOOLS.smokeTime, seed: g.smokes.length + g.tools.smoke * 7 });
  g.events.push('smoke');
}

export function useEmp(g) {
  if (g.tools.emp <= 0) { g.events.push('deny'); g.say('The EMP is spent.'); return; }
  g.tools.emp -= 1;
  g.empT = TOOLS.empTime;
  g.empWave = { x: g.player.x, y: g.player.y, age: 0 };
  g.events.push('emp');
  g.say('EMP! Every camera frozen for 8 seconds.');
}

export function updateTools(g, dt) {
  for (const s of g.smokes) {
    s.age += dt;
    const grow = Math.min(1, s.age / 0.45);
    const fade = Math.min(1, (s.life - s.age) / 1.2);
    s.r = TOOLS.smokeR * grow * Math.max(0, fade);
  }
  g.smokes = g.smokes.filter((s) => s.age < s.life);
  if (g.empT > 0) g.empT = Math.max(0, g.empT - dt);
  if (g.empWave) {
    g.empWave.age += dt;
    if (g.empWave.age > 1.4) g.empWave = null;
  }
}
