"""Reduz um FBX para carregamento na web.

Uso: blender --background --python optimize_fbx.py -- entrada.fbx saida.fbx [proporcao] [textura_px]

Simplifica as malhas com o modificador Decimate (padrão: 15% das faces) e
reduz as texturas embutidas (padrão: 2048 px, JPEG). Atenção: os índices de
vértice mudam, então medições geradas para o arquivo original deixam de valer.
"""
import bpy
import sys
import tempfile
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:]
source, destination = Path(args[0]).resolve(), Path(args[1]).resolve()
ratio = float(args[2]) if len(args) > 2 else 0.15
texture_px = int(args[3]) if len(args) > 3 else 2048

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(source))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
if not meshes:
    raise RuntimeError('O arquivo não contém malhas.')

before = sum(len(obj.data.polygons) for obj in meshes)
for obj in meshes:
    bpy.context.view_layer.objects.active = obj
    modifier = obj.modifiers.new('Decimate', 'DECIMATE')
    modifier.ratio = ratio
    bpy.ops.object.modifier_apply(modifier=modifier.name)
after = sum(len(obj.data.polygons) for obj in meshes)

# Texturas: redimensiona e regrava em JPEG para embutir no FBX.
tmp = Path(tempfile.mkdtemp())
for image in bpy.data.images:
    if image.size[0] == 0:
        continue
    if max(image.size) > texture_px:
        scale = texture_px / max(image.size)
        image.scale(int(image.size[0] * scale), int(image.size[1] * scale))
    path = tmp / f'{image.name}.jpg'
    image.filepath_raw = str(path)
    image.file_format = 'JPEG'
    image.save(quality=88)
    if image.packed_file:
        image.unpack(method='REMOVE')
    image.filepath = str(path)
    image.reload()

bpy.ops.export_scene.fbx(
    filepath=str(destination),
    use_selection=False,
    object_types={'MESH', 'ARMATURE', 'EMPTY'},
    path_mode='COPY',
    embed_textures=True,
    axis_forward='-Z',
    axis_up='Y',
)
print(f'OPTIMIZED: {destination}; faces {before} -> {after}')
