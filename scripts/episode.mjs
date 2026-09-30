import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
export const hash = value => crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value??null)).digest('hex');
const save = (file, value) => {fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, JSON.stringify(value,null,2)+'\n');};
export function safe(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error(`Relative path required: ${relative}`);
  const dest = path.resolve(root, relative);
  if (!dest.startsWith(path.resolve(root)+path.sep)) throw new Error(`Path escapes project: ${relative}`);
  // Refuse symlinks/junctions, including in a future output's existing parent.
  let check=dest;
  while (check !== path.resolve(root)) {
    if (fs.existsSync(check) && fs.lstatSync(check).isSymbolicLink()) throw new Error(`Symlink path rejected: ${relative}`);
    check=path.dirname(check);
  }
  return dest;
}
const fileHash = file => {
  if (!fs.existsSync(file)) throw new Error(`Missing dependency: ${file}`);
  const bytes=fs.readFileSync(file);
  return hash(/\.(json|md|tsx?|m?js|css|ps1|py|srt)$/.test(file) ? bytes.toString('utf8').replace(/\r\n/g,'\n') : bytes);
};
export function parseScript(source) {
  const parts=source.replace(/\r\n/g,'\n').split(/^## (s\d+)\s*$/m);
  const result={};
  for(let i=1;i<parts.length;i+=2) {
    if(result[parts[i]] !== undefined) throw new Error(`Duplicate script ID: ${parts[i]}`);
    result[parts[i]]=parts[i+1].trim().replace(/\s*\n\s*/g,'');
    if(!result[parts[i]]) throw new Error(`Empty script: ${parts[i]}`);
  }
  return result;
}
export function capture(root, id) {
  if(!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('Invalid episode ID');
  const dir=safe(root,`episodes/${id}`), config=json(path.join(dir,'episode.json'));
  const timeline=json(path.join(dir,'shots.json')), assets=json(path.join(dir,'assets.json'));
  const dialogue=parseScript(fs.readFileSync(path.join(dir,'script.md'),'utf8'));
  if(config.id!==id || config.fps!==timeline.fps || timeline.endExclusive!==true) throw new Error('Episode/FPS/end-exclusive mismatch');
  if(!Number.isInteger(timeline.fps) || timeline.fps<=0 || !timeline.shots.length) throw new Error('Invalid FPS or empty timeline');
  const assetMap=new Map(assets.map(a=>[a.id,a]));
  if(assetMap.size!==assets.length) throw new Error('Duplicate asset IDs');
  const board=json(safe(dir,config.storyboard.snapshot));
  if(board.id!==config.storyboard.projectId) throw new Error('Wrong storyboard project ID');
  const boardMap=new Map(board.shots.map(s=>[s.id,s]));
  if(boardMap.size!==board.shots.length) throw new Error('Duplicate storyboard shot IDs');
  let end=0; const ids=new Set(), boardIds=new Set(), shots={};
  for(const shot of timeline.shots) {
    if(ids.has(shot.id) || !dialogue[shot.id]) throw new Error(`Missing/duplicate script-shot: ${shot.id}`);
    if(!Number.isInteger(shot.from)||!Number.isInteger(shot.to)||shot.from!==end||shot.to<=shot.from) throw new Error(`Gap/overlap/invalid frame range: ${shot.id}`);
    if(Math.abs((shot.to-shot.from)/timeline.fps-shot.durationSec)>.002) throw new Error(`Duration mismatch: ${shot.id}`);
    if(boardIds.has(shot.storyboardShotId)||!boardMap.has(shot.storyboardShotId)) throw new Error(`Missing/duplicate board mapping: ${shot.id}`);
    ids.add(shot.id); boardIds.add(shot.storyboardShotId); end=shot.to;
    const dependencies={};
    for(const name of [...config.sharedCode,...(shot.code??[])]) dependencies[name]=fileHash(safe(root,name));
    for(const assetId of [...config.sharedAssets,...(shot.assets??[])]) {
      const asset=assetMap.get(assetId);
      if(!asset) throw new Error(`Unknown asset ${assetId} in ${shot.id}`);
      dependencies[`asset:${assetId}`]=hash({metadata:asset,content:fileHash(safe(root,asset.path))});
    }
    const b=boardMap.get(shot.storyboardShotId);
    shots[shot.id]={dialogue:dialogue[shot.id],timing:[shot.from,shot.to],visual:shot.visual,handoff:shot.handoff,scene:shot.scene,shot,dependencies,board:{dialogue:b.dialogue,visual:b.visualPrompt,duration:b.duration,notes:b.notes,mediaUrl:b.mediaUrl,generator:b.generator,mediaType:b.mediaType,rollType:b.rollType}};
  }
  if(end!==timeline.targetDurationFrames || ids.size!==Object.keys(dialogue).length || boardIds.size!==boardMap.size) throw new Error('Script/timeline/board shot count or duration mismatch');
  const review={};
  for(const name of config.reviewFiles??[]) review[name]=fileHash(safe(dir,name));
  const assetDigest=assetId=>{const a=assetMap.get(assetId);if(!a)throw new Error(`Missing audio asset ${assetId}`);return fileHash(safe(root,a.path));};
  const audio={scriptHash:hash(dialogue),timingHash:hash(timeline.shots.map(s=>[s.id,s.from,s.to,s.captionCueIds])),narrationHash:assetDigest(config.audio.narration),captionsHash:assetDigest(config.audio.captions)};
  return {schemaVersion:1,id,config,timeline,shots,review,audio,boardMetadata:hash({title:board.title,aspectRatio:board.aspectRatio,scriptDraft:board.scriptDraft,audio:board.audio,covers:board.covers,hasDesign:board.hasDesign}),assets};
}
export function compare(current, baseline) {
  const impacted={}; const mark=(id,reason)=>{(impacted[id]??=[]).push(reason);};
  if(!baseline) for(const id of Object.keys(current.shots)) mark(id,'没有输入基线，需要全片检查');
  else {
    const ids=Object.keys(current.shots);
    for(const [index,id] of ids.entries()) {
      const now=current.shots[id], old=baseline.shots[id];
      if(!old){mark(id,'新增镜头');continue;}
      if(now.dialogue!==old.dialogue) {
        mark(id,'旁白修改：重配音、字幕、画面文案复核');
        // Existing narration crosses visual boundaries; include the previous shot.
        for(const next of ids.slice(Math.max(0,index-1))) mark(next,`从 ${id} 起重新对齐音频/时间轴（含前镜跨界）`);
      }
      for(const key of ['timing','visual','handoff','scene','shot','dependencies','board'])
        if(hash(now[key])!==hash(old[key])) mark(id,`${key} 已变化`);
      if(hash(now.timing)!==hash(old.timing)) for(const next of ids.slice(index)) mark(next,'时间轴变化：检查后续镜头和配音');
    }
    for(const id of Object.keys(baseline.shots)) if(!current.shots[id]) mark(id,'已删除镜头：重合成');
    if(hash(current.review)!==hash(baseline.review)) for(const id of ids) mark(id,'事实/署名/视觉方向文档变化：编辑复核');
    if(hash(current.config)!==hash(baseline.config)||current.boardMetadata!==baseline.boardMetadata) for(const id of ids) mark(id,'项目配置或工作台全局信息变化');
  }
  return impacted;
}
export function audioReady(current, receipt) {return !!receipt && hash(receipt.inputs)===hash(current.audio);}
export function validateCaptions(root,state) {
  const asset=state.assets.find(a=>a.id===state.config.audio.captions);
  const source=fs.readFileSync(safe(root,asset.path),'utf8').replace(/\r\n/g,'\n').trim();
  const clock=s=>{const m=/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/.exec(s);if(!m)throw new Error('Invalid SRT timestamp');return +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000;};
  const cues=new Map();let last=0;
  for(const block of source.split(/\n\s*\n/)) {
    const [id,time,...lines]=block.split('\n'), times=time?.split(' --> ');
    if(!times||times.length!==2||!/^\d+$/.test(id)||!lines.length)throw new Error('Invalid SRT block');
    const start=clock(times[0]),end=clock(times[1]);
    if(cues.has(+id)||start<last||end<=start||end>state.timeline.targetDurationFrames/state.timeline.fps)throw new Error(`Overlapping/invalid/out-of-range caption ${id}`);
    last=end;cues.set(+id,{start,end,text:lines.join('')});
  }
  const normalize=s=>s.replace(/[\s\p{P}\p{S}]/gu,'');
  const used=new Set(), crossing=[];
  for(const shot of state.timeline.shots) {
    const assigned=(shot.captionCueIds??[]).map(id=>{
      if(used.has(id)||!cues.has(id))throw new Error(`Missing/duplicate caption binding: ${shot.id}/${id}`);
      used.add(id);return cues.get(id);
    });
    if(normalize(assigned.map(c=>c.text).join(''))!==normalize(state.shots[shot.id].dialogue))throw new Error(`Script and SRT differ: ${shot.id}`);
    if(assigned.some(c=>c.start<shot.from/state.timeline.fps||c.end>shot.to/state.timeline.fps))crossing.push(shot.id);
  }
  if(used.size!==cues.size)throw new Error('Unassigned subtitle cues');
  return {cueCount:cues.size,crossingShots:crossing,note:'Cross-boundary speech preserved; not claimed frame-perfect'};
}
function report(root,id) {
  const state=capture(root,id), dir=safe(root,`episodes/${id}`);
  const baseFile=path.join(dir,'render/input-baseline.json'), audioFile=path.join(dir,'audio-review.json');
  const baseline=fs.existsSync(baseFile)?json(baseFile):null;
  const impacted=compare(state,baseline?.inputs);
  const boardDrift=Object.entries(state.shots).filter(([,s])=>s.dialogue!==s.board.dialogue || s.visual!==s.board.visual || Math.abs((s.timing[1]-s.timing[0])/state.timeline.fps-s.board.duration)>.001).map(([id])=>id);
  const ready=audioReady(state,fs.existsSync(audioFile)?json(audioFile):null);
  const result={episode:id,baselineKind:baseline?.kind??null,changedShots:Object.entries(impacted).map(([shotId,reasons])=>({id:shotId,seconds:state.shots[shotId]?.timing.map(f=>Number((f/state.timeline.fps).toFixed(3))),scene:state.shots[shotId]?.scene,code:[...state.config.sharedCode,...(state.shots[shotId]?.shot.code??[])],assets:state.shots[shotId]?.shot.assets,reasons:[...new Set(reasons)],renderCommand:state.shots[shotId]?`npm run episode:render -- ${id} --shot ${shotId}`:null})),audioReady:ready,boardDrift,boardSync:'仅与最近 MCP 快照比较，不是后台实时同步',warnings:['视觉提示是制作意图；修改它不会自动写出特效代码。','独立运行 npx remotion 会绕过本工具的配音一致性检查。']};
  save(safe(root,`out/${id}/change-report.json`),result); console.log(JSON.stringify(result,null,2));
  return {state,result,dir};
}
function prepare(root,id) {
  const {state,result}=report(root,id);
  if(!result.audioReady) throw new Error('配音/字幕/时间轴尚未复核；先更新素材，再运行 episode:accept-audio --note。禁止静默使用旧配音。');
  validateCaptions(root,state);
  const target=safe(root,`public/${id}`);
  fs.mkdirSync(target,{recursive:true});
  // Copy each registered file, never delete the destination tree. Unused files cannot enter a render via the manifest.
  const prefix=`episodes/${id}/assets/`;
  for(const asset of state.assets) if(asset.path.startsWith(prefix)) {
    const src=safe(root,asset.path), dest=safe(target,asset.path.slice(prefix.length));
    fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.copyFileSync(src,dest);
  }
  return state;
}
function option(args,name){const i=args.indexOf(name);return i<0?undefined:args[i+1];}
export function main(args,root=ROOT) {
  const [command='check',id='tomcat-01',...rest]=args;
  if(!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('Invalid episode ID');
  const dir=safe(root,`episodes/${id}`);
  if(command==='watch') {
    report(root,id);let timer;
    const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>{try{report(root,id);}catch(error){console.error(error.message);}},200);};
    fs.watch(dir,{recursive:true},refresh);
    for(const name of ['src','blender'])if(fs.existsSync(safe(root,name)))fs.watch(safe(root,name),{recursive:true},refresh);
    for(const name of ['package.json','package-lock.json','remotion.config.ts','tsconfig.json'])if(fs.existsSync(safe(root,name)))fs.watch(safe(root,name),refresh);
    console.log('Watching local episode/code only; Ctrl+C to stop. Remote Storyboard requires explicit MCP sync.');return 0;
  }
  if(command==='check'){const {result}=report(root,id); return result.changedShots.length||result.boardDrift.length||!result.audioReady?2:0;}
  if(command==='prepare'){prepare(root,id);return 0;}
  if(command==='baseline') {
    const file=path.join(dir,'render/input-baseline.json');
    if(fs.existsSync(file))throw new Error('Baseline already exists; only a completed full render may advance it');
    const note=option(rest,'--note'); if(!note)throw new Error('Baseline requires --note');
    save(file,{kind:'migration-input-reference-not-new-render',note,inputs:capture(root,id)});return 0;
  }
  if(command==='accept-audio') {
    const note=option(rest,'--note'); if(!note)throw new Error('Require --note describing actual voice/subtitle alignment review');
    const state=capture(root,id), subtitleCheck=validateCaptions(root,state);
    save(path.join(dir,'audio-review.json'),{reviewedAt:new Date().toISOString(),note,subtitleCheck,inputs:state.audio});return 0;
  }
  if(command==='board-import') {
    const file=option(rest,'--file');if(!file)throw new Error('Provide --file with MCP get_storyboard_project JSON export');
    const incoming=json(path.resolve(file)); const project=incoming.structuredContent?.project??incoming.project??incoming;
    const current=capture(root,id);if(project.id!==current.config.storyboard.projectId||!Array.isArray(project.shots))throw new Error('Wrong or invalid storyboard project');
    if(new Set(project.shots.map(s=>s.id)).size!==project.shots.length)throw new Error('Duplicate incoming storyboard IDs');
    const output=safe(dir,current.config.storyboard.snapshot);
    save(safe(root,`out/${id}/board-import-backup-${Date.now()}.json`),json(output));
    save(output,project);console.log('Imported snapshot only. Local script/timeline were NOT overwritten; reconcile change report.');
    report(root,id);return 0;
  }
  if(command==='board-export') {
    const state=capture(root,id);
    const shotUpdates=state.timeline.shots.map(s=>({shotId:s.storyboardShotId,dialogue:state.shots[s.id].dialogue,visualPrompt:s.visual,duration:(s.to-s.from)/state.timeline.fps}));
    save(safe(root,`out/${id}/storyboard-update.json`),{projectId:state.config.storyboard.projectId,shotUpdates});
    console.log(`out/${id}/storyboard-update.json — 用 MCP update_storyboard_project 写回后再 get/export 快照；本命令不联网。`);return 0;
  }
  if(command==='render') {
    const state=prepare(root,id), requested=option(rest,'--shot');
    const shot=requested?state.timeline.shots.find(s=>s.id===requested):null;
    if(requested&&!shot)throw new Error(`Unknown shot: ${requested}`);
    const stamp=new Date().toISOString().replace(/[:.]/g,'-');
    const relative=`out/${id}/renders/${stamp}/${requested??'full'}.mp4`, output=safe(root,relative);
    fs.mkdirSync(path.dirname(output),{recursive:true});
    const pkgFile=safe(root,'node_modules/@remotion/cli/package.json'), pkg=json(pkgFile);
    const bin=typeof pkg.bin==='string'?pkg.bin:pkg.bin.remotion;
    const run=spawnSync(process.execPath,[path.resolve(path.dirname(pkgFile),bin),'render',state.config.composition,output,'--codec=h264','--crf=18',...(shot?[`--frames=${shot.from}-${shot.to-1}`]:[])],{cwd:root,stdio:'inherit'});
    if(run.status!==0 || !fs.existsSync(output)||fs.statSync(output).size===0)throw new Error('Render failed; no receipt/baseline updated');
    if(hash(capture(root,id))!==hash(state))throw new Error('Inputs changed during render; output is not accepted as current');
    const receipt={kind:'rendered-not-human-qc',createdAt:new Date().toISOString(),shot:requested??null,output:relative,outputSha256:fileHash(output),inputs:state};
    save(path.join(dir,`render/receipts/${stamp}.json`),receipt);
    if(!shot)save(path.join(dir,'render/input-baseline.json'),receipt);
    console.log(`Rendered ${relative}. Audio normalization and visual/audio QC still required.`);return 0;
  }
  throw new Error(`Unknown command ${command}`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {process.exitCode=main(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=1;}
}
