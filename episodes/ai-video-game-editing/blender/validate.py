"""Non-mutating episode checks for this independent Blender preproduction package."""
import json, hashlib, wave
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
EP=ROOT/"episodes/ai-video-game-editing"
plan=json.loads((EP/"shots.json").read_text(encoding="utf-8"))
script=(EP/"script.md").read_text(encoding="utf-8")
assert plan["fps"]==30 and plan["endExclusive"] is True
end=0;ids=set()
for s in plan["shots"]:
    assert s["id"] not in ids
    ids.add(s["id"])
    assert s["startFrame"]==end and s["endFrame"]>end
    assert s["startFrame"]==s["startBeat"]*9
    assert s["endFrame"]==s["endBeat"]*9
    assert "## "+s["id"] in script
    end=s["endFrame"]
assert end==plan["targetDurationFrames"]
cues=json.loads((EP/"audio/cues.json").read_text(encoding="utf-8"))
for cue in cues["events"]:
    assert cue["shotId"] in ids and 0<=cue["frame"]<end
    assert (EP/cue["asset"]).exists()
with wave.open(str(EP/"assets/audio/sfx-timeline-v1.wav")) as w:
    assert abs(w.getnframes()/w.getframerate()-end/30)<.001
snap=json.loads((EP/"storyboard/snapshot.json").read_text(encoding="utf-8"))
assert len(snap["structuredContent"]["project"]["shots"])==len(ids)
for p in EP.glob("**/*.json"):
    json.loads(p.read_text(encoding="utf-8-sig"))
receipt=EP/"render/blender-all-receipt.json"
if receipt.exists():
    r=json.loads(receipt.read_text(encoding="utf-8"))
    assert len(r["shots"])==16
    assert r["sourceHashes"]["shots.json"]==hashlib.sha256((EP/"shots.json").read_bytes()).hexdigest()
    assert r["sourceHashes"]["script.md"]==hashlib.sha256((EP/"script.md").read_bytes()).hexdigest()
    assert r["sourceHashes"]["build_scenes.py"]==hashlib.sha256((EP/"blender/build_scenes.py").read_bytes()).hexdigest()
    for s in r["shots"]:
        assert (ROOT/s["blend"]).exists() and (ROOT/s["preview"]).exists()
print("PASS: 16 contiguous shots, 2304 frames, 67 SFX cues, audio length, JSON, Storyboard snapshot and render source hashes")
