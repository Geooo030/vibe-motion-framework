"""Keep the cat beside, not under, the Git command paper."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'out/ai-video-game-editing/blender-v2';sid='s050'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'scenes'/f'{sid}.blend'))
sc=bpy.context.scene;cat=bpy.data.objects['Tomcat unchanged pixel identity']
for f in sorted(set(range(1,sc.frame_end+1,3))|{sc.frame_end}):
    sc.frame_set(f);cat.location.x=6.8;cat.keyframe_insert('location',frame=f)
sc.frame_set(round(sc.frame_end*.62));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scenes'/f'{sid}.blend'))
sc.render.filepath=str(OUT/'previews'/f'{sid}.png');bpy.ops.render.render(write_still=True)
sc.render.filepath=str(OUT/'frames'/sid/'frame-');bpy.ops.render.render(animation=True)
path=OUT/'receipts'/f'{sid}.json';r=json.loads(path.read_text(encoding='utf-8'))
r['sourceHashes'][str(Path(__file__).relative_to(ROOT))]=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
r['postprocess']='repair_branch_v2.py: move cat beside command note to prevent head occlusion'
path.write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
