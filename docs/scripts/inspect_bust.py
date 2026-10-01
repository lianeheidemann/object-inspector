from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:print('ERROR',e))
    page.on('console',lambda m:print(m.text) if m.type=='warning' else None)
    page.goto('http://127.0.0.1:8000')
    page.wait_for_function("document.getElementById('meshes').textContent !== '—' && document.getElementById('status').textContent === ''",timeout=180000)
    assert page.locator('#filename').inner_text() == 'rosy-bust.fbx'
    page.screenshot(path='docs/images/desktop.png')
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path='docs/images/mobile.png')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.set_viewport_size({'width':1440,'height':900})
    page.locator('[data-mode="normal"]').click()
    page.wait_for_timeout(2000)
    page.wait_for_function("""() => {let ready=true;document.getElementById('model-root').object3D.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(m.map&&!m.map.image?.width)ready=false;});return ready;}""",timeout=60000)
    print(json.dumps(page.evaluate("""() => { const out=[];document.getElementById('model-root').object3D.traverse(o=>{if(o.isMesh)out.push({vertices:o.geometry.attributes.position.count,normal:!!o.geometry.attributes.normal,materials:[].concat(o.material).map(m=>({type:m.type,color:m.color?.getHexString(),opacity:m.opacity,vertexColors:m.vertexColors,map:!!m.map,image:m.map?.image?{width:m.map.image.width,height:m.map.image.height}:null}))})}); return out;}""")))
    page.screenshot(path='docs/images/bust-normal.png')
    browser.close()
