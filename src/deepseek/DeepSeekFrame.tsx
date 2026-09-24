import type {ReactNode} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {HotspotLogo} from '../components/HotspotLogo';
import {DEEPSEEK_DURATION, DEEPSEEK_FPS, deepSeekShots} from './data';

const cyan = '#72F2E0';

export const DeepSeekFrame: React.FC<{children: ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const displayFrame = Math.min(frame, DEEPSEEK_DURATION - DEEPSEEK_FPS);
  const shotIndex = deepSeekShots.findIndex((_, index) => {
    const end = deepSeekShots.slice(0, index + 1).reduce((sum, shot) => sum + shot.duration * 30, 0);
    return frame < end;
  });
  const currentShot = deepSeekShots[Math.max(0, shotIndex)];
  const progress = Math.min(1, displayFrame / (DEEPSEEK_DURATION - DEEPSEEK_FPS));

  return (
    <AbsoluteFill style={{background: '#090F12', color: '#F3F9F6', fontFamily: 'Noto Sans SC, Microsoft YaHei, sans-serif', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: .19, backgroundImage: 'linear-gradient(rgba(114,242,224,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(114,242,224,.15) 1px, transparent 1px)', backgroundSize: '44px 44px', backgroundPosition: `0 ${interpolate(displayFrame, [0, DEEPSEEK_DURATION], [0, 88])}px`}} />
      <div style={{position: 'absolute', top: -20, left: 0, right: 0, height: 1050, opacity: .08, fontFamily: 'Bahnschrift, monospace', fontSize: 16, lineHeight: 2, whiteSpace: 'pre', overflow: 'hidden', letterSpacing: 3, translate: `0 ${interpolate(displayFrame, [0, DEEPSEEK_DURATION], [-65, 0])}px`}}>
        {'MODEL  •  HARNESS  •  TASK  •  VERIFY    '.repeat(40)}
      </div>
      <div style={{position: 'absolute', left: 42, top: 38}}><HotspotLogo inverse frameOverride={displayFrame} /></div>
      <div style={{position: 'absolute', right: 42, top: 50, textAlign: 'right'}}>
        <div style={{fontSize: 18, letterSpacing: 3, fontWeight: 800, color: cyan}}>AI / 深读</div>
        <div style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 15, marginTop: 7, opacity: .7}}>EPISODE 001</div>
      </div>
      <div style={{position: 'absolute', left: 42, right: 42, top: 133, height: 2, background: 'rgba(114,242,224,.65)'}} />
      <div style={{position: 'absolute', left: 42, top: 157, fontFamily: 'Bahnschrift, sans-serif', color: cyan, fontSize: 21, letterSpacing: 4, fontWeight: 700}}>DEEPSEEK  /  V4 FLASH 0731</div>
      <div style={{position: 'absolute', left: 40, top: 203, width: 640, height: 777, border: '2px solid rgba(114,242,224,.65)', background: '#121C20', boxShadow: '0 0 0 6px rgba(7,15,17,.75), 0 20px 50px rgba(0,0,0,.42)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: 0, left: 0, width: 105, height: 5, background: cyan, zIndex: 8}} />
        <div style={{position: 'absolute', top: 0, right: 0, width: 5, height: 80, background: cyan, zIndex: 8}} />
        <div style={{position: 'absolute', bottom: 111, left: 30, right: 30, height: 2, background: 'rgba(114,242,224,.28)', zIndex: 5}}>
          <div style={{height: 2, width: `${100 * progress}%`, background: cyan, boxShadow: `0 0 12px ${cyan}`}} />
        </div>
        {children}
      </div>
      <div style={{position: 'absolute', top: 1019, left: 42, right: 42, display: 'flex', justifyContent: 'space-between', color: cyan, fontFamily: 'Bahnschrift, sans-serif', fontSize: 17, letterSpacing: 2}}>
        <span>THE CONTEXT / 深入看条件</span><span>{String(Math.max(0, shotIndex) + 1).padStart(2, '0')} / 08</span>
      </div>
      <div style={{position: 'absolute', left: 42, top: 1057, fontSize: 49, lineHeight: 1.18, fontWeight: 800, letterSpacing: -2}}>
        高分背后，<span style={{color: '#D7F06A'}}>到底是什么？</span>
      </div>
      <div style={{position: 'absolute', left: 42, right: 42, top: 1158, fontSize: 17, display: 'flex', justifyContent: 'space-between', opacity: .68}}>
        <span>资料来源：DeepSeek 官方模型卡</span><span>{currentShot.label}</span>
      </div>
      <div style={{position: 'absolute', left: 42, right: 42, top: 1213, height: 6, background: '#2B4145'}}>
        <div style={{width: `${progress * 100}%`, height: '100%', background: '#D7F06A'}} />
      </div>
      <div style={{position: 'absolute', left: 42, bottom: 25, fontFamily: 'Bahnschrift, sans-serif', letterSpacing: 2, fontSize: 14, opacity: .55}}>HOTSPOT JUN  /  ORIGINAL EXPLAINER</div>
    </AbsoluteFill>
  );
};
