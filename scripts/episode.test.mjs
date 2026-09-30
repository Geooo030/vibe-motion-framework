import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOT,capture,compare,parseScript,audioReady,safe,hash,main,validateCaptions} from './episode.mjs';

const current=capture(ROOT,'tomcat-01');
test('all 8 storyboard IDs, scripts and contiguous frame ranges are mapped',()=>{
  assert.equal(Object.keys(current.shots).length,8);
  assert.equal(current.timeline.targetDurationFrames,2160);
  assert.deepEqual(compare(current,current),{});
});
test('duplicate/empty script blocks rejected',()=>{
  assert.throws(()=>parseScript('## s010\ntext\n## s010\nother'));
  assert.throws(()=>parseScript('## s010\n'));
});
test('existing 15 subtitle cues match full script, while boundary overlaps are disclosed',()=>{
  const result=validateCaptions(ROOT,current);
  assert.equal(result.cueCount,15);assert.ok(result.crossingShots.length>0);
  const changed=structuredClone(current);changed.shots.s030.dialogue+='不存在于字幕';
  assert.throws(()=>validateCaptions(ROOT,changed),/Script and SRT differ/);
});
test('one dialogue edit locates its shot, cross-boundary predecessor and downstream',()=>{
  const changed=structuredClone(current); changed.shots.s050.dialogue+='改一句';
  const result=compare(changed,current);
  assert.deepEqual(Object.keys(result).sort(),['s040','s050','s060','s070','s080']);
});
test('one photograph replacement only invalidates its dependent shot',()=>{
  const changed=structuredClone(current);changed.shots.s060.dependencies['asset:west-vacuum-chamber']='new';
  assert.deepEqual(Object.keys(compare(changed,current)),['s060']);
});
test('shared BGM invalidates every shot',()=>{
  const changed=structuredClone(current);for(const s of Object.values(changed.shots))s.dependencies['asset:bgm']='new';
  assert.equal(Object.keys(compare(changed,current)).length,8);
});
test('script/timing/audio replacement requires a fresh explicit alignment receipt',()=>{
  assert.equal(audioReady(current,{inputs:current.audio}),true);
  for(const key of ['scriptHash','timingHash','narrationHash','captionsHash']){
    const changed=structuredClone(current);changed.audio[key]='new';
    assert.equal(audioReady(changed,{inputs:current.audio}),false);
  }
  assert.equal(audioReady(current,null),false);
});
test('remote board edit is reported even with unchanged local script',()=>{
  const changed=structuredClone(current);changed.shots.s030.board.visual='new visual';
  assert.deepEqual(Object.keys(compare(changed,current)),['s030']);
});
test('metadata/credits changes conservatively request whole-film review',()=>{
  const changed=structuredClone(current);changed.review['credits.md']='new';
  assert.equal(Object.keys(compare(changed,current)).length,8);
});
test('path traversal, absolute path and malicious ID rejected',()=>{
  assert.throws(()=>safe(ROOT,'../outside'));
  assert.throws(()=>safe(ROOT,ROOT));
  assert.throws(()=>capture(ROOT,'../outside'));
});
test('filesystem mutation tests do not touch the working episode',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'episode-check-test-'));
  try {
    fs.mkdirSync(path.join(temp,'episodes'),{recursive:true});
    fs.cpSync(path.join(ROOT,'episodes/tomcat-01'),path.join(temp,'episodes/tomcat-01'),{recursive:true});
    for(const name of new Set(Object.values(current.shots).flatMap(s=>Object.keys(s.dependencies)).filter(n=>!n.startsWith('asset:')))){
      const dest=safe(temp,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(safe(ROOT,name),dest);
    }
    const before=capture(temp,'tomcat-01');assert.equal(hash(before),hash(current));
    main(['board-export','tomcat-01'],temp);
    const exported=JSON.parse(fs.readFileSync(path.join(temp,'out/tomcat-01/storyboard-update.json')));
    assert.equal(exported.shotUpdates.length,8);
    assert.equal(exported.shotUpdates[0].shotId,current.timeline.shots[0].storyboardShotId);
    assert.equal(exported.shotUpdates[0].id,undefined);
    const script=path.join(temp,'episodes/tomcat-01/script.md');fs.appendFileSync(script,'新增一句。');
    assert.notEqual(capture(temp,'tomcat-01').audio.scriptHash,before.audio.scriptHash);
    assert.throws(()=>main(['prepare','tomcat-01'],temp),/配音/);
    const timelineFile=path.join(temp,'episodes/tomcat-01/shots.json');
    const timeline=JSON.parse(fs.readFileSync(timelineFile));timeline.shots[1].from+=1;
    fs.writeFileSync(timelineFile,JSON.stringify(timeline));assert.throws(()=>capture(temp,'tomcat-01'),/Gap/);
  } finally {
    // Only the exact mkdtemp directory made by this test is disposable.
    if(!temp.startsWith(path.resolve(os.tmpdir())+path.sep+'episode-check-test-'))throw new Error('Unsafe test cleanup');
    fs.rmSync(temp,{recursive:true});
  }
});
