"""Read actual reference audio; estimate onset-grid candidates, not musical downbeats."""
import json, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
PATH = ROOT / "out/ai-video-game-editing/music/analysis.wav"
with wave.open(str(PATH)) as f:
    sr = f.getframerate()
    y = np.frombuffer(f.readframes(f.getnframes()), dtype="<i2").astype(float) / 32768
hop, size = 220, 1024
frames = np.lib.stride_tricks.sliding_window_view(y[:sr * 90], size)[::hop]
spec = np.abs(np.fft.rfft(frames * np.hanning(size), axis=1))
flux = np.maximum(0, np.diff(np.log1p(spec * 10), axis=0)).sum(axis=1)
flux = np.r_[0, flux]
times = (np.arange(len(flux)) * hop + size / 2) / sr
peaks = np.where((flux[1:-1] > flux[:-2]) & (flux[1:-1] >= flux[2:]) & (flux[1:-1] > np.percentile(flux, 65)))[0]+1
onsets = times[peaks]
scores = []
for bpm in np.arange(90, 220, .1):
    period = 60 / bpm
    # Eighth-note grid permits syncopation; offset phase is intentionally not a bar claim.
    phase = np.exp(2j*np.pi*onsets/(period/2))
    strength = abs(np.sum(flux[peaks]*phase))/np.sum(flux[peaks])
    scores.append((float(strength),float(bpm),float((np.angle(np.sum(flux[peaks]*phase))%(2*np.pi))/(2*np.pi)*(period/2))))
chosen = []
for score in sorted(scores, reverse=True):
    if all(abs(score[1]-x[1])>2 for x in chosen):
        chosen.append(score)
    if len(chosen)==8: break
result = {"source":str(PATH.relative_to(ROOT)),"sampleRate":sr,"durationSeconds":len(y)/sr,"method":"log spectral flux, eighth-note phase-coherence over first 90 seconds","candidates":[{"score":s,"bpm":b,"subdivisionPhaseSeconds":p} for s,b,p in chosen],"onsetsSeconds":onsets.tolist(),"warning":"Automated estimate. Phase is not a verified musical downbeat; choose/edit phrase boundaries after listening."}
dest = ROOT / "episodes/ai-video-game-editing/audio/music-analysis.json"
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(result,indent=2),encoding="utf-8")
print(json.dumps({k:v for k,v in result.items() if k!="onsetsSeconds"},indent=2))
