"""Assemble actual Blender frames with local reference mix; no Remotion."""
import json, hashlib, subprocess, os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
EP=ROOT/"episodes/ai-video-game-editing"
OUT=ROOT/"out/ai-video-game-editing/blender"
plan=json.loads((EP/"shots.json").read_text(encoding="utf-8"))
receipt=json.loads((EP/"render/blender-all-receipt.json").read_text(encoding="utf-8"))
step=receipt["frameStep"];fps=plan["fps"]
lines=["ffconcat version 1.0"];count=0
sequence=OUT/"sequence-v1";sequence.mkdir(exist_ok=True)
for s in plan["shots"]:
    n=s["endFrame"]-s["startFrame"]
    for frame in range(1,n+1,step):
        p=OUT/"frames"/s["id"]/("frame-%04d.png"%frame)
        if not p.exists():raise FileNotFoundError(p)
        lines.extend(["file '"+p.as_posix()+"'","duration %.9f"%(min(step,n-frame+1)/fps)])
        last=p;count+=1
        dest=sequence/("frame-%05d.png"%count)
        if not dest.exists():os.link(p,dest)
        elif hashlib.sha256(dest.read_bytes()).digest()!=hashlib.sha256(p.read_bytes()).digest():
            raise RuntimeError("Stale linked frame; use a new sequence directory: "+str(dest))
lines.append("file '"+last.as_posix()+"'")
manifest=OUT/"frames.ffconcat";manifest.write_text("\n".join(lines)+"\n",encoding="utf-8")
ff=ROOT/"node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe"
output=OUT/"animatic-v1.mp4"
mix=ROOT/"out/ai-video-game-editing/music/animatic-mix-no-voice.wav"
subprocess.run([str(ff),"-hide_banner","-y","-framerate",str(fps/step),"-start_number","1","-i",str(sequence/"frame-%05d.png"),"-i",str(mix),"-r","30","-pix_fmt","yuv420p","-t",str(plan["targetDurationFrames"]/fps),"-c:v","libx264","-preset","fast","-crf","20","-c:a","aac","-b:a","192k","-movflags","+faststart",str(output)],check=True)
report={"status":"animated-blocking-not-final","path":str(output.relative_to(ROOT)),"sha256":hashlib.sha256(output.read_bytes()).hexdigest(),"durationSeconds":plan["targetDurationFrames"]/fps,"fps":fps,"sourceFrameCount":count,"actionSampleRate":fps/step,"audio":"reference BGM plus original SFX; NO dialogue voice","rights":"Local review only; music publishing authorization not verified"}
(EP/"render/animatic-receipt.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
print(json.dumps(report))
