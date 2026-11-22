// Entry point: canvas scaling, the fixed-step loop, mode transitions and sound hookup.
import { W, H } from './config.js';
import { endFrame, initInput, readControls, takeClicks } from './input.js';
import { createGame, stepGame } from './game.js';
import { renderWorld } from './render.js';
import { renderHud } from './hud.js';
import { renderBusted, renderMenu, renderWon, START_BUTTON } from './screens.js';
import { playEvents, toggleMute, unlockAudio } from './audio.js';
import { buildScene } from './scenes.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
canvas.width = W;
canvas.height = H;

function fit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = `${Math.floor(W * s)}px`;
  canvas.style.height = `${Math.floor(H * s)}px`;
}
window.addEventListener('resize', fit);
fit();

function toGameXY(cx, cy) {
  const r = canvas.getBoundingClientRect();
  return { x: ((cx - r.left) / r.width) * W, y: ((cy - r.top) / r.height) * H };
}
initInput(canvas, toGameXY);
window.addEventListener('keydown', unlockAudio);
window.addEventListener('mousedown', unlockAudio);

const scene = new URLSearchParams(location.search).get('scene');
let g = scene ? buildScene(scene) : createGame('menu');
let lastMode = '';

function announce() {
  if (g.mode === lastMode) return;
  lastMode = g.mode;
  const lines = {
    menu: 'The Gilded Vault. Press Enter to start the heist.',
    play: 'Heist started. Steal the Sunset Diamond and reach the skylight rope.',
    busted: 'Busted. Press Enter to try again.',
    won: 'Clean getaway! Press Enter to play again.',
  };
  if (lines[g.mode]) status.textContent = lines[g.mode];
}

function startRun() {
  g = createGame('play');
  g.events.push('start');
  g.say('Find a route to the Sunset Diamond. Shift to sneak.', 4);
}

function handleMeta(ctl) {
  if (ctl.mute) toggleMute();
  const clicks = takeClicks();
  if (g.mode === 'menu') {
    const b = START_BUTTON;
    const hit = clicks.some((c) => c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h);
    if (ctl.confirm || hit) startRun();
  } else if (g.mode === 'busted' || g.mode === 'won') {
    if (ctl.confirm || ctl.retry || clicks.length) startRun();
  } else if (g.mode === 'play' && ctl.retry && g.frozen) {
    startRun();
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  renderWorld(ctx, g);
  renderHud(ctx, g);
  if (g.mode === 'menu') renderMenu(ctx, g);
  else if (g.mode === 'caught' || g.mode === 'busted') renderBusted(ctx, g);
  else if (g.mode === 'won') renderWon(ctx, g);
}

const STEP = 1 / 60;
let acc = 0;
let last = performance.now();

function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  const ctl = readControls();
  handleMeta(ctl);
  let first = true;
  while (acc >= STEP) {
    // one-shot keys only count on the first sub-step
    stepGame(g, STEP, first ? ctl : { ...ctl, smoke: false, emp: false });
    first = false;
    acc -= STEP;
  }
  endFrame();
  playEvents(g.events);
  g.events.length = 0;
  announce();
  draw();
  requestAnimationFrame(frame);
}

draw();
requestAnimationFrame(frame);
