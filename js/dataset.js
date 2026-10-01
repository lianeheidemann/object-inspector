// Validação das medições importadas e leitura dos valores por vértice.
import { demoValue } from './heatmap.js';
import { state } from './state.js';

const T = AFRAME.THREE;

export function validateDataset(data, meshes) {
  if (data.unit !== 'mm' || data.mapping !== 'vertex-index' || !Array.isArray(data.frames) || !data.frames.length) throw new Error('Formato esperado: unit=mm, mapping=vertex-index e frames com pelo menos uma análise.');
  const ids = new Set();
  const check = samples => {
    if (!Array.isArray(samples)) throw new Error('Cada análise precisa de samples.');
    const seen = new Set();
    for (const s of samples) {
      const mesh = meshes[s.mesh], key = `${s.mesh}:${s.vertex}`;
      if (!Number.isInteger(s.mesh) || !mesh || !Number.isInteger(s.vertex) || s.vertex < 0 || s.vertex >= mesh.geometry.attributes.position.count) throw new Error('Malha ou vértice inexistente.');
      if (!Number.isFinite(s.value) || (s.confidence !== undefined && (!Number.isFinite(s.confidence) || s.confidence < 0 || s.confidence > 1))) throw new Error('Valor ou confiança inválidos.');
      if (seen.has(key)) throw new Error('Medição duplicada.');
      seen.add(key);
    }
  };
  for (const f of data.frames) {
    if (typeof f.id !== 'string' || ids.has(f.id)) throw new Error('Cada análise precisa de id único.');
    ids.add(f.id);
    check(f.samples);
  }
  if (data.reference) check(data.reference.samples);
  return data;
}

const samplesOf = (frame, reference) =>
  reference ? state.dataset?.reference?.samples : state.dataset?.frames[frame]?.samples;

const findSample = (samples, m, i) => samples?.find(s => s.mesh === m && s.vertex === i);

/** Desvio medido (ou simulado, sem dados importados) no vértice `i` da malha `m`. */
export function valueAt(m, i, frame = state.frame, reference = false) {
  if (state.dataset) return findSample(samplesOf(frame, reference), m, i)?.value ?? NaN;
  const mesh = state.meshes[m];
  const p = new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, i);
  mesh.localToWorld(p);
  return demoValue(p, reference ? 0 : frame);
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
  return findSample(samplesOf(state.frame, state.comparison === 'reference'), m, i)?.confidence;
}
