from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width":1440,"height":900})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:8000')
    page.wait_for_function("document.getElementById('meshes').textContent !== '—'", timeout=60000)
    page.screenshot(path='docs/desktop.png')
    print(json.dumps({'meshes':page.locator('#meshes').inner_text(),'status':page.locator('#status').inner_text(),'errors':errors}))
    page.locator('[data-mode="normal"]').click()
    page.locator('[data-mode="heat"]').click()
    page.locator('[data-compare="difference"]').click()
    page.locator('#tolerance').fill('0.5')
    assert '0,5' in page.locator('#legend-high').inner_text()
    page.locator('#frame').fill('3')
    assert page.locator('#frame-count').inner_text() == '4 / 5'
    page.locator('#stage').click(position={'x':480,'y':350})
    print('selected:',page.locator('#selection-name').inner_text())
    data={'unit':'mm','mapping':'vertex-index','frames':[{'id':'Teste','samples':[{'mesh':0,'vertex':6495,'value':.87,'confidence':.94}]}],'reference':{'samples':[{'mesh':0,'vertex':6495,'value':.2}]}}
    page.locator('#data-file').set_input_files({'name':'measurements.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    page.wait_for_function("document.getElementById('frame-count').textContent === '1 / 1'")
    assert page.locator('#value').inner_text() == '0,87 mm'
    assert page.locator('#confidence').inner_text() == '94%'
    page.locator('[data-compare="difference"]').click()
    assert page.locator('#value').inner_text() == '0,67 mm'
    data['frames'][0]['samples'][0]['vertex']=-1
    page.locator('#data-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    page.wait_for_function("document.getElementById('status').textContent.includes('Falha ao importar')")
    assert page.locator('#frame-count').inner_text() == '1 / 1'
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path='docs/mobile.png')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not errors, errors
    browser.close()
