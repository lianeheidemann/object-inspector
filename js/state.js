// Estado compartilhado entre os módulos do visualizador.
export const DEMO_FRAMES = 5;

export const state = {
  model: null,
  meshes: [],
  dataset: null,
  index: null,             // medições indexadas por vértice (ver indexDataset)
  palette: 'padrao',       // chave de palettes em heatmap.js
  mode: 'heat',            // 'heat' | 'normal'
  comparison: 'current',   // 'current' | 'reference' | 'difference'
  frame: 0,
  tool: 'rotate',          // 'rotate' | 'pan'
  selected: null,          // { m: índice da malha, i: índice do vértice }
};
