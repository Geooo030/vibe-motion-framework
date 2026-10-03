"""Final composition QC fixes: readable cat and correct completed-screen state."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'out/ai-video-game-editing/blender-v2'
def ease(t,a,b):
    q=max(0,min(1,(t-a)/(b-a)));return q*q*(3-2*q)
for sid in ['s120','s140','s150','s160']:
    bpy.ops.wm.open_mainfile(filepath=str(OUT/'scenes'/f'{sid}.blend'));sc=bpy.context.scene;cat=bpy.data.objects['Tomcat unchanged pixel identity']
    if sid in ['s150','s160']:bpy.data.objects['Label 尚未开始…'].data.body='制作完成'
    for f in sorted(set(range(1,sc.frame_end+1,3))|{sc.frame_end}):
        sc.frame_set(f)
        if sid=='s140':cat.location.x=6.8;cat.keyframe_insert('location',frame=f)
        if sid=='s120':
            t=(f-1)/9;cat.location.x-=.95*(1-ease(t,11,16));cat.keyframe_insert('location',frame=f)
            for name,y in [('Claude flexible arm',-1.0),('Claude arm fill',-1.04)]:
                for p in bpy.data.objects[name].data.splines[0].points:p.co.y=y;p.keyframe_insert('co',frame=f)
    sc.frame_set(round(sc.frame_end*.62));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scenes'/f'{sid}.blend'))
    sc.render.filepath=str(OUT/'previews'/f'{sid}.png');bpy.ops.render.render(write_still=True)
    sc.render.filepath=str(OUT/'frames'/sid/'frame-');bpy.ops.render.render(animation=True)
    path=OUT/'receipts'/f'{sid}.json';r=json.loads(path.read_text(encoding='utf-8'))
    r['sourceHashes'][str(Path(__file__).relative_to(ROOT))]=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    r['postprocess']='repair_finish_v2.py: cat occlusion and completed-screen label corrections'
    path.write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
    print('FINAL_REPAIR_DONE',sid,flush=True)
