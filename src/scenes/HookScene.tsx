import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SceneCaption} from '../components/SceneCaption';

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{padding: '52px 42px 120px'}}>
      <div style={{fontSize: 25, color: '#6cebe2', letterSpacing: 4, fontWeight: 800}}>01 / QUESTION</div>
      <div style={{marginTop: 98, fontSize: 57, fontWeight: 900, lineHeight: 1.22, opacity: interpolate(frame, [0,14], [0,1], {extrapolateRight: 'clamp'}), translate: `0 ${interpolate(frame, [0,18], [32,0], {extrapolateRight: 'clamp'})}px`}}>
        榜单第一，<br /><span style={{color: '#89f3e8'}}>就最好用</span>？
      </div>
      <div style={{position: 'absolute', left: 100, top: 335, width: 440, height: 280, borderRadius: 30, border: '1px solid #448b94', background: 'linear-gradient(130deg, #173d46, #081319)', boxShadow: '0 16px 50px rgba(0,0,0,.4)', scale: interpolate(frame, [8,28], [.75,1], {extrapolateRight: 'clamp'})}}>
        <div style={{fontSize: 25, color: '#aac6c8', padding: '28px 34px'}}>单项分数</div>
        <div style={{fontSize: 145, fontWeight: 900, color: '#f2fcfc', textAlign: 'center', lineHeight: 1}}>96<span style={{fontSize: 60, color: '#49e5dc'}}>.4</span></div>
        <div style={{fontSize: 18, color: '#8dabaf', textAlign: 'center'}}>示意数值 · 非真实评测</div>
      </div>
      <SceneCaption>一个分数，解释不了全部体验。</SceneCaption>
    </AbsoluteFill>
  );
};
