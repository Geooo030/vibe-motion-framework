"""Original procedural SFX plus local-only reference BGM mix. No copied game SFX."""
import json, math, wave, hashlib
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
EP = ROOT / "episodes/ai-video-game-editing"
OUT = ROOT / "out/ai-video-game-editing"
SR = 22050
plan = json.loads((EP/"shots.json").read_text(encoding="utf-8"))
N = round(plan["targetDurationFrames"]/plan["fps"]*SR)
audio = EP/"assets/audio"
audio.mkdir(parents=True,exist_ok=True)
rng = np.random.default_rng(304)

def write(path, samples):
    with wave.open(str(path),"wb") as f:
        f.setparams((1,2,SR,0,"NONE","not compressed"))
        f.writeframes((np.clip(samples,-.97,.97)*32767).astype("<i2").tobytes())

def tone(start,end,duration,noise=0):
    t=np.arange(round(duration*SR))/SR
    phase=2*np.pi*(start*t+(end-start)*t*t/(2*duration))
    env=np.minimum(1,t/.006)*np.minimum(1,(duration-t)/.02)*np.exp(-t/(duration*.7))
    return (.22*np.sign(np.sin(phase))+.08*np.sin(phase/2)+noise*rng.normal(0,1,len(t)))*env

def notes(freqs,d=.065):
    return np.concatenate([tone(f,f,d) for f in freqs])

fx={
    "key":tone(1300,650,.035,.08), "cloth":tone(90,50,.18,.055),
    "bubble":tone(230,770,.12), "wake":tone(180,820,.27),
    "jump":tone(260,930,.17), "land":tone(180,75,.09,.07),
    "select":tone(1450,1000,.055), "portal":tone(140,2100,.42,.04),
    "branch":notes([520,780]), "snap":tone(950,500,.065),
    "paper":tone(200,160,.16,.14), "goal":notes([330,495,660],.09),
    "pickup":notes([880,1320],.065), "cut":tone(1900,800,.045,.12),
    "error":notes([210,190],.13), "break":tone(260,80,.17,.25),
    "success":notes([523,659,784,1047],.085), "done":notes([660,990],.11),
    "knock":tone(240,100,.075,.025)
}
for name,y in fx.items(): write(audio/(name+".wav"),y)
patterns=[
    [(0,"key"),(1,"key"),(8,"cloth")],
    [(0,"bubble"),(2,"bubble"),(4,"bubble"),(10,"wake")],
    [(1,"jump"),(4,"land"),(8,"select")],
    [(0,"select"),(4,"bubble"),(9,"portal")],
    [(0,"key"),(1,"key"),(2,"key"),(3,"key"),(4,"key"),(7,"branch")],
    [(0,"portal"),(4,"snap"),(6,"snap"),(8,"snap"),(10,"snap")],
    [(0,"select"),(3,"snap"),(6,"branch"),(9,"branch"),(12,"goal")],
    [(0,"paper"),(4,"snap"),(8,"snap"),(12,"snap")],
    [(0,"goal"),(5,"select"),(9,"land"),(14,"key")],
    [(0,"jump"),(3,"pickup"),(6,"jump"),(9,"pickup"),(12,"jump"),(15,"pickup"),(18,"snap")],
    [(2,"cut"),(5,"snap"),(8,"cut"),(11,"snap"),(14,"jump"),(17,"land")],
    [(0,"error"),(6,"cut"),(10,"jump"),(13,"break"),(17,"done")],
    [(0,"jump"),(4,"land"),(7,"success")],
    [(0,"key"),(2,"key"),(4,"key"),(8,"done")],
    [(0,"portal"),(8,"knock"),(10,"knock")],
    [(1,"done"),(9,"cloth")]
]
mix=np.zeros(N); events=[]
for shot,pattern in zip(plan["shots"],patterns):
    for beat,name in pattern:
        at=shot["startFrame"]/30+beat*.3
        pos=round(at*SR); y=fx[name]
        end=min(N,pos+len(y))
        mix[pos:end]+=y[:end-pos]*.65
        events.append({"shotId":shot["id"],"beatOffset":beat,"frame":round(at*30),"seconds":round(at,4),"asset":"assets/audio/"+name+".wav","gain":.65})
# Subtle original room texture at opening and return only.
room=rng.normal(0,.0015,N)
mask=np.zeros(N);mask[:round(12.8*SR)]=1;mask[round(69.6*SR):]=1
mix+=room*mask
write(audio/"sfx-timeline-v1.wav",mix)
with wave.open(str(OUT/"music/analysis.wav")) as f:
    source=np.frombuffer(f.readframes(f.getnframes()),dtype="<i2").astype(float)/32768
start=round(plan["music"]["sourceTrimSeconds"]*SR)
bgm=source[start:start+N]
assert len(bgm)==N
gain=np.full(N,.34);gain[:round(9.6*SR)]=.19
for shot in plan["shots"]:
    if shot["subtitleMode"]=="dialogue":
        a,b=round(shot["startFrame"]/30*SR),round(shot["endFrame"]/30*SR)
        gain[a:b]=.13
fade=round(.4*SR);gain[-fade:]*=np.linspace(1,0,fade)
write(OUT/"music/bgm-edit-local-only.wav",bgm*gain)
write(OUT/"music/animatic-mix-no-voice.wav",bgm*gain+mix)
report={"status":"SFX-generated; reference-mix-local-only; dialogue-NOT-generated","sampleRate":SR,"durationSeconds":N/SR,"events":events,"musicDucking":"Dialogue shots -8.35 dB relative to normal BGM; no actual voice yet.","rights":"SFX synthesized from deterministic oscillators/noise; not Nintendo game effects. BGM publication license unverified.","sourceFiles":{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in audio.glob("*.wav")}}
(EP/"audio/cues.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps({"sfxFiles":len(fx),"events":len(events),"durationSeconds":N/SR,"mix":str(OUT/"music/animatic-mix-no-voice.wav")},ensure_ascii=False))
