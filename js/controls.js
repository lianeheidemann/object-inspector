// Interação com o visualizador: ponteiro, roda do mouse, teclado e barra de ferramentas.
import { pan, resetCamera, rotate, zoom } from './camera.js';
import { $, setActive, setStatus } from './dom.js';
import { pick } from './selection.js';
import { state } from './state.js';

const ROTATE_SPEED = .008;
const KEY_STEP = .1;
const CLICK_TOLERANCE_PX = 5;
const HANDLED_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'r', 'R'];

function bindPointer(stage) {
  let down = null;
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    stage.focus();
    stage.setPointerCapture(e.pointerId);
    down = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY };
  });
  stage.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (state.tool === 'rotate') rotate(-dx * ROTATE_SPEED, dy * ROTATE_SPEED);
    else pan(dx, dy);
    down.x = e.clientX;
    down.y = e.clientY;
  });
  // Um arraste curto conta como clique de seleção.
  stage.addEventListener('pointerup', e => {
    if (down && Math.hypot(e.clientX - down.startX, e.clientY - down.startY) < CLICK_TOLERANCE_PX) pick(e);
    down = null;
  });
  stage.addEventListener('pointercancel', () => { down = null; });
  stage.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(e.deltaY * .001)); }, { passive: false });
}

function bindKeyboard(stage) {
  stage.addEventListener('keydown', e => {
    if (!HANDLED_KEYS.includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft') rotate(KEY_STEP, 0);
    if (e.key === 'ArrowRight') rotate(-KEY_STEP, 0);
    if (e.key === 'ArrowUp') rotate(0, KEY_STEP);
    if (e.key === 'ArrowDown') rotate(0, -KEY_STEP);
    if (e.key === '+' || e.key === '=') zoom(.9);
    if (e.key === '-') zoom(1.1);
    if (e.key.toLowerCase() === 'r') resetCamera();
  });
}

function bindToolbar(stage) {
  document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
    state.tool = b.dataset.tool;
    setActive('tool', state.tool);
  });
  $('zoom-in').onclick = () => zoom(.85);
  $('zoom-out').onclick = () => zoom(1.15);
  $('reset').onclick = resetCamera;
  $('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.requestFullscreen();
    } catch {
      setStatus('Tela cheia indisponível neste navegador.');
    }
  };
}

export function initControls() {
  const stage = $('stage');
  bindPointer(stage);
  bindKeyboard(stage);
  bindToolbar(stage);
}
