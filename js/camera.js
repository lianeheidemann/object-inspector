// Câmera orbital: rotação, deslocamento e zoom em torno de um alvo.
import { $ } from './dom.js';

const T = AFRAME.THREE;
const PITCH_LIMIT = 1.4;
const view = { yaw: .6, pitch: .35, distance: 5, target: new T.Vector3() };
const listeners = [];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const getCamera = () => $('camera').getObject3D('camera');

/** Registra uma função chamada sempre que a câmera se move. */
export function onCameraChange(fn) { listeners.push(fn); }

export function updateCamera() {
  const c = getCamera();
  if (!c) return;
  const { yaw, pitch, distance, target } = view;
  c.position.set(
    target.x + distance * Math.cos(pitch) * Math.sin(yaw),
    target.y + distance * Math.sin(pitch),
    target.z + distance * Math.cos(pitch) * Math.cos(yaw),
  );
  c.lookAt(target);
  listeners.forEach(fn => fn());
}

export function resetCamera() {
  Object.assign(view, { yaw: .6, pitch: .35, distance: 5 });
  view.target.set(0, 0, 0);
  updateCamera();
}

export function zoom(factor) {
  view.distance = clamp(view.distance * factor, .5, 15);
  updateCamera();
}

export function rotate(dYaw, dPitch) {
  view.yaw += dYaw;
  view.pitch = clamp(view.pitch + dPitch, -PITCH_LIMIT, PITCH_LIMIT);
  updateCamera();
}

/** Desloca o alvo no plano da tela, proporcionalmente à distância. */
export function pan(dx, dy) {
  const c = getCamera();
  const right = new T.Vector3().setFromMatrixColumn(c.matrixWorld, 0);
  const up = new T.Vector3().setFromMatrixColumn(c.matrixWorld, 1);
  view.target
    .addScaledVector(right, -dx * view.distance * .0015)
    .addScaledVector(up, dy * view.distance * .0015);
  updateCamera();
}
