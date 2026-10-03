"""Read-only v2 delivery verification. Does not touch v1 receipts."""
import json,hashlib,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];EP=ROOT/'episodes/ai-video-game-editing'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
p=json.loads((EP/'shots.json').read_text(encoding='utf-8'))
r=json.loads((EP/'render/animatic-v2-receipt.json').read_text(encoding='utf-8'))
assert r['planRevision']==p['planRevision']
assert len(r['shots'])==len(p['shots'])==16
end=0
for s,receipt in zip(p['shots'],r['shots']):
    assert receipt['shotId']==s['id'] and s['startFrame']==end
    assert receipt['frames']==s['endFrame']-s['startFrame'] and receipt['frameStep']==1
    for rel,digest in receipt['sourceHashes'].items():assert sha(ROOT/rel)==digest,rel
    assert sha(ROOT/receipt['encodedClip'])==receipt['encodedSha256']
    end=s['endFrame']
assert end==2304 and sha(ROOT/r['path'])==r['sha256']
for rel,digest in r['assemblySourceHashes'].items():assert sha(ROOT/rel)==digest,rel
probe=ROOT/'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'
data=json.loads(subprocess.check_output([str(probe),'-v','error','-count_frames','-show_streams','-show_format','-of','json',str(ROOT/r['path'])]))
v=next(s for s in data['streams'] if s['codec_type']=='video');a=next(s for s in data['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'])==(1920,1080)
assert v['r_frame_rate']=='30/1' and int(v['nb_read_frames'])==2304
assert abs(float(data['format']['duration'])-76.8)<.1
cues=json.loads((EP/'audio/cues-v2.json').read_text(encoding='utf-8'))
for e in cues['events']:assert sha(EP/e['asset'])==e['sha256'] and 0<=e['frame']<2304
print(json.dumps({'status':'PASS technical checks only','frames':2304,'duration':data['format']['duration'],'resolution':'1920x1080','fps':30,'audioCodec':a['codec_name'],'events':len(cues['events']),'voice':False}))
