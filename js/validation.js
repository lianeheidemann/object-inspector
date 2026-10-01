// Validação do JSON de medições. Sem dependência de AFRAME, para rodar também no Node.

/** Número de vértices de uma malha carregada. */
const vertexCount = mesh => mesh.geometry.attributes.position.count;

/**
 * Confere o campo opcional `model`, que identifica o FBX para o qual as
 * medições foram geradas: `{ meshes: [{ vertices: N }, ...] }`.
 */
function checkModel(model, meshes) {
  if (model === undefined) return;
  if (!model || !Array.isArray(model.meshes)) throw new Error('Campo model inválido: esperado model.meshes com o número de vértices de cada malha.');
  if (model.meshes.length !== meshes.length) throw new Error(`As medições são de um modelo com ${model.meshes.length} malha(s); o modelo carregado tem ${meshes.length}.`);
  model.meshes.forEach((m, i) => {
    if (m?.vertices !== vertexCount(meshes[i])) throw new Error(`As medições são de outro modelo: a malha ${i} deveria ter ${m?.vertices} vértices, mas tem ${vertexCount(meshes[i])}.`);
  });
}

export function validateDataset(data, meshes) {
  if (data.unit !== 'mm' || data.mapping !== 'vertex-index' || !Array.isArray(data.frames) || !data.frames.length) throw new Error('Formato esperado: unit=mm, mapping=vertex-index e frames com pelo menos uma análise.');
  checkModel(data.model, meshes);
  const ids = new Set();
  const check = samples => {
    if (!Array.isArray(samples)) throw new Error('Cada análise precisa de samples.');
    const seen = new Set();
    for (const s of samples) {
      const mesh = meshes[s.mesh], key = `${s.mesh}:${s.vertex}`;
      if (!Number.isInteger(s.mesh) || !mesh || !Number.isInteger(s.vertex) || s.vertex < 0 || s.vertex >= vertexCount(mesh)) throw new Error('Malha ou vértice inexistente.');
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
