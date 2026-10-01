// Aplicação do mapa de calor nas malhas e atualização da legenda.
import { shownValue } from './dataset.js';
import { $, fmt, tolerance } from './dom.js';
import { colorFor } from './heatmap.js';
import { updateSelection } from './selection.js';
import { state } from './state.js';
import { renderFrameInfo } from './timeline.js';

const T = AFRAME.THREE;

function paintMeshes(tol) {
  const difference = state.comparison === 'difference';
  state.meshes.forEach((mesh, m) => {
    if (state.mode === 'normal') { mesh.material = mesh.userData.original; return; }
    const pos = mesh.geometry.attributes.position, colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) colors.set(colorFor(shownValue(m, i), tol, difference), i * 3);
    mesh.geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
    mesh.material = mesh.userData.heat;
  });
}

function renderLegend(tol) {
  const difference = state.comparison === 'difference';
  $('legend-low').textContent = difference ? `−${fmt(tol)} mm` : '0 mm';
  $('legend-high').textContent = `${fmt(tol)} mm ≥`;
  $('gradient').style.background = difference ? 'linear-gradient(90deg,#1973ff,#fff,#ff2626)' : '';
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
