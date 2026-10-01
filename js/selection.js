// Seleção de vértice por clique, marcador e painel "Região selecionada".
import { getCamera } from './camera.js';
import { shownConfidence, shownValue } from './dataset.js';
import { $, announce, fmt, tolerance } from './dom.js';
import { state } from './state.js';

const T = AFRAME.THREE;
const ray = new T.Raycaster();
const pointer = new T.Vector2();

export const marker = new T.Mesh(
  new T.SphereGeometry(.018, 16, 12),
  new T.MeshBasicMaterial({ color: 0xffffff, depthTest: false }),
);
marker.visible = false;
marker.renderOrder = 10;

export function clearSelection() {
  state.selected = null;
  marker.visible = false;
  $('point-label').hidden = true;
  $('value').textContent = '—';
  $('severity').textContent = '—';
  $('confidence').textContent = 'Não disponível';
  $('selection-name').textContent = 'Selecione um ponto na peça';
  $('coordinates').textContent = 'Valores vinculados à superfície 3D';
}

export function updateSelection() {
  if (!state.selected) return;
  const { m, i } = state.selected, v = shownValue(m, i);
  const confidence = shownConfidence(m, i);
  $('selection-name').textContent = `Malha ${m} · vértice ${i}`;
  $('value').textContent = Number.isFinite(v) ? `${fmt(v)} mm` : 'Sem medição';
  $('severity').textContent = Number.isFinite(v) ? `${fmt(Math.abs(v) / tolerance() * 100)}%` : '—';
  $('confidence').textContent = confidence === undefined ? 'Não disponível' : `${fmt(confidence * 100)}%`;
  $('point-label').textContent = $('value').textContent;
  updateLabel();
}

/** Posiciona o rótulo flutuante sobre o marcador, na tela. */
export function updateLabel() {
  const camera = getCamera();
  if (!state.selected || !camera) return;
  const stage = $('stage'), label = $('point-label');
  const p = marker.position.clone().project(camera);
  label.hidden = p.z > 1 || p.z < -1;
  label.style.left = `${(p.x + 1) * stage.clientWidth / 2 + 14}px`;
  label.style.top = `${(1 - p.y) * stage.clientHeight / 2 - 25}px`;
}

/** Seleciona o vértice da face atingida mais próximo do ponto clicado. */
export function pick(e) {
  if (!state.meshes.length) return;
  const r = $('stage').getBoundingClientRect();
  pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(pointer, getCamera());
  const hit = ray.intersectObjects(state.meshes, false)[0];
  if (!hit) return;
  const pos = hit.object.geometry.attributes.position;
  let nearest = hit.face.a, dist = Infinity;
  for (const i of [hit.face.a, hit.face.b, hit.face.c]) {
    const p = new T.Vector3().fromBufferAttribute(pos, i);
    hit.object.localToWorld(p);
    const d = p.distanceToSquared(hit.point);
    if (d < dist) { nearest = i; dist = d; marker.position.copy(p); }
  }
  state.selected = { m: state.meshes.indexOf(hit.object), i: nearest };
  marker.visible = true;
  const { x, y, z } = marker.position;
  $('coordinates').textContent = `X ${fmt(x)} · Y ${fmt(y)} · Z ${fmt(z)} (visual)`;
  updateSelection();
  announce(`${$('selection-name').textContent}: ${$('value').textContent}`);
}
