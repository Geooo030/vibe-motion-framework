import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {HotspotLogo} from '../components/HotspotLogo';
import {shots} from './episodeData';

const cyan='#71F5DF', lime='#D9F36B', ink='#071316', panel='#12272C', white='#F4FAF7', muted='#98B0AF';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const rise=(f:number,d=16)=>interpolate(f,[0,d],[28,0],{...clamp,easing:Easing.out(Easing.cubic)});
const show=(f:number,d=12)=>interpolate(f,[0,d],[0,1],clamp);

const Header:React.FC<{index:number;label:string}>=({index,label})=><>
  <div style={{position:'absolute',left:34,top:30,right:34,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
    <div style={{scale:.72,transformOrigin:'left center'}}><HotspotLogo inverse/></div><div style={{fontFamily:'Bahnschrift, sans-serif',fontSize:17,letterSpacing:2,color:cyan}}>01 / AI PROVENANCE</div>
  </div>
  <div style={{position:'absolute',left:38,top:116,fontSize:20,fontWeight:800,color:cyan,letterSpacing:2}}>{String(index+1).padStart(2,'0')} · {label}</div>
</>;

const Hook=()=>{const f=useCurrentFrame();return <><div style={{fontSize:92,fontWeight:950,lineHeight:.98,opacity:show(f),translate:`0 ${rise(f)}px`}}>AI 水印<br/><span style={{color:lime}}>一眼验真？</span></div><div style={{marginTop:44,height:8,background:'#274247'}}><div style={{height:'100%',width:`${show(f-18,28)*100}%`,background:cyan}}/></div><div style={{marginTop:35,fontSize:28,color:muted}}>先别急着相信那个绿色对勾。</div></>};
const Split=()=>{const f=useCurrentFrame();return <div style={{display:'flex',gap:18,width:'100%'}}>{[{t:'像素水印',s:'藏在画面里',c:cyan},{t:'内容凭证',s:'附在文件上',c:lime}].map((x,i)=><div key={x.t} style={{flex:1,border:`2px solid ${x.c}`,background:panel,padding:'34px 24px',height:340,opacity:show(f-i*12),translate:`0 ${rise(f-i*12)}px`}}><div style={{fontSize:24,color:x.c}}>0{i+1}</div><div style={{fontSize:43,fontWeight:900,marginTop:45}}>{x.t}</div><div style={{fontSize:25,color:muted,marginTop:22}}>{x.s}</div><div style={{fontSize:58,marginTop:34}}>{i?'📎':'▦'}</div></div>)}</div>};
const Chain=()=>{const f=useCurrentFrame();return <><div style={{fontSize:50,fontWeight:900,marginBottom:48}}>一条可验证的履历</div><div style={{display:'flex',alignItems:'center',gap:8}}>{['作者','编辑','签名'].map((x,i)=><div key={x} style={{display:'contents'}}><div style={{width:142,height:142,border:`2px solid ${i===2?lime:cyan}`,background:panel,display:'grid',placeItems:'center',fontSize:30,fontWeight:900,opacity:show(f-i*13),scale:interpolate(f-i*13,[0,15],[.8,1],clamp)}}>{x}</div>{i<2&&<div style={{height:4,width:43,background:cyan,scale:`${show(f-i*13-10)} 1`}}/>}</div>)}</div><div style={{fontFamily:'Bahnschrift',fontSize:22,color:muted,marginTop:42}}>C2PA · SIGNED MANIFEST</div></>};
const Truth=()=>{const f=useCurrentFrame();return <><div style={{fontSize:44,color:muted}}>它能证明</div><div style={{fontSize:65,fontWeight:950,color:cyan,marginTop:18}}>履历没被改</div><div style={{height:2,background:'#456064',margin:'44px 0'}}/><div style={{fontSize:44,color:muted}}>但不能单独证明</div><div style={{fontSize:64,fontWeight:950,color:lime,marginTop:18,opacity:show(f-18)}}>事情真发生过</div></>};
const Break=()=>{const f=useCurrentFrame();return <><div style={{display:'flex',alignItems:'center',gap:16}}>{['原文件','平台转码','截图'].map((x,i)=><div key={x} style={{display:'contents'}}><div style={{padding:'30px 16px',width:145,textAlign:'center',background:panel,border:`1px solid ${i===2?'#F27B7B':'#45676A'}`,fontSize:25,opacity:show(f-i*12)}}>{x}</div>{i<2&&<span style={{fontSize:36,color:i===1?'#F27B7B':cyan}}>→</span>}</div>)}</div><div style={{fontSize:57,fontWeight:950,marginTop:70}}>没有凭证 <span style={{color:'#F27B7B'}}>≠</span> 一定是假</div></>};
const Checklist=()=>{const f=useCurrentFrame();return <>{['看凭证链','做反向搜索','核对首发与上下文'].map((x,i)=><div key={x} style={{display:'flex',alignItems:'center',height:112,borderBottom:'1px solid #355256',opacity:show(f-i*12),translate:`${rise(f-i*12)}px 0`}}><div style={{width:54,height:54,border:`2px solid ${i===2?lime:cyan}`,display:'grid',placeItems:'center',fontFamily:'Bahnschrift',fontSize:23,color:i===2?lime:cyan}}>0{i+1}</div><div style={{fontSize:37,fontWeight:850,marginLeft:25}}>{x}</div></div>)}</>};
const End=()=>{const f=useCurrentFrame();return <><div style={{fontSize:73,fontWeight:950,lineHeight:1.18,opacity:show(f),translate:`0 ${rise(f)}px`}}>别迷信<br/><span style={{color:cyan}}>一个水印</span></div><div style={{fontSize:49,fontWeight:900,color:lime,marginTop:45,opacity:show(f-16)}}>要追一条证据链</div><div style={{marginTop:62,fontSize:19,color:muted}}>HOTSPOT JUN · EPISODE 01</div></>};
const views={hook:Hook,split:Split,chain:Chain,truth:Truth,break:Break,checklist:Checklist,end:End};

const ShotView:React.FC<{shot:(typeof shots)[number];index:number}>=({shot,index})=>{const View=views[shot.kind];return <AbsoluteFill><Header index={index} label={shot.label}/><div style={{position:'absolute',left:42,right:42,top:205,bottom:218,display:'flex',flexDirection:'column',justifyContent:'center'}}><View/></div><div style={{position:'absolute',left:28,right:28,bottom:72,minHeight:118,borderTop:`3px solid ${cyan}`,background:'#081719',padding:'22px 22px',fontSize:32,lineHeight:1.3,fontWeight:850}}>{shot.caption}</div></AbsoluteFill>};

export const HotspotEpisode:React.FC=()=> <AbsoluteFill style={{background:ink,color:white,fontFamily:'Noto Sans SC, Microsoft YaHei, sans-serif'}}>
  <div style={{position:'absolute',inset:18,border:'1px solid #2A4549'}}/>
  <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(#17303455 1px,transparent 1px),linear-gradient(90deg,#17303455 1px,transparent 1px)',backgroundSize:'48px 48px',opacity:.28}}/>
  {shots.map((s,i)=><Sequence key={s.id} from={s.from} durationInFrames={s.to-s.from} name={`${s.id} ${s.label}`}><ShotView shot={s} index={i}/></Sequence>)}
  <Audio src={staticFile('episodes/01/narration.mp3')} volume={1}/>
  <Audio src={staticFile('episodes/01/bgm.wav')} loop volume={(f)=>interpolate(f,[0,30,1380,1470],[0,.11,.11,0],clamp)}/>
</AbsoluteFill>;

export const EpisodeCover:React.FC=()=> <AbsoluteFill style={{background:ink,color:white,fontFamily:'Noto Sans SC, Microsoft YaHei, sans-serif',padding:54}}><div style={{position:'absolute',inset:22,border:`2px solid ${cyan}`}}/><div style={{scale:.9,transformOrigin:'left center'}}><HotspotLogo inverse/></div><div style={{marginTop:170,fontSize:96,fontWeight:950,lineHeight:1.03}}>AI 水印<br/><span style={{color:lime}}>一眼验真？</span></div><div style={{marginTop:50,fontSize:31,color:muted}}>水印、内容凭证与证据链</div><div style={{position:'absolute',bottom:74,left:54,right:54,height:12,background:cyan}}/></AbsoluteFill>;
