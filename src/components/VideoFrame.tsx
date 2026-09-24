import type {ReactNode} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {episode} from '../episode';
import {HotspotLogo} from './HotspotLogo';

/** Editorial shell. The middle story stage is the replaceable part of an episode. */
export const VideoFrame: React.FC<{children: ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#ECEAE3', color: '#1C1D1B', overflow: 'hidden', fontFamily: 'Noto Sans SC, Microsoft YaHei, sans-serif'}}>
      <div style={{position: 'absolute', inset: 0, opacity: .22, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 63px, #A9AAA4 64px)', backgroundSize: '64px 100%'}} />
      <div style={{position: 'absolute', top: -170, right: -150, width: 580, height: 580, border: '1px solid rgba(28,29,27,.13)', borderRadius: '50%', scale: interpolate(frame, [0,durationInFrames], [1,1.27])}} />
      <div style={{position: 'absolute', top: 47, left: 48}}><HotspotLogo /></div>
      <div style={{position: 'absolute', top: 55, right: 48, textAlign: 'right'}}>
        <div style={{fontSize: 19, fontWeight: 900, letterSpacing: 2}}>{episode.category}</div>
        <div style={{fontSize: 14, marginTop: 4, letterSpacing: 2}}>第 {episode.number} 期</div>
      </div>
      <div style={{position: 'absolute', top: 145, left: 48, width: 624, height: 3, background: '#1C1D1B'}} />
      <div style={{position: 'absolute', top: 179, left: 48, right: 48, fontSize: 55, fontWeight: 900, lineHeight: 1.12, letterSpacing: -3}}>
        {episode.title[0]}<br /><span style={{color: '#E34B35'}}>{episode.title[1]}</span>
      </div>
      <div style={{position: 'absolute', top: 350, left: 48, width: 624, height: 690, background: '#F8F6F0', border: '2px solid #1C1D1B', boxShadow: '8px 8px 0 rgba(28,29,27,.16)', overflow: 'hidden'}}>
        {children}
      </div>
      <div style={{position: 'absolute', top: 1095, left: 48, right: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 17, fontWeight: 800, letterSpacing: 2}}>
        <span>{episode.footer}</span><span>资料核实 · 原创图解</span>
      </div>
      <div style={{position: 'absolute', top: 1150, left: 48, width: 624, height: 6, background: 'rgba(28,29,27,.2)'}}>
        <div style={{height: '100%', width: `${Math.min(100, 100 * frame / (durationInFrames - 1))}%`, background: '#E34B35'}} />
      </div>
      <div style={{position: 'absolute', top: 1187, left: 48, fontSize: 15, fontWeight: 800, letterSpacing: 2}}>热点君  /  把热点说清楚</div>
      <div style={{position: 'absolute', top: 1187, right: 48, fontSize: 15, fontWeight: 800}}>NO. {episode.number}</div>
    </AbsoluteFill>
  );
};
