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
    <div style={{scale:.72,transformOrigin:'left center'}}><HotspotLogo inverse/></div><div style={{fontFamily:'Bahnschrift, sans-serif',fontSize:17,letterSpacing:2,color:cyan}}>03 / WI-FI 7 MLO</div>
  </div>
  <div style={{position:'absolute',left:38,top:116,fontSize:20,fontWeight:800,color:cyan,letterSpacing:2}}>{String(index+1).padStart(2,'0')} · {label}</div>
</>;

const Hook=()=>{const f=useCurrentFrame();return <><div style={{fontSize:105,fontWeight:950,lineHeight:1,opacity:show(f),translate:`0 ${rise(f)}px`}}>WI-FI 7<br/><span style={{color:lime}}>不只拼峰值</span></div><div style={{marginTop:44,height:8,background:'#274247'}}><div style={{height:'100%',width:`${show(f-18,28)*100}%`,background:cyan}}/></div><div style={{marginTop:35,fontSize:28,color:muted}}>真正关键：MLO 多链路操作。</div></>};
const Split=()=>{const f=useCurrentFrame();return <div style={{display:'flex',gap:14,width:'100%'}}>{[{t:'2.4G',s:'穿墙',c:lime},{t:'5G',s:'更快',c:cyan},{t:'6G',s:'更净',c:'#FF8F70'}].map((x,i)=><div key={x.t} style={{flex:1,border:`2px solid ${x.c}`,background:panel,padding:'32px 15px',height:330,opacity:show(f-i*10),translate:`0 ${rise(f-i*10)}px`}}><div style={{fontSize:42,fontWeight:900,marginTop:35,color:x.c}}>{x.t}</div><div style={{fontSize:28,color:muted,marginTop:32}}>{x.s}</div><div style={{height:8,marginTop:65,background:x.c,width:`${70+i*12}%`}}/></div>)}</div>};
const Chain=()=>{const f=useCurrentFrame();return <><div style={{fontSize:50,fontWeight:900,marginBottom:48}}>一台设备，多条车道</div><div style={{display:'flex',alignItems:'center',gap:8}}>{['2.4G','5G','6G'].map((x,i)=><div key={x} style={{display:'contents'}}><div style={{width:142,height:142,border:`2px solid ${i===2?lime:cyan}`,background:panel,display:'grid',placeItems:'center',fontSize:30,fontWeight:900,opacity:show(f-i*13),scale:interpolate(f-i*13,[0,15],[.8,1],clamp)}}>{x}</div>{i<2&&<div style={{height:4,width:43,background:cyan,scale:`${show(f-i*13-10)} 1`}}/>}</div>)}</div><div style={{fontFamily:'Bahnschrift',fontSize:22,color:muted,marginTop:42}}>MULTI-LINK OPERATION / MLO</div></>};
const Truth=()=>{const f=useCurrentFrame();return <><div style={{fontSize:42,color:muted}}>大文件</div><div style={{fontSize:66,fontWeight:950,color:cyan,marginTop:18}}>叠加带宽</div><div style={{height:2,background:'#456064',margin:'44px 0'}}/><div style={{fontSize:42,color:muted}}>游戏 / 会议</div><div style={{fontSize:58,fontWeight:950,color:lime,marginTop:18,opacity:show(f-18)}}>少排队 少抖动</div></>};
const Break=()=>{const f=useCurrentFrame();return <><div style={{display:'flex',alignItems:'center',gap:16}}>{['路由器','终端','地区频段'].map((x,i)=><div key={x} style={{display:'contents'}}><div style={{padding:'30px 10px',width:145,textAlign:'center',background:panel,border:`1px solid ${i===2?lime:'#45676A'}`,fontSize:24,opacity:show(f-i*12)}}>{x}</div>{i<2&&<span style={{fontSize:36,color:cyan}}>＋</span>}</div>)}</div><div style={{fontSize:49,fontWeight:950,marginTop:70}}>三项都要 <span style={{color:lime}}>支持</span></div></>};
const Checklist=()=>{const f=useCurrentFrame();return <>{['无线拥堵','网口上限','宽带套餐'].map((x,i)=><div key={x} style={{display:'flex',alignItems:'center',height:112,borderBottom:'1px solid #355256',opacity:show(f-i*12),translate:`${rise(f-i*12)}px 0`}}><div style={{width:54,height:54,border:`2px solid ${i===2?lime:cyan}`,display:'grid',placeItems:'center',fontFamily:'Bahnschrift',fontSize:23,color:i===2?lime:cyan}}>0{i+1}</div><div style={{fontSize:37,fontWeight:850,marginLeft:25}}>{x}</div></div>)}</>};
const End=()=>{const f=useCurrentFrame();return <><div style={{fontSize:70,fontWeight:950,lineHeight:1.18,opacity:show(f),translate:`0 ${rise(f)}px`}}>别只问<br/><span style={{color:cyan}}>跑多快</span></div><div style={{fontSize:47,fontWeight:900,color:lime,marginTop:45,opacity:show(f-16)}}>更要问：忙时稳不稳</div><div style={{marginTop:62,fontSize:19,color:muted}}>HOTSPOT JUN · EPISODE 03</div></>};
const views={hook:Hook,split:Split,chain:Chain,truth:Truth,break:Break,checklist:Checklist,end:End};

const ShotView:React.FC<{shot:(typeof shots)[number];index:number}>=({shot,index})=>{const View=views[shot.kind];return <AbsoluteFill><Header index={index} label={shot.label}/><div style={{position:'absolute',left:42,right:42,top:205,bottom:218,display:'flex',flexDirection:'column',justifyContent:'center'}}><View/></div><div style={{position:'absolute',left:28,right:28,bottom:72,minHeight:118,borderTop:`3px solid ${cyan}`,background:'#081719',padding:'22px 22px',fontSize:32,lineHeight:1.3,fontWeight:850}}>{shot.caption}</div></AbsoluteFill>};

export const HotspotEpisode:React.FC=()=> <AbsoluteFill style={{background:ink,color:white,fontFamily:'Noto Sans SC, Microsoft YaHei, sans-serif'}}>
  <div style={{position:'absolute',inset:18,border:'1px solid #2A4549'}}/>
  <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(#17303455 1px,transparent 1px),linear-gradient(90deg,#17303455 1px,transparent 1px)',backgroundSize:'48px 48px',opacity:.28}}/>
  {shots.map((s,i)=><Sequence key={s.id} from={s.from} durationInFrames={s.to-s.from} name={`${s.id} ${s.label}`}><ShotView shot={s} index={i}/></Sequence>)}
  <Audio src={staticFile('episodes/03/narration.mp3')} volume={1}/>
  <Audio src={staticFile('episodes/03/bgm.wav')} loop volume={(f)=>interpolate(f,[0,30,1650,1740],[0,.1,.1,0],clamp)}/>
</AbsoluteFill>;

export const EpisodeCover:React.FC=()=> <AbsoluteFill style={{background:ink,color:white,fontFamily:'Noto Sans SC, Microsoft YaHei, sans-serif',padding:54}}><div style={{position:'absolute',inset:22,border:`2px solid ${cyan}`}}/><div style={{scale:.9,transformOrigin:'left center'}}><HotspotLogo inverse/></div><div style={{marginTop:170,fontSize:104,fontWeight:950,lineHeight:1.03}}>WI-FI 7<br/><span style={{color:lime}}>不只拼峰值</span></div><div style={{marginTop:50,fontSize:31,color:muted}}>MLO 多链路操作讲明白</div><div style={{position:'absolute',bottom:74,left:54,right:54,height:12,background:cyan}}/></AbsoluteFill>;
