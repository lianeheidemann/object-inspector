// Linha do tempo das análises: controle deslizante e reprodução automática.
import { $, announce } from './dom.js';
import { DEMO_FRAMES, state } from './state.js';

const INTERVAL_MS = 1500;
let timer = null;

/** Volta ao primeiro quadro de uma sequência com `count` análises. */
export function resetTimeline(count) {
  state.frame = 0;
  $('frame').max = count - 1;
  $('frame').value = 0;
}

export function renderFrameInfo() {
  const { dataset, frame } = state;
  $('frame-count').textContent = `${frame + 1} / ${dataset ? dataset.frames.length : DEMO_FRAMES}`;
  $('frame-name').textContent = dataset ? dataset.frames[frame].id : `Simulação ${frame + 1}`;
}

export function stopPlayback() {
  clearInterval(timer);
  timer = null;
  $('play').textContent = '▶';
  $('play').setAttribute('aria-label', 'Reproduzir análises');
}

/** Liga os controles; `onChange` é chamado a cada troca de quadro. */
export function initTimeline(onChange) {
  $('frame').oninput = () => {
    state.frame = Number($('frame').value);
    onChange();
    announce(`Análise ${$('frame-count').textContent}: ${$('frame-name').textContent}`);
  };
  $('play').onclick = () => {
    if (timer) { stopPlayback(); return; }
    $('play').textContent = 'Ⅱ';
    $('play').setAttribute('aria-label', 'Pausar análises');
    timer = setInterval(() => {
      state.frame = (state.frame + 1) % (Number($('frame').max) + 1);
      $('frame').value = state.frame;
      onChange();
    }, INTERVAL_MS);
  };
}
