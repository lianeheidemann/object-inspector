// Aplicação do mapa de calor nas malhas e atualização da legenda.
import { shownValue } from './dataset.js';
import { $, fmt, tolerance } from './dom.js';
import { colorFor, gradientCss, palettes } from './heatmap.js';
import { updateSelection } from './selection.js';
import { state } from './state.js';
import { renderFrameInfo } from './timeline.js';

const T = AFRAME.THREE;

/** Atributo de cor da malha, criado uma vez e reaproveitado nas próximas pinturas. */
function colorAttribute(mesh) {
  if (!mesh.userData.colors) {
    const count = mesh.geometry.attributes.position.count;
    mesh.userData.colors = new T.BufferAttribute(new Float32Array(count * 3), 3);
    mesh.geometry.setAttribute('color', mesh.userData.colors);
  }
  return mesh.userData.colors;
}

function paintMeshes(tol) {
  const difference = state.comparison === 'difference', { stops } = palettes[state.palette];
  state.meshes.forEach((mesh, m) => {
    if (state.mode === 'normal') { mesh.material = mesh.userData.original; return; }
    const attr = colorAttribute(mesh), colors = attr.array;
    for (let i = 0; i < attr.count; i++) colors.set(colorFor(shownValue(m, i), tol, difference, stops), i * 3);
    attr.needsUpdate = true;
    mesh.material = mesh.userData.heat;
  });
}

function renderLegend(tol) {
  const difference = state.comparison === 'difference';
  $('legend-low').textContent = difference ? `−${fmt(tol)} mm` : '0 mm';
  $('legend-high').textContent = `${fmt(tol)} mm ≥`;
  const palette = palettes[state.palette];
  $('gradient').style.background = difference ? 'linear-gradient(90deg,#1973ff,#fff,#ff2626)' : gradientCss(palette.stops);
  $('legend-note').textContent = difference
    ? 'Azul: abaixo da referência. Vermelho: acima. Cinza: sem medição.'
    : `${palette.high}: limite atingido ou excedido. Cinza: sem medição.`;
}

/** Redesenha o mapa e os painéis dependentes a partir do estado atual. */
export function applyMap() {
  if (!state.meshes.length) return;
  const tol = tolerance();
  if (!Number.isFinite(tol) || tol <= 0) return;
  paintMeshes(tol);
  renderLegend(tol);
  renderFrameInfo();
  updateSelection();
}
