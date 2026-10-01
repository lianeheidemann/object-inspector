import assert from 'node:assert/strict';
import { test } from 'node:test';
import { colorFor, demoValue, gradientCss, palettes } from '../js/heatmap.js';

const close = (actual, expected) => actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 1e-9, `${actual} ≠ ${expected}`));
const { stops } = palettes.padrao;

test('valor ausente fica cinza', () => {
  close(colorFor(NaN, 1), [.38, .42, .47]);
  close(colorFor(Infinity, 1, true), [.38, .42, .47]);
});

test('severidade 0 e τ correspondem às paradas extremas', () => {
  close(colorFor(0, 1), stops[0].slice(1));
  close(colorFor(1, 1), stops.at(-1).slice(1));
});

test('acima de τ satura e o sinal não importa', () => {
  close(colorFor(5, 1), colorFor(1, 1));
  close(colorFor(-0.4, 1), colorFor(0.4, 1));
});

test('a severidade é relativa à tolerância', () => {
  close(colorFor(0.5, 0.5), colorFor(1, 1));
  close(colorFor(0.2, 2), colorFor(0.1, 1));
});

test('paradas intermediárias são interpoladas linearmente', () => {
  const mid = stops[0].slice(1).map((v, i) => (v + stops[1][i + 1]) / 2);
  close(colorFor(0.1, 1), mid);
});

test('modo diferença: branco no zero, azul abaixo e vermelho acima', () => {
  close(colorFor(0, 1, true), [1, 1, 1]);
  close(colorFor(-1, 1, true), [0.1, 0.45, 1]);
  close(colorFor(1, 1, true), [1, 0.15, 0.15]);
});

test('outra paleta muda as cores, não a severidade', () => {
  const viridis = palettes.viridis.stops;
  close(colorFor(1, 1, false, viridis), viridis.at(-1).slice(1));
  close(colorFor(0, 1, false, viridis), viridis[0].slice(1));
});

test('gradientCss percorre todas as paradas', () => {
  const css = gradientCss(stops);
  assert.match(css, /^linear-gradient\(90deg,/);
  assert.equal(css.match(/rgb\(/g).length, stops.length);
});

test('demoValue é determinístico e cresce com o quadro', () => {
  const p = { x: 0.38, y: 0.55, z: 0.35 };
  assert.equal(demoValue(p, 2), demoValue({ ...p }, 2));
  assert.ok(demoValue({ x: 5, y: 5, z: 5 }, 0) - 0.04 < 1e-6);
  assert.ok(demoValue(p, 4) > demoValue(p, 0));
});
