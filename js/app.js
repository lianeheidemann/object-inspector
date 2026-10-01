// Object Inspector — ponto de entrada: liga os módulos à interface e carrega o modelo padrão.
import { onCameraChange, resetCamera } from './camera.js';
import { initControls } from './controls.js';
import { indexDataset, validateDataset } from './dataset.js';
import { $, setActive, setStatus } from './dom.js';
import { applyMap } from './map.js';
import { disposeModel, loadFBX, prepareModel } from './model.js';
import { clearSelection, marker, updateLabel } from './selection.js';
import { DEMO_FRAMES, state } from './state.js';
import { initTimeline, resetTimeline, stopPlayback } from './timeline.js';

const T = AFRAME.THREE;
const scene = $('scene'), root = $('model-root');

/** `title` aparece no palco; por padrão, o nome do arquivo sem extensão. */
async function loadModel(buffer, name, title = name.replace(/\.fbx$/i, '')) {
  setStatus('Carregando e preparando a geometria…');
  try {
    const loaded = await loadFBX(buffer, f => setStatus(f < 1 ? `Baixando modelo… ${Math.round(f * 100)}%` : 'Preparando a geometria…'));
    if (state.model) { root.removeObject3D('mesh'); disposeModel(state.model); }
    state.model = loaded;
    state.meshes = [];
    state.meshes = prepareModel(loaded, root);
    state.dataset = null;
    state.index = null;
    state.comparison = 'current';
    resetTimeline(DEMO_FRAMES);
    $('source').textContent = 'Demonstração · dados simulados';
    $('data-kind').textContent = 'Simulação determinística';
    $('filename').textContent = name;
    $('model-name').textContent = `Modelo: ${name}`;
    $('piece-title').textContent = title;
    $('meshes').textContent = String(state.meshes.length);
    setActive('compare', 'current');
    clearSelection();
    resetCamera();
    applyMap();
    setStatus('');
  } catch (e) {
    setStatus(`Não foi possível carregar o FBX: ${e.message}. Verifique o arquivo e suas texturas.`);
  }
}

async function importDataset(file) {
  try {
    if (!state.meshes.length) throw new Error('Carregue uma peça primeiro.');
    const data = validateDataset(JSON.parse(await file.text()), state.meshes);
    stopPlayback();
    state.dataset = data;
    state.index = indexDataset(data);
    state.comparison = 'current';
    resetTimeline(data.frames.length);
    $('source').textContent = 'Medições importadas · ' + file.name;
    $('data-kind').textContent = 'Medições importadas';
    setActive('compare', 'current');
    setStatus('');
    applyMap();
  } catch (err) {
    setStatus('Falha ao importar: ' + err.message);
  }
}

function bindPanels() {
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
    state.mode = b.dataset.mode;
    setActive('mode', state.mode);
    applyMap();
  });
  document.querySelectorAll('[data-compare]').forEach(b => b.onclick = () => {
    if (state.dataset && b.dataset.compare !== 'current' && !state.dataset.reference) {
      setStatus('Importe uma referência no JSON para comparar.');
      return;
    }
    setStatus('');
    state.comparison = b.dataset.compare;
    setActive('compare', state.comparison);
    applyMap();
  });
  let toleranceTimer;
  $('tolerance').oninput = () => { clearTimeout(toleranceTimer); toleranceTimer = setTimeout(applyMap, 150); };
  $('palette').onchange = () => { state.palette = $('palette').value; applyMap(); };

  $('open-model').onclick = () => $('model-file').click();
  $('model-file').onchange = async e => {
    const f = e.target.files[0];
    if (f) { stopPlayback(); await loadModel(await f.arrayBuffer(), f.name); }
    e.target.value = '';
  };
  $('open-data').onclick = () => $('data-file').click();
  $('data-file').onchange = async e => {
    const f = e.target.files[0];
    if (f) await importDataset(f);
    e.target.value = '';
  };

  $('help').onclick = () => $('help-dialog').showModal();
  $('close-help').onclick = () => $('help-dialog').close();
}

function init() {
  scene.object3D.add(marker);
  const grid = new T.GridHelper(12, 24, 0x354556, 0x26323e);
  grid.position.y = -1.4;
  scene.object3D.add(grid);
  loadModel(null, 'rosy-bust.fbx', 'Peça de demonstração');
}

initControls();
initTimeline(applyMap);
bindPanels();
onCameraChange(updateLabel);
new ResizeObserver(updateLabel).observe($('stage'));
if (scene.hasLoaded) init(); else scene.addEventListener('loaded', init, { once: true });
