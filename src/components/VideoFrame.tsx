import type {ReactNode} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

const manuscript = [
  'A benchmark is a measurement, not a complete user experience.',
  'Real work includes tools, retries, verification and the cost of errors.',
  'A useful model should be judged within a complete workflow.',
  'Latency, stability and reasoning matter after the leaderboard.',
];

export const VideoFrame: React.FC<{children: ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#05090d', color: '#f4f8f8', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 48% 36%, rgba(0,214,215,.14), transparent 38%), linear-gradient(145deg, #08131b, #04070b 64%)'}} />
      <div style={{position: 'absolute', left: -90, top: -40, width: 930, height: 1340, opacity: .2, color: '#86a8ae', fontFamily: 'Georgia, serif', fontSize: 22, lineHeight: 2.2, transform: `perspective(900px) rotateY(-15deg) rotateZ(-7deg) translateY(${interpolate(frame, [0,540], [0,-90])}px)`, filter: 'blur(1.5px)'}}>
        {Array.from({length: 13}, (_, i) => <div key={i}>{manuscript[i % manuscript.length]}</div>)}
      </div>
      <div style={{position: 'absolute', left: -180, top: 210 + interpolate(frame, [0,540], [0,100]), width: 490, height: 490, borderRadius: '50%', background: 'rgba(0,221,222,.13)', filter: 'blur(100px)'}} />
      <div style={{position: 'absolute', left: 34, top: 76, width: 652, height: 1108, borderRadius: 32, border: '2px solid rgba(220,249,249,.55)', background: 'linear-gradient(145deg, rgba(22,37,44,.94), rgba(9,17,23,.98))', boxShadow: '0 0 26px rgba(151,240,239,.33), inset 0 0 20px rgba(205,245,248,.12)', overflow: 'hidden'}}>
        <div style={{height: 92, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px', borderBottom: '1px solid rgba(168,225,227,.22)', background: 'rgba(255,255,255,.055)'}}>
          <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
            <div style={{width: 12, height: 12, background: '#36e3dd', transform: 'rotate(45deg)'}} />
            <span style={{fontSize: 30, fontWeight: 900, letterSpacing: 2}}>TECH / BRIEF</span>
          </div>
          <span style={{fontSize: 18, color: '#a8c5c8', fontWeight: 700}}>NO. 001</span>
        </div>
        <div style={{position: 'absolute', top: 92, bottom: 275, left: 0, right: 0, overflow: 'hidden', background: 'radial-gradient(circle at 70% 35%, #15444c, #071116 67%)'}}>{children}</div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 275, padding: '32px 34px', borderTop: '1px solid rgba(255,255,255,.15)', background: 'linear-gradient(180deg, rgba(30,44,50,.98), rgba(16,24,30,.98))'}}>
          <div style={{fontSize: 20, letterSpacing: 4, color: '#63e2db', fontWeight: 800}}>热点科技 · 原创演示</div>
          <div style={{fontSize: 56, fontWeight: 900, lineHeight: 1.25, marginTop: 12}}>跑分赢了，<br />体验就赢了吗？</div>
          <div style={{display: 'flex', gap: 8, marginTop: 17}}>
            <div style={{width: 205, height: 6, background: '#23d6d1', transform: 'skewX(-18deg)'}} />
            <div style={{width: 118, height: 6, background: '#9fea54', transform: 'skewX(-18deg)'}} />
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 51, bottom: 40, fontSize: 18, letterSpacing: 3, color: '#6d8a92'}}>TECH EXPLAINER / ORIGINAL DEMO</div>
    </AbsoluteFill>
  );
};
