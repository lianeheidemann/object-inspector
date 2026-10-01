import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateDataset } from '../js/validation.js';

// Malhas falsas: só o que validateDataset lê.
const mesh = count => ({ geometry: { attributes: { position: { count } } } });
const meshes = [mesh(10), mesh(4)];

const valid = () => ({
  unit: 'mm',
  mapping: 'vertex-index',
  frames: [
    { id: 'A', samples: [{ mesh: 0, vertex: 0, value: 0.1, confidence: 0.9 }, { mesh: 1, vertex: 3, value: -0.2 }] },
    { id: 'B', samples: [{ mesh: 0, vertex: 0, value: 0.3 }] },
  ],
  reference: { samples: [{ mesh: 0, vertex: 0, value: 0.05 }] },
});

const rejects = (change, message) => {
  const data = valid();
  change(data);
  assert.throws(() => validateDataset(data, meshes), message);
};

test('aceita um arquivo válido e o devolve sem alterações', () => {
  const data = valid();
  assert.equal(validateDataset(data, meshes), data);
});

test('reference e confidence são opcionais', () => {
  const data = valid();
  delete data.reference;
  delete data.frames[0].samples[0].confidence;
  assert.doesNotThrow(() => validateDataset(data, meshes));
});

test('rejeita unidade, mapeamento ou frames ausentes', () => {
  rejects(d => { d.unit = 'cm'; }, /Formato esperado/);
  rejects(d => { d.mapping = 'uv'; }, /Formato esperado/);
  rejects(d => { d.frames = []; }, /Formato esperado/);
  rejects(d => { delete d.frames; }, /Formato esperado/);
});

test('rejeita id ausente ou repetido', () => {
  rejects(d => { d.frames[1].id = 'A'; }, /id único/);
  rejects(d => { delete d.frames[0].id; }, /id único/);
});

test('rejeita samples que não são lista', () => {
  rejects(d => { d.frames[0].samples = {}; }, /samples/);
  rejects(d => { d.reference.samples = null; }, /samples/);
});

test('rejeita malha ou vértice inexistente', () => {
  rejects(d => { d.frames[0].samples[0].mesh = 2; }, /inexistente/);
  rejects(d => { d.frames[0].samples[0].vertex = -1; }, /inexistente/);
  rejects(d => { d.frames[0].samples[1].vertex = 4; }, /inexistente/);
  rejects(d => { d.frames[0].samples[0].vertex = 1.5; }, /inexistente/);
});

test('rejeita valor não finito ou confiança fora de [0, 1]', () => {
  rejects(d => { d.frames[0].samples[0].value = NaN; }, /inválidos/);
  rejects(d => { d.frames[0].samples[0].value = '0.1'; }, /inválidos/);
  rejects(d => { d.frames[0].samples[0].confidence = 1.2; }, /inválidos/);
  rejects(d => { d.frames[0].samples[0].confidence = -0.1; }, /inválidos/);
});

test('rejeita medição duplicada no mesmo quadro', () => {
  rejects(d => { d.frames[0].samples.push({ mesh: 0, vertex: 0, value: 1 }); }, /duplicada/);
});

test('model: aceita contagens iguais às do modelo carregado', () => {
  const data = valid();
  data.model = { meshes: [{ vertices: 10 }, { vertices: 4 }] };
  assert.doesNotThrow(() => validateDataset(data, meshes));
});

test('model: rejeita medições de outro modelo', () => {
  rejects(d => { d.model = { meshes: [{ vertices: 10 }] }; }, /1 malha\(s\); o modelo carregado tem 2/);
  rejects(d => { d.model = { meshes: [{ vertices: 10 }, { vertices: 5 }] }; }, /malha 1 deveria ter 5 vértices, mas tem 4/);
  rejects(d => { d.model = {}; }, /Campo model inválido/);
});
