"""Versioned v2 audio score, per-shot encoding and verified whole-film assembly."""
import argparse,json,hashlib,subprocess,wave,math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[3];EP=ROOT/'episodes/ai-video-game-editing';OUT=ROOT/'out/ai-video-game-editing/blender-v2'
PLAN=json.loads((EP/'shots.json').read_text(encoding='utf-8'));FPS=PLAN['fps'];SR=22050;N=round(PLAN['targetDurationFrames']/FPS*SR)
FF=ROOT/'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
audio=EP/'assets/audio-v2';audio.mkdir(exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def wav(path,a):
    with wave.open(str(path),'wb') as w:w.setparams((1,2,SR,0,'NONE','not compressed'));w.writeframes((np.clip(a,-.96,.96)*32767).astype('<i2').tobytes())
def read(path):
    with wave.open(str(path)) as w:
        assert w.getframerate()==SR and w.getnchannels()==1
        return np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float64)/32768
def synth():
    rng=np.random.default_rng(621)
    for name,dur,level in [('pencil',.24,.11),('peel',.18,.13),('fold',.20,.13),('keycap',.055,.16)]:
        t=np.arange(round(dur*SR))/SR;noise=rng.normal(0,1,len(t));noise=np.convolve(noise,np.ones(5)/5,mode='same')
        env=np.sin(np.pi*t/dur)**1.4
        if name=='keycap':noise=.6*noise+.4*np.sin(2*np.pi*180*t)*np.exp(-t*70)
        wav(audio/(name+'.wav'),noise*env*level)
def build_audio():
    synth();mix=np.zeros(N);events=[]
    score={
      's010':[(1,'key'),(2,'key'),(7,'cloth')],
      's020':[(1,'bubble'),(4,'pencil'),(12,'peel')],
      's030':[(3,'jump'),(6,'land'),(9,'peel')],
      's040':[(1,'select'),(4,'bubble'),(12,'portal')],
      's050':[(1,'key'),(3,'key'),(5,'keycap'),(7,'branch'),(12,'pencil')],
      's060':[(2,'pencil'),(5,'fold'),(9,'snap'),(11,'snap')],
      's070':[(1,'peel'),(6,'snap'),(9.7,'snap'),(11.8,'snap'),(13.9,'snap')],
      's080':[(1,'paper'),(4,'pencil'),(6,'pencil'),(8,'pencil'),(10,'pencil')],
      's090':[(2,'peel'),(8,'land'),(11,'cloth'),(17,'key')],
      's100':[(4,'jump'),(6,'pickup'),(8,'jump'),(10,'pickup'),(12,'jump'),(14,'pickup'),(18,'snap')],
      's110':[(3,'land'),(8,'cut'),(12,'snap'),(15,'jump'),(18,'land')],
      's120':[(1,'error'),(8,'keycap'),(12,'snap'),(16,'break')],
      's130':[(1,'jump'),(4,'land'),(6,'success')],
      's140':[(3,'keycap'),(5,'fold'),(7,'snap'),(9,'peel')],
      's150':[(1,'paper'),(7,'peel'),(9,'knock'),(11,'knock')],
      's160':[(1,'done'),(9,'cloth')]}
    for s in PLAN['shots']:
        for beat,name in score[s['id']]:
            frame=s['startFrame']+round(beat*PLAN['music']['framesPerBeat']);assert s['startFrame']<=frame<s['endFrame']
            p=audio/(name+'.wav')
            if not p.exists():p=EP/'assets/audio'/(name+'.wav')
            y=read(p);at=round(frame/FPS*SR);end=min(N,at+len(y));gain=.58 if name in ['paper','pencil','peel','fold','keycap'] else .36
            mix[at:end]+=y[:end-at]*gain
            events.append({'shotId':s['id'],'beatOffset':beat,'frame':frame,'asset':str(p.relative_to(EP)),'sha256':sha(p),'gain':gain})
    wav(audio/'sfx-timeline-v2.wav',mix)
    source=read(ROOT/'out/ai-video-game-editing/music/analysis.wav');start=round(PLAN['music']['sourceTrimSeconds']*SR);bgm=source[start:start+N];assert len(bgm)==N
    gain=np.full(N,.28);gain[:round(9.6*SR)]=.16
    for s in PLAN['shots']:
        if s['dialogue']:gain[round(s['startFrame']/FPS*SR):round(s['endFrame']/FPS*SR)]=.12
    gain[-round(.4*SR):]*=np.linspace(1,0,round(.4*SR));out=bgm*gain+mix
    wav(OUT/'mix-v2-no-voice.wav',out)
    report={'planRevision':PLAN['planRevision'],'status':'v2 synthesized score; no dialogue voice; no human listening approval','events':events,'sampleRate':SR,'durationSeconds':N/SR,'peakDbfs':float(20*np.log10(max(1e-9,np.max(np.abs(out))))),'newSfx':['pencil','peel','fold','keycap'],'rights':'Original synthetic SFX; requested reference BGM local only, publication license unverified','dialogueVoice':False}
    (EP/'audio/cues-v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'audio':'ready','events':len(events),'peakDbfs':report['peakDbfs']}))
def assemble():
    clips=OUT/'clips';clips.mkdir(exist_ok=True);entries=[];receipts=[]
    for s in PLAN['shots']:
        r=json.loads((OUT/'receipts'/f"{s['id']}.json").read_text(encoding='utf-8'))
        assert r['animationRendered'] and r['frameStep']==1
        for rel,digest in r['sourceHashes'].items():assert sha(ROOT/rel)==digest, 'stale source '+rel
        n=s['endFrame']-s['startFrame'];frames=OUT/'frames'/s['id']
        for f in range(1,n+1):assert (frames/f'frame-{f:04d}.png').exists(),f'missing {s["id"]}/{f}'
        video=clips/f"{s['id']}.mp4"
        subprocess.run([str(FF),'-v','error','-y','-framerate',str(FPS),'-i',str(frames/'frame-%04d.png'),'-frames:v',str(n),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-an',str(video)],check=True)
        entries.append("file '"+video.as_posix()+"'");r['encodedClip']=str(video.relative_to(ROOT));r['encodedSha256']=sha(video);receipts.append(r)
    concat=OUT/'clips.ffconcat';concat.write_text('\n'.join(entries),encoding='utf-8')
    result=OUT/'tomcat-midnight-v2.mp4'
    subprocess.run([str(FF),'-v','error','-y','-f','concat','-safe','0','-i',str(concat),'-i',str(OUT/'mix-v2-no-voice.wav'),'-c:v','copy','-c:a','aac','-b:a','192k','-t',str(N/SR),'-movflags','+faststart',str(result)],check=True)
    # Bundled ffmpeg lacks the null muxer; ffprobe count_frames decodes all streams.
    probe=FF.with_name('ffprobe.exe')
    decoded=json.loads(subprocess.check_output([str(probe),'-v','error','-count_frames','-show_streams','-of','json',str(result)]))
    video_stream=next(s for s in decoded['streams'] if s['codec_type']=='video')
    audio_stream=next(s for s in decoded['streams'] if s['codec_type']=='audio')
    assert int(video_stream['nb_read_frames'])==PLAN['targetDurationFrames']
    assert int(audio_stream['nb_read_frames'])>0
    report={'status':'v2-animated-draft-not-final','path':str(result.relative_to(ROOT)),'sha256':sha(result),'durationSeconds':N/SR,'frameCount':PLAN['targetDurationFrames'],'fps':FPS,'width':1920,'height':1080,'audio':'Mario reference BGM + original v2 SFX; no dialogue voice','planRevision':PLAN['planRevision'],'shots':receipts,'checks':['all 2304 source frames exist','source hashes match actual inputs','full audio/video decode passed'],'limitations':['Whole-sprite cat, no separate limb/badge rig','No dialogue voice or lip sync','Secondary acting and some match cuts simplified','Human listening/QC and publishing rights pending']}
    report['assemblySourceHashes']={str(p.relative_to(ROOT)):sha(p) for p in [Path(__file__),EP/'audio/cues-v2.json',OUT/'mix-v2-no-voice.wav']}
    (EP/'render/animatic-v2-receipt.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(str(result))
ap=argparse.ArgumentParser();ap.add_argument('--audio-only',action='store_true');args=ap.parse_args()
if __name__=='__main__':
    build_audio()
    if not args.audio_only:assemble()
