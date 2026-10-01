"""Gera as imagens ilustrativas de docs/README.md em docs/images/.

Uso: com o servidor local ativo (python -m http.server 8000 --bind 127.0.0.1),
execute python docs/scripts/docs_images.py. Requer Playwright, Chromium e matplotlib.
"""
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / 'images'
URL = 'http://127.0.0.1:8000'
READY = "document.getElementById('meshes').textContent !== '—' && document.getElementById('status').textContent === ''"

# Paradas da escala de severidade, copiadas de js/heatmap.js.
STOPS = [[0, .09, .23, .9], [.2, 0, .74, .98], [.4, .28, .87, .63], [.6, .91, .88, .24], [.8, 1, .61, .14], [1, .81, .13, .17]]

# Gera, dentro da página, um JSON com medições só na metade superior da peça
# e o entrega ao campo de importação, como se o usuário tivesse escolhido o arquivo.
IMPORT_PARTIAL = """() => {
  const meshes = [];
  document.getElementById('model-root').object3D.traverse(o => { if (o.isMesh) meshes.push(o); });
  const T = AFRAME.THREE, p = new T.Vector3(), current = [], reference = [];
  meshes.forEach((mesh, m) => {
    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i); mesh.localToWorld(p);
      if (p.y < 0.15) continue;
      const base = 0.35 + 0.45 * Math.sin(4 * p.x) * Math.cos(3 * p.z);
      current.push({ mesh: m, vertex: i, value: +(base + 0.3 * Math.max(0, p.y - 0.6)).toFixed(3), confidence: 0.9 });
      reference.push({ mesh: m, vertex: i, value: +base.toFixed(3) });
    }
  });
  const data = { unit: 'mm', mapping: 'vertex-index', frames: [{ id: 'Inspeção parcial', samples: current }], reference: { samples: reference } };
  const input = document.getElementById('data-file'), dt = new DataTransfer();
  dt.items.add(new File([JSON.stringify(data)], 'medicoes-parciais.json', { type: 'application/json' }));
  input.files = dt.files;
  input.dispatchEvent(new Event('change'));
}"""


def screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto(URL)
        page.wait_for_function(READY, timeout=180000)

        page.locator('[data-compare="difference"]').click()
        page.locator('#frame').fill('4')
        page.wait_for_timeout(500)
        page.screenshot(path=OUT / 'difference-mode.png')

        page.locator('[data-compare="current"]').click()
        page.locator('#frame').fill('2')
        page.locator('#stage').click(position={'x': 480, 'y': 300})
        page.wait_for_timeout(500)
        page.screenshot(path=OUT / 'vertex-selection.png')

        page.evaluate(IMPORT_PARTIAL)
        page.wait_for_function("document.getElementById('frame-count').textContent === '1 / 1'", timeout=60000)
        page.wait_for_timeout(500)
        page.locator('#stage').screenshot(path=OUT / 'partial-measurements.png')
        browser.close()


def colormaps():
    current = LinearSegmentedColormap.from_list('atual', [(s[0], s[1:]) for s in STOPS])
    maps = [('Escala atual (js/heatmap.js)', current), ('viridis', plt.get_cmap('viridis')), ('cividis', plt.get_cmap('cividis'))]
    x = np.linspace(0, 1, 256)
    fig, axes = plt.subplots(len(maps), 2, figsize=(9, 3.6), gridspec_kw={'width_ratios': [3, 2]})
    for (name, cmap), (bar, curve) in zip(maps, axes):
        rgb = cmap(x)[:, :3]
        luminance = rgb @ [0.2126, 0.7152, 0.0722]
        bar.imshow([rgb], aspect='auto', extent=[0, 1, 0, 1])
        bar.set_yticks([]); bar.set_title(name, fontsize=9, loc='left')
        curve.plot(x, luminance, color='#333')
        curve.set_ylim(0, 1); curve.set_title('luminância', fontsize=9, loc='left')
        for ax in (bar, curve):
            ax.tick_params(labelsize=7)
    for ax in axes[-1]:
        ax.set_xlabel('severidade |d| / τ', fontsize=8)
    fig.suptitle('Uma escala perceptualmente uniforme tem luminância monotônica', fontsize=10)
    fig.tight_layout()
    fig.savefig(OUT / 'colormaps.png', dpi=150)
    plt.close(fig)


def model_optimization():
    labels = ['Tamanho (MB)', 'Faces (mil)', 'Textura (px)']
    before, after = [77.9, 1500, 4096], [11.9, 225, 2048]
    fig, axes = plt.subplots(1, 3, figsize=(9, 2.8))
    for ax, label, b, a in zip(axes, labels, before, after):
        bars = ax.bar(['original', 'otimizado'], [b, a], color=['#9aa5b1', '#2f7de1'])
        ax.bar_label(bars, fmt='%g', fontsize=8)
        ax.set_title(label, fontsize=9)
        ax.spines[['top', 'right']].set_visible(False)
        ax.tick_params(labelsize=8)
        ax.set_yticks([])
    fig.suptitle('rosy-bust.fbx antes e depois de docs/scripts/optimize_fbx.py', fontsize=10)
    fig.tight_layout()
    fig.savefig(OUT / 'model-optimization.png', dpi=150)
    plt.close(fig)


def index_mapping():
    """Esquema: simplificar a malha renumera os vértices e quebra o vínculo por índice."""
    fig, axes = plt.subplots(1, 2, figsize=(9, 3.4))
    grid = [(x, y) for y in range(3) for x in range(4)]
    kept = [0, 3, 5, 6, 8, 11]
    for ax, points, title in ((axes[0], grid, 'Malha original'), (axes[1], [grid[k] for k in kept], 'Malha simplificada')):
        xs, ys = zip(*points)
        ax.triplot(xs, ys, color='#9aa5b1', lw=1)
        ax.scatter(xs, ys, s=260, color='white', edgecolor='#333', zorder=3)
        for n, (x, y) in enumerate(points):
            ax.text(x, y, str(n), ha='center', va='center', fontsize=8, zorder=4)
        ax.set_title(title, fontsize=10)
        ax.set_xlim(-0.5, 3.5); ax.set_ylim(-1.4, 2.5)
        ax.set_aspect('equal'); ax.axis('off')
    axes[0].scatter(*grid[5], s=520, facecolor='none', edgecolor='#d33', lw=2, zorder=5)
    axes[1].scatter(*grid[5], s=520, facecolor='none', edgecolor='#d33', lw=2, zorder=5)
    axes[0].text(1.5, -0.8, 'medição: vertex 5 = 0,87 mm', ha='center', fontsize=8, color='#d33')
    axes[1].text(1.5, -0.8, 'o mesmo ponto agora é o vértice 2;\no índice 5 aponta para outro lugar', ha='center', fontsize=8, color='#d33')
    fig.tight_layout()
    fig.savefig(OUT / 'index-mapping.png', dpi=150)
    plt.close(fig)


if __name__ == '__main__':
    import sys
    OUT.mkdir(exist_ok=True)
    colormaps()
    model_optimization()
    index_mapping()
    if '--no-screenshots' not in sys.argv:
        screenshots()
    print('Imagens geradas em', OUT)
