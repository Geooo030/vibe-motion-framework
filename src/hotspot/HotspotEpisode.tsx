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
    <div style={{scale:.72,transformOrigin:'left center'}}><HotspotLogo inverse/></div><div style={{fontFamily:'Bahnschrift, sans-serif',fontSize:17,letterSpacing:2,color:cyan}}>02 / PASSKEY</div>
  </div>
  <div style={{position:'absolute',left:38,top:116,fontSize:20,fontWeight:800,color:cyan,letterSpacing:2}}>{String(index+1).padStart(2,'0')} · {label}</div>
</>;

const Hook=()=>{const f=useCurrentFrame();return <><div style={{fontSize:82,fontWeight:950,lineHeight:1.05,opacity:show(f),translate:`0 ${rise(f)}px`}}>验证码<br/><span style={{color:lime}}>也会被钓走？</span></div><div style={{marginTop:44,height:8,background:'#274247'}}><div style={{height:'100%',width:`${show(f-18,28)*100}%`,background:cyan}}/></div><div style={{marginTop:35,fontSize:28,color:muted}}>假网站能实时转发你输入的一切。</div></>};
const Split=()=>{const f=useCurrentFrame();return <div style={{display:'flex',gap:18,width:'100%'}}>{[{t:'私钥',s:'留在你的设备',c:lime},{t:'公钥',s:'交给网站保存',c:cyan}].map((x,i)=><div key={x.t} style={{flex:1,border:`2px solid ${x.c}`,background:panel,padding:'34px 24px',height:340,opacity:show(f-i*12),translate:`0 ${rise(f-i*12)}px`}}><div style={{fontSize:24,color:x.c}}>0{i+1}</div><div style={{fontSize:58,fontWeight:900,marginTop:45}}>{x.t}</div><div style={{fontSize:25,color:muted,marginTop:22}}>{x.s}</div><div style={{fontSize:60,marginTop:28}}>{i?'◎':'◆'}</div></div>)}</div>};
const Chain=()=>{const f=useCurrentFrame();return <><div style={{fontSize:50,fontWeight:900,marginBottom:48}}>一次登录，三步握手</div><div style={{display:'flex',alignItems:'center',gap:8}}>{['挑战','签名','验证'].map((x,i)=><div key={x} style={{display:'contents'}}><div style={{width:142,height:142,border:`2px solid ${i===1?lime:cyan}`,background:panel,display:'grid',placeItems:'center',fontSize:30,fontWeight:900,opacity:show(f-i*13),scale:interpolate(f-i*13,[0,15],[.8,1],clamp)}}>{x}</div>{i<2&&<div style={{height:4,width:43,background:cyan,scale:`${show(f-i*13-10)} 1`}}/>}</div>)}</div><div style={{fontFamily:'Bahnschrift',fontSize:22,color:muted,marginTop:42}}>PRIVATE KEY NEVER LEAVES DEVICE</div></>};
const Truth=()=>{const f=useCurrentFrame();return <><div style={{fontSize:42,color:muted}}>凭据绑定</div><div style={{fontSize:66,fontWeight:950,color:cyan,marginTop:18}}>正确域名</div><div style={{height:2,background:'#456064',margin:'44px 0'}}/><div style={{fontSize:42,color:muted}}>界面再像也没用</div><div style={{fontSize:58,fontWeight:950,color:lime,marginTop:18,opacity:show(f-18)}}>假域名签不了</div></>};
const Break=()=>{const f=useCurrentFrame();return <><div style={{display:'flex',alignItems:'center',gap:16}}>{['指纹/人脸','本机解锁','签名'].map((x,i)=><div key={x} style={{display:'contents'}}><div style={{padding:'30px 10px',width:145,textAlign:'center',background:panel,border:`1px solid ${i===1?lime:'#45676A'}`,fontSize:24,opacity:show(f-i*12)}}>{x}</div>{i<2&&<span style={{fontSize:36,color:cyan}}>→</span>}</div>)}</div><div style={{fontSize:49,fontWeight:950,marginTop:70}}>生物信息 <span style={{color:lime}}>不上传</span></div></>};
const Checklist=()=>{const f=useCurrentFrame();return <>{['设备丢失','同步账号','恢复流程'].map((x,i)=><div key={x} style={{display:'flex',alignItems:'center',height:112,borderBottom:'1px solid #355256',opacity:show(f-i*12),translate:`${rise(f-i*12)}px 0`}}><div style={{width:54,height:54,border:`2px solid ${i===2?lime:cyan}`,display:'grid',placeItems:'center',fontFamily:'Bahnschrift',fontSize:23,color:i===2?lime:cyan}}>0{i+1}</div><div style={{fontSize:37,fontWeight:850,marginLeft:25}}>{x}</div></div>)}</>};
const End=()=>{const f=useCurrentFrame();return <><div style={{fontSize:70,fontWeight:950,lineHeight:1.18,opacity:show(f),translate:`0 ${rise(f)}px`}}>能开<br/><span style={{color:cyan}}>Passkey</span> 就先开</div><div style={{fontSize:43,fontWeight:900,color:lime,marginTop:45,opacity:show(f-16)}}>短信验证码只做后备</div><div style={{marginTop:62,fontSize:19,color:muted}}>HOTSPOT JUN · EPISODE 02</div></>};
const views={hook:Hook,split:Split,chain:Chain,truth:Truth,break:Break,checklist:Checklist,end:End};

const ShotView:React.FC<{shot:(typeof shots)[number];index:number}>=({shot,index})=>{const View=views[shot.kind];return <AbsoluteFill><Header index={index} label={shot.label}/><div style={{position:'absolute',left:42,right:42,top:205,bottom:218,display:'flex',flexDirection:'column',justifyContent:'center'}}><View/></div><div style={{position:'absolute',left:28,right:28,bottom:72,minHeight:118,borderTop:`3px solid ${cyan}`,background:'#081719',padding:'22px 22px',fontSize:32,lineHeight:1.3,fontWeight:850}}>{shot.caption}</div></AbsoluteFill>};

export const HotspotEpisode:React.FC=()=> <AbsoluteFill style={{background:ink,color:white,fontFamily:'Noto Sans SC, Microsoft YaHei, sans-serif'}}>
  <div style={{position:'absolute',inset:18,border:'1px solid #2A4549'}}/>
  <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(#17303455 1px,transparent 1px),linear-gradient(90deg,#17303455 1px,transparent 1px)',backgroundSize:'48px 48px',opacity:.28}}/>
  {shots.map((s,i)=><Sequence key={s.id} from={s.from} durationInFrames={s.to-s.from} name={`${s.id} ${s.label}`}><ShotView shot={s} index={i}/></Sequence>)}
  <Audio src={staticFile('episodes/02/narration.mp3')} volume={1}/>
  <Audio src={staticFile('episodes/02/bgm.wav')} loop volume={(f)=>interpolate(f,[0,30,1530,1620],[0,.1,.1,0],clamp)}/>
</AbsoluteFill>;

export const EpisodeCover:React.FC=()=> <AbsoluteFill style={{background:ink,color:white,fontFamily:'Noto Sans SC, Microsoft YaHei, sans-serif',padding:54}}><div style={{position:'absolute',inset:22,border:`2px solid ${cyan}`}}/><div style={{scale:.9,transformOrigin:'left center'}}><HotspotLogo inverse/></div><div style={{marginTop:170,fontSize:90,fontWeight:950,lineHeight:1.05}}>验证码<br/><span style={{color:lime}}>也会被钓？</span></div><div style={{marginTop:50,fontSize:31,color:muted}}>Passkey 把登录规则换了</div><div style={{position:'absolute',bottom:74,left:54,right:54,height:12,background:cyan}}/></AbsoluteFill>;
