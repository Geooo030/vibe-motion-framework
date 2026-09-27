"""Original 3-second scientific illustration: plasma close-up pulls out to a tokamak cutaway.

Run with Blender 4.5+: blender --background --factory-startup --python blender/tokamak-opener.py -- --stills|--render
Generated geometry is schematic and intentionally not a reconstruction of EAST or ITER.
"""
import argparse
from math import radians
from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out" / "tomcat-01" / "blender"
FRAMES = OUT / "frames"
PUBLIC = ROOT / "public" / "tomcat-01"
for p in (OUT, FRAMES, PUBLIC): p.mkdir(parents=True, exist_ok=True)

parser = argparse.ArgumentParser()
parser.add_argument("--stills", action="store_true")
parser.add_argument("--render", action="store_true")
args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.fps = 30
scene.frame_start, scene.frame_end = 1, 90
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.use_motion_blur = True
scene.render.motion_blur_shutter = .35
scene.view_settings.view_transform = "AgX"
scene.world = bpy.data.worlds.new("Deep graphite vacuum")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.002, .004, .01, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = .08

def mat(name, color, metallic=0, rough=.35, emission=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=(*color,1)
    b.inputs["Metallic"].default_value=metallic; b.inputs["Roughness"].default_value=rough
    b.inputs["Emission Color"].default_value=(*color,1); b.inputs["Emission Strength"].default_value=emission
    return m

plasma=mat("Plasma electric magenta",(.36,.015,1),.05,.18,8)
plasma_hot=mat("Plasma hot rim",(1,.05,.25),.05,.16,5)
coil=mat("Copper field coils",(.7,.12,.025),.75,.22,.18)
steel=mat("Vacuum vessel graphite steel",(.055,.085,.11),.9,.24)
edge=mat("Cutaway edge",(.22,.42,.53),.75,.18,.35)
cyan=mat("Field line cyan",(.01,.75,1),.1,.2,3)

root=bpy.data.objects.new("TOKAMAK SCHEMATIC - animate together",None); scene.collection.objects.link(root)

def torus(name, major, minor, material, rot=(radians(90),0,0), parent=root):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=96,minor_segments=24,location=(0,0,0),rotation=rot)
    o=bpy.context.object; o.name=name; o.data.materials.append(material); o.parent=parent
    for polygon in o.data.polygons: polygon.use_smooth=True
    return o

# Plasma core: nested torus gives a luminous volume-like body and a hotter rim.
core=torus("One hundred million degree plasma - schematic",2.25,.72,plasma)
rim=torus("Plasma edge turbulence rim",2.25,.78,plasma_hot)
rim.scale=(1,1,.82)

# Vacuum vessel is a larger dark shell, opened on the camera-facing side by using curved coil-like segments.
vessel=torus("Toroidal vacuum vessel",2.25,1.14,steel)
vessel.scale=(1,1,.88)
vessel.hide_render=True  # cutaway view: outer shell omitted so the plasma and field lines remain legible

# Twelve simplified copper coils around the torus; the front pair is omitted for a readable cutaway.
for i in range(12):
    angle=i*30
    if angle in (240,270,300): continue
    bpy.ops.mesh.primitive_torus_add(major_radius=3.35,minor_radius=.13,major_segments=64,minor_segments=12,rotation=(radians(90),0,radians(angle)))
    o=bpy.context.object; o.name=f"Toroidal field coil {i:02}"; o.scale=(1,.58,1); o.data.materials.append(coil); o.parent=root

# Field-line bands slightly above/below the core communicate confinement without claiming a perfect barrier.
for z,scale in ((-.22,.93),(0,1.02),(.22,1.10)):
    line=torus(f"Magnetic field line {z:+.2f}",2.25,.025,cyan)
    line.location.z=z; line.scale=(scale,scale,1)

# Divertor target: two tungsten-like blocks at the bottom of the cutaway.
for x in (-.42,.42):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-.15,-1.05),rotation=(0,radians(18 if x<0 else -18),0))
    o=bpy.context.object; o.name="Divertor target - schematic"; o.dimensions=(.52,1.55,.22); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(edge); o.parent=root

# Slow plasma rotation adds life while camera movement does the storytelling.
for f,angle in ((1,0),(90,radians(42))):
    core.rotation_euler.z=angle; rim.rotation_euler.z=-angle*.7
    core.keyframe_insert("rotation_euler",frame=f); rim.keyframe_insert("rotation_euler",frame=f)

def area(name,loc,energy,color,size,target=(0,0,0)):
    d=bpy.data.lights.new(name,"AREA"); d.energy=energy; d.color=color; d.shape="DISK"; d.size=size
    o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.location=loc
    o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler(); return o
area("Cold machine rim",(-5,4,7),950,(.12,.45,1),6)
area("Warm coil edge",(5,-3,5),760,(1,.18,.035),5)

bpy.ops.object.camera_add(); cam=bpy.context.object; scene.camera=cam
cam.data.lens=48; cam.data.dof.use_dof=True; cam.data.dof.aperture_fstop=5.6
focus=bpy.data.objects.new("Focus plasma",None); scene.collection.objects.link(focus); cam.data.dof.focus_object=focus
for f,loc,lens,target in (
    (1,(3.2,-4.8,1.3),62,(.8,0,0)),
    (22,(2.8,-4.4,1.1),54,(.8,0,0)),
    (58,(5.7,-8.4,3.6),48,(0,0,0)),
    (90,(6.6,-9.7,4.2),48,(0,0,0)),
):
    cam.location=loc; cam.data.lens=lens; cam.rotation_euler=(Vector(target)-cam.location).to_track_quat("-Z","Y").to_euler()
    cam.keyframe_insert("location",frame=f); cam.keyframe_insert("rotation_euler",frame=f); cam.data.keyframe_insert("lens",frame=f)

for action in bpy.data.actions:
    for fc in action.fcurves:
        for k in fc.keyframe_points: k.interpolation="BEZIER"; k.handle_left_type=k.handle_right_type="AUTO_CLAMPED"

scene.use_nodes=True; n=scene.node_tree.nodes; n.clear()
layers=n.new("CompositorNodeRLayers"); glare=n.new("CompositorNodeGlare"); glare.glare_type="FOG_GLOW"; glare.quality="HIGH"; glare.threshold=.7; glare.size=7; glare.mix=-.72
comp=n.new("CompositorNodeComposite"); scene.node_tree.links.new(layers.outputs["Image"],glare.inputs["Image"]); scene.node_tree.links.new(glare.outputs["Image"],comp.inputs["Image"])

scene.frame_set(58); scene.render.filepath=str(FRAMES/"tokamak-")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"tokamak-opener.blend"))
if args.stills:
    for f in (1,30,58,90): scene.frame_set(f); scene.render.filepath=str(OUT/f"check-{f:03}.png"); bpy.ops.render.render(write_still=True)
if args.render:
    scene.render.filepath=str(FRAMES/"tokamak-"); bpy.ops.render.render(animation=True)
