"""Build a reusable 7-second Blender insert. Run with Blender --background --python.

No external add-ons. All scene geometry, materials, camera keys and sound are generated.
Use -- --stills for layout checks, -- --render for the complete PNG sequence.
"""
import argparse
from pathlib import Path
import sys
import wave

import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out" / "blender"
FRAMES = OUT / "frames"
ASSETS = ROOT / "public" / "blender"
for directory in (OUT, FRAMES, ASSETS):
    directory.mkdir(parents=True, exist_ok=True)

parser = argparse.ArgumentParser()
parser.add_argument("--stills", action="store_true")
parser.add_argument("--render", action="store_true")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.eevee.taa_render_samples = 32
scene.render.resolution_x = 960
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.fps = 30
scene.frame_start, scene.frame_end = 1, 210
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.film_transparent = False
scene.render.use_motion_blur = True
scene.render.motion_blur_shutter = .3
scene.view_settings.view_transform = "AgX"
scene.world = bpy.data.worlds.new("Dark studio")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.025, .036, .042, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = .3

def material(name, color, metal=0, roughness=.4, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Emission Color"].default_value = (*color, 1)
    bsdf.inputs["Emission Strength"].default_value = emission
    return mat

graphite = material("Graphite ceramic", (.023, .030, .034), .4, .45)
edge = material("Machined dark silver", (.23, .29, .30), .85, .24)
old = material("Previous result - satin aluminum", (.28, .35, .37), .6, .27)
cyan = material("Current result - teal anodized", (.015, .42, .31), .35, .3, .16)
white = material("Warm white typography", (.86, .91, .88), 0, .55, .8)
muted = material("Secondary typography", (.26, .35, .38), 0, .5, .6)
glow = material("Cyan highlight", (.045, .85, .65), .2, .28, 3.0)
grid = material("Subtle ruler", (.08, .13, .145), 0, .6, .3)

root = bpy.data.objects.new("CHART - animate as one object", None)
scene.collection.objects.link(root)

def cube(name, location, dimensions, mat, bevel=.03, parent=root):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Soft manufactured edges", "BEVEL")
        mod.width, mod.segments = bevel, 3
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    if parent:
        obj.parent = parent
    return obj

font_path = Path("C:/Windows/Fonts/segoeui.ttf")
font = bpy.data.fonts.load(str(font_path)) if font_path.exists() else None
bold_path = Path("C:/Windows/Fonts/segoeuib.ttf")
bold_font = bpy.data.fonts.load(str(bold_path)) if bold_path.exists() else font
def text(name, value, x, y, size, mat=white, align="LEFT", z=.235):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body, curve.size = value, size
    curve.align_x = align
    curve.extrude, curve.bevel_depth = .003, .001
    if font:
        curve.font = bold_font if name.startswith("Score") else font
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    obj.location = (x, y, z)
    obj.parent = root
    obj.data.materials.append(mat)
    return obj

cube("Silver perimeter", (0, 0, -.12), (9.7, 8.25, .27), edge, .14)
cube("Graphite face", (0, 0, .015), (9.57, 8.12, .17), graphite, .13)
text("Small category", "CODE AGENT / BENCHMARK", -4.05, 3.35, .19, muted)
text("Chart title", "Terminal Bench 2.1", -4.05, 2.68, .55)
text("Source note", "DEEPSEEK MODEL CARD / REPORTED RESULTS", -4.05, -3.55, .15, muted)

baseline = -2.5
max_height = 4.5
for value in (0, 20, 40, 60, 80, 100):
    y = baseline + max_height * value / 100
    cube(f"Grid {value}", (.12, y, .125), (7.35, .012, .01), grid, 0)
    text(f"Tick {value}", str(value), -3.8, y-.07, .15, muted, "RIGHT", .14)

bars = []
for i, (x, value, label, mat) in enumerate(((-1.85, 61.8, "PREVIEW", old), (1.5, 82.7, "FLASH 0731", cyan))):
    height = max_height * value / 100
    bar = cube(f"{label} / {value}", (x, baseline+height/2, .29), (1.58, height, .30), mat, .075)
    for frame, ratio in ((1, .003), (18+i*15, .003), (62+i*20, 1), (210, 1)):
        bar.scale.y = ratio
        bar.location.y = baseline + height * ratio / 2
        bar.keyframe_insert("scale", frame=frame)
        bar.keyframe_insert("location", frame=frame)
    score = text(f"Score {value}", f"{value:.1f}", x, baseline+height+.32, .76, white if not i else glow, "CENTER", .35)
    for frame, ratio in ((1, .001), (40+i*20, .001), (65+i*20, 1), (210, 1)):
        score.scale = (ratio, ratio, ratio)
        score.keyframe_insert("scale", frame=frame)
    text(f"Label {label}", label, x, -3.0, .24, white if not i else glow, "CENTER")
    bars.append(bar)

# The highlight line grows under the new score after the camera starts its push.
underline = cube("Drawn focus underline", (1.5, 1.405, .32), (1.85, .035, .025), glow, .012)
for frame, amount in ((1, .001), (110, .001), (136, 1), (210, 1)):
    underline.scale.x = amount
    underline.keyframe_insert("scale", frame=frame)

delta = text("Delta badge", "+20.9", 3.05, -.15, .38, glow, "CENTER")
delta_note = text("Delta unit", "POINTS", 3.05, -.44, .13, muted, "CENTER")
for obj in (delta, delta_note):
    for frame, amount in ((1, .001), (132, .001), (154, 1), (210, 1)):
        obj.scale = (amount, amount, amount)
        obj.keyframe_insert("scale", frame=frame)

# A lit physical background receives the soft shadow of the floating panel.
backdrop = material("Studio backdrop", (.009, .016, .020), .25, .47)
background_grid = material("Quiet background grid", (.024, .04, .046), 0, .8, .1)
cube("Backdrop", (0, 0, -1), (200, 200, .1), backdrop, 0, None)
for x in range(-12, 13):
    cube(f"Backdrop grid vertical {x}", (x, 0, -.9), (.008, 30, .005), background_grid, 0, None)
for y in range(-10, 11):
    cube(f"Backdrop grid horizontal {y}", (0, y, -.9), (30, .008, .005), background_grid, 0, None)

def area(name, location, power, color, size, target):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.color, data.shape, data.size = power, color, "DISK", size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat("-Z", "Y").to_euler()
    return obj

area("Softbox - white top left", (-5, 6, 8), 850, (.80, .90, 1), 8, (0, 0, 0))
area("Teal edge light", (6, 1, 4), 800, (.12, 1, .78), 5, (1, 0, 0))
area("Warm fill", (-4, -3, 5), 280, (1, .76, .59), 6, (0, 0, 0))
sweep = area("Moving soft reflection", (-6, 5, 4), 400, (.5, .82, 1), 3, (0, 0, 0))
for frame, x in ((1, -6), (100, 6), (210, 7)):
    sweep.location.x = x
    sweep.keyframe_insert("location", frame=frame)

bpy.ops.object.camera_add()
camera = bpy.context.object
camera.name = "Camera - perspective entry then evidence push"
scene.camera = camera
camera.data.lens = 48
camera.data.dof.use_dof = True
camera.data.dof.aperture_fstop = 8
focus = bpy.data.objects.new("Focus on score", None)
scene.collection.objects.link(focus)
focus.parent = root
focus.location = (1.5, 1.4, .3)
camera.data.dof.focus_object = focus
for frame, loc, target in (
    (1, (7.2, -5.5, 18.8), (0, 0, 0)),
    (54, (4.0, -3.3, 17.4), (0, 0, 0)),
    (90, (3.2, -2.3, 16.4), (0, .1, 0)),
    (155, (1.5, .35, 13.0), (.40, .40, 0)),
    (180, (1.5, .35, 13.0), (.40, .40, 0)),
    (210, (1.5, .35, 13.0), (.40, .40, 0)),
):
    camera.location = loc
    # The chart lies in XY. Keep its +Y vertical on screen; default tracking
    # treats world Z as up and rolls the chart sideways near a frontal view.
    direction = (Vector(target)-camera.location).normalized()
    right = direction.cross(Vector((0, 1, 0))).normalized()
    up = right.cross(direction).normalized()
    camera.rotation_euler = Matrix((right, up, -direction)).transposed().to_euler()
    camera.keyframe_insert("location", frame=frame)
    camera.keyframe_insert("rotation_euler", frame=frame)
for frame, loc, rot in ((1, (-.3, -.3, -1), (0, 0, -.09)), (55, (0, 0, 0), (0, 0, .015)), (100, (0, 0, 0), (0, 0, 0)), (210, (0, 0, 0), (0, 0, 0))):
    root.location, root.rotation_euler = loc, rot
    root.keyframe_insert("location", frame=frame)
    root.keyframe_insert("rotation_euler", frame=frame)

for action in bpy.data.actions:
    for fc in action.fcurves:
        for key in fc.keyframe_points:
            key.interpolation = "BEZIER"
            key.handle_left_type = key.handle_right_type = "AUTO_CLAMPED"

scene.use_nodes = True
nodes = scene.node_tree.nodes
nodes.clear()
layers = nodes.new("CompositorNodeRLayers")
glare = nodes.new("CompositorNodeGlare")
glare.glare_type, glare.quality, glare.threshold = "FOG_GLOW", "HIGH", 1.8
glare.size, glare.mix = 8, -.88
composite = nodes.new("CompositorNodeComposite")
scene.node_tree.links.new(layers.outputs["Image"], glare.inputs["Image"])
scene.node_tree.links.new(glare.outputs["Image"], composite.inputs["Image"])

# Original restrained sound design; deterministic, no downloaded audio.
sr = 48000
signal = np.zeros(sr*7, dtype=np.float64)
rng = np.random.default_rng(73)
for start, length, gain in ((.12, 1.35, .11), (3.1, 1.0, .085)):
    n = int(length*sr)
    t = np.arange(n)/sr
    noise = np.convolve(rng.normal(0, 1, n), np.ones(23)/23, mode="same")
    envelope = np.sin(np.pi*t/length)**2
    sound = noise*envelope*gain + np.sin(2*np.pi*(90*t-20*t*t))*envelope*.018
    pos = int(start*sr)
    signal[pos:pos+n] += sound
for start, frequency in ((2.7, 220), (4.65, 540)):
    t = np.arange(int(.6*sr))/sr
    sound = (np.sin(2*np.pi*frequency*t)+.3*np.sin(2*np.pi*frequency*2*t))*np.exp(-t*10)*.045
    sound *= np.minimum(t/.008, 1)
    pos = int(start*sr)
    signal[pos:pos+len(sound)] += sound
with wave.open(str(ASSETS / "benchmark-sfx.wav"), "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(sr)
    wav.writeframes((np.clip(signal, -1, 1)*32767).astype("<i2").tobytes())

scene.frame_set(165)
scene.render.filepath = str(FRAMES / "shot-")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "benchmark-shot.blend"))
if args.stills:
    for frame in (35, 90, 165):
        scene.frame_set(frame)
        scene.render.filepath = str(OUT / f"check-{frame:03}.png")
        bpy.ops.render.render(write_still=True)
if args.render:
    scene.render.filepath = str(FRAMES / "shot-")
    bpy.ops.render.render(animation=True)
