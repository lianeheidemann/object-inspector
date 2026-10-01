"""Run with Blender --background --python this_file -- input.glb output.fbx."""
import bpy
import sys
from pathlib import Path

source, destination = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path(source).resolve()))
# Embedded image names can be extensionless; the project's FBXLoader
# detects PNG/JPEG from their binary signatures.
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
if not meshes:
    raise RuntimeError('O arquivo não contém malhas.')
bpy.ops.export_scene.fbx(
    filepath=str(Path(destination).resolve()),
    use_selection=False,
    object_types={'MESH', 'ARMATURE', 'EMPTY'},
    path_mode='COPY',
    embed_textures=True,
    axis_forward='-Z',
    axis_up='Y',
    bake_anim=True,
)
print(f'EXPORTED: {destination}; meshes={len(meshes)}')
# Reload the output to verify that the saved FBX contains geometry.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(Path(destination).resolve()))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
if not meshes or not all(len(obj.data.vertices) > 0 for obj in meshes):
    raise RuntimeError('O FBX exportado não contém geometria válida.')
print(f'VERIFIED: meshes={len(meshes)}; vertices={sum(len(obj.data.vertices) for obj in meshes)}')
