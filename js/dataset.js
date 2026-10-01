// Leitura dos valores por vértice, medidos ou simulados.
import { demoValue } from './heatmap.js';
import { state } from './state.js';

export { validateDataset } from './validation.js';

const point = { x: 0, y: 0, z: 0 };

// Chave numérica única para (malha, vértice); malhas têm menos de 2^32 vértices.
const keyOf = (m, i) => m * 2 ** 32 + i;
const indexSamples = samples => new Map(samples.map(s => [keyOf(s.mesh, s.vertex), s]));

/** Indexa as amostras por vértice para consulta em tempo constante. */
export function indexDataset(data) {
  return {
    frames: data.frames.map(f => indexSamples(f.samples)),
    reference: data.reference ? indexSamples(data.reference.samples) : null,
  };
}

const findSample = (frame, reference, m, i) =>
  (reference ? state.index?.reference : state.index?.frames[frame])?.get(keyOf(m, i));

/** Desvio medido (ou simulado, sem dados importados) no vértice `i` da malha `m`. */
export function valueAt(m, i, frame = state.frame, reference = false) {
  if (state.dataset) return findSample(frame, reference, m, i)?.value ?? NaN;
  const world = state.meshes[m].userData.worldPositions;
  point.x = world[i * 3]; point.y = world[i * 3 + 1]; point.z = world[i * 3 + 2];
  return demoValue(point, reference ? 0 : frame);
}

/** Valor exibido conforme o modo de comparação ativo. */
export function shownValue(m, i) {
  if (state.comparison === 'reference') return valueAt(m, i, 0, true);
  const v = valueAt(m, i);
  return state.comparison === 'difference' ? v - valueAt(m, i, 0, true) : v;
}

/** Confiança informada para o vértice; indefinida no modo diferença. */
export function shownConfidence(m, i) {
  if (state.comparison === 'difference') return undefined;
  return findSample(state.frame, state.comparison === 'reference', m, i)?.confidence;
}
