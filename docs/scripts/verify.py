"""Teste de navegador do Object Inspector (Playwright/Chromium).

Uso, com o servidor local ativo na raiz do repositório:
    python docs/scripts/verify.py                 # só verifica
    python docs/scripts/verify.py --screenshots   # verifica e regrava docs/images/desktop.png e mobile.png
"""
from playwright.sync_api import sync_playwright
import json
import sys

SCREENSHOTS = '--screenshots' in sys.argv


def text(page, selector):
    return page.locator(selector).inner_text()


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width":1440,"height":900})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:8000')
    page.wait_for_function("document.getElementById('meshes').textContent !== '—' && document.getElementById('status').textContent === ''", timeout=180000)
    if SCREENSHOTS:
        page.screenshot(path='docs/images/desktop.png')
    print(json.dumps({'meshes':text(page,'#meshes'),'status':text(page,'#status'),'errors':errors}))
    assert text(page,'#model-name') == 'Modelo: rosy-bust.fbx'
    assert text(page,'#piece-title') == 'Peça de demonstração'

    # Paleta: a nota da legenda acompanha a cor do limite.
    page.locator('#palette').select_option('viridis')
    assert text(page,'#legend-note').startswith('Amarelo')
    page.locator('#palette').select_option('padrao')
    assert text(page,'#legend-note').startswith('Vermelho')

    page.locator('[data-mode="normal"]').click()
    page.locator('[data-mode="heat"]').click()
    page.locator('[data-compare="difference"]').click()
    page.locator('#tolerance').fill('0.5')
    # A tolerância é aplicada com debounce.
    page.wait_for_function("document.getElementById('legend-high').textContent.includes('0,5')")
    page.locator('#frame').fill('3')
    assert text(page,'#frame-count') == '4 / 5'
    assert text(page,'#announcer').startswith('Análise 4 / 5')
    page.locator('#stage').click(position={'x':480,'y':350})
    selection=text(page,'#selection-name')
    print('selected:',selection)
    assert selection.startswith('Malha 0'), selection
    assert text(page,'#announcer').startswith(selection)
    vertex=int(selection.split()[-1])
    vertices=page.evaluate("(() => { let n=0; document.getElementById('model-root').object3D.traverse(o => { if (o.isMesh) n = o.geometry.attributes.position.count; }); return n; })()")

    data={'unit':'mm','mapping':'vertex-index','model':{'meshes':[{'vertices':vertices}]},'frames':[{'id':'Teste','samples':[{'mesh':0,'vertex':vertex,'value':.87,'confidence':.94}]}],'reference':{'samples':[{'mesh':0,'vertex':vertex,'value':.2}]}}
    page.locator('#data-file').set_input_files({'name':'measurements.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    page.wait_for_function("document.getElementById('frame-count').textContent === '1 / 1'")
    assert text(page,'#value') == '0,87 mm'
    assert text(page,'#confidence') == '94%'
    page.locator('[data-compare="difference"]').click()
    assert text(page,'#value') == '0,67 mm'

    # Medições de outro modelo são recusadas sem alterar o estado.
    data['model']['meshes'][0]['vertices']=vertices+1
    page.locator('#data-file').set_input_files({'name':'other-model.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    page.wait_for_function("document.getElementById('status').textContent.includes('outro modelo')")
    data['model']['meshes'][0]['vertices']=vertices
    data['frames'][0]['samples'][0]['vertex']=-1
    page.locator('#data-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    page.wait_for_function("document.getElementById('status').textContent.includes('inexistente')")
    assert text(page,'#frame-count') == '1 / 1'
    assert text(page,'#value') == '0,67 mm'

    page.set_viewport_size({'width':390,'height':844})
    if SCREENSHOTS:
        page.screenshot(path='docs/images/mobile.png')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not errors, errors
    browser.close()
    print('OK')
