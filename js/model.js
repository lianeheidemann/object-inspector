// Carregamento, normalização e descarte de modelos FBX.
import { FBXLoader } from '../assets/vendor/FBXLoader.js';

const T = AFRAME.THREE;
export const DEFAULT_MODEL_URL = 'assets/models/rosy-bust.fbx';
const VIEW_SIZE = 2.6;

/**
 * Lê um FBX de um ArrayBuffer ou, sem buffer, baixa o modelo padrão.
 * `onProgress` recebe a fração baixada (0 a 1) quando o tamanho é conhecido.
 */
export async function loadFBX(buffer, onProgress) {
  if (buffer) return new FBXLoader().parse(buffer, '');
  return new FBXLoader().loadAsync(DEFAULT_MODEL_URL, e => {
    if (e.lengthComputable) onProgress?.(e.loaded / e.total);
  });
}

/** Libera geometrias, materiais e texturas de um modelo removido da cena. */
export function disposeModel(model) {
  model.traverse(o => {
    o.geometry?.dispose();
    if (!o.isMesh) return;
    for (const mat of new Set([].concat(o.userData.original || o.material, o.userData.heat || []))) {
      for (const val of Object.values(mat)) if (val?.isTexture) val.dispose();
      mat.dispose();
    }
  });
}

/** Posições dos vértices em coordenadas do mundo, calculadas uma única vez. */
function worldPositions(mesh) {
  const pos = mesh.geometry.attributes.position, out = new Float32Array(pos.count * 3), p = new T.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    mesh.localToWorld(p);
    out[i * 3] = p.x; out[i * 3 + 1] = p.y; out[i * 3 + 2] = p.z;
  }
  return out;
}

/**
 * Centraliza e escala o modelo apenas para visualização, adiciona-o à entidade
 * `root` e devolve as malhas na ordem de travessia do FBXLoader.
 */
export function prepareModel(model, root) {
  const box = new T.Box3().setFromObject(model);
  const size = box.getSize(new T.Vector3());
  const center = box.getCenter(new T.Vector3());
  const extent = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(extent) || extent <= 0) throw new Error('Geometria vazia.');
  const scale = VIEW_SIZE / extent;
  model.scale.multiplyScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
  root.setObject3D('mesh', model);
  model.updateMatrixWorld(true);

  const meshes = [];
  model.traverse(o => {
    if (!o.isMesh) return;
    o.geometry = o.geometry.clone();
    o.userData.original = o.material;
    o.userData.heat = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: .85, metalness: 0 });
    o.userData.worldPositions = worldPositions(o);
    meshes.push(o);
  });
  return meshes;
}
