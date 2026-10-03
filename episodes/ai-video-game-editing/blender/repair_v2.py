"""Reproducible targeted .blend repairs after base build, before final assembly."""
import bpy,json,hashlib,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'out/ai-video-game-editing/blender-v2'
def ease(t,a,b):
    q=max(0,min(1,(t-a)/(b-a)));return q*q*(3-2*q)
def lerp(a,b,q):return a+(b-a)*q
for sid in ['s040','s070']:
    bpy.ops.wm.open_mainfile(filepath=str(OUT/'scenes'/f'{sid}.blend'))
    sc=bpy.context.scene;end=sc.frame_end
    for f in sorted(set(range(1,end+1,3))|{end}):
        sc.frame_set(f);t=(f-1)/9
        if sid=='s070':
            library=bpy.data.objects['library cat'];library.scale=(max(.0001,ease(t,6.7,7.1)),)*3;library.keyframe_insert('scale',frame=f)
        for name,y in [('Claude flexible arm',-1.0),('Claude arm fill',-1.04)]:
            ob=bpy.data.objects[name]
            # Keep the arm behind the cat; hand stays in front of the held corner.
            for p in ob.data.splines[0].points:p.co.y=y;p.keyframe_insert('co',frame=f)
    sc.frame_set(round(end*.62));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scenes'/f'{sid}.blend'))
    sc.render.filepath=str(OUT/'previews'/f'{sid}.png');bpy.ops.render.render(write_still=True)
    sc.render.filepath=str(OUT/'frames'/sid/'frame-');bpy.ops.render.render(animation=True)
    rp=OUT/'receipts'/f'{sid}.json';r=json.loads(rp.read_text(encoding='utf-8'))
    r['sourceHashes'][str(Path(__file__).relative_to(ROOT))]=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    r['postprocess']='repair_v2.py: arm behind cat; library thumbnail hidden until held item released'
    rp.write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
    print('REPAIRED',sid,flush=True)
