// Keyboard (and a little mouse) state. Keys held + keys pressed this frame.

const held = new Set();
const pressed = new Set();
const clicks = [];

const BLOCK = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

export function initInput(canvas, toGameXY) {
  window.addEventListener('keydown', (e) => {
    if (BLOCK.has(e.code)) e.preventDefault();
    if (!held.has(e.code)) pressed.add(e.code);
    held.add(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('mousedown', (e) => clicks.push(toGameXY(e.clientX, e.clientY)));
}

export const isHeld = (...codes) => codes.some((c) => held.has(c));
export const wasPressed = (...codes) => codes.some((c) => pressed.has(c));
export const takeClicks = () => clicks.splice(0, clicks.length);

// Snapshot the controls the simulation cares about.
export function readControls() {
  let x = 0;
  let y = 0;
  if (isHeld('KeyA', 'ArrowLeft')) x -= 1;
  if (isHeld('KeyD', 'ArrowRight')) x += 1;
  if (isHeld('KeyW', 'ArrowUp')) y -= 1;
  if (isHeld('KeyS', 'ArrowDown')) y += 1;
  return {
    x,
    y,
    sneak: isHeld('ShiftLeft', 'ShiftRight'),
    interact: isHeld('KeyE'),
    smoke: wasPressed('KeyQ'),
    emp: wasPressed('KeyF'),
    confirm: wasPressed('Enter', 'Space'),
    retry: wasPressed('KeyR'),
    mute: wasPressed('KeyM'),
  };
}

export function endFrame() {
  pressed.clear();
}
