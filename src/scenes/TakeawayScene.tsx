import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SceneCaption} from '../components/SceneCaption';

export const TakeawayScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{padding: '52px 45px 120px'}}>
      <div style={{fontSize: 25, color: '#6cebe2', letterSpacing: 4, fontWeight: 800}}>04 / TAKEAWAY</div>
      <div style={{marginTop: 130, textAlign: 'center', scale: interpolate(frame, [0,20], [.88,1], {extrapolateRight: 'clamp'})}}>
        <div style={{fontSize: 104, color: '#78eee2', fontWeight: 900, lineHeight: 1}}>先看任务</div>
        <div style={{width: 420, height: 4, margin: '28px auto', background: '#98e961'}} />
        <div style={{fontSize: 68, fontWeight: 900, lineHeight: 1.2}}>再看榜单</div>
      </div>
      <div style={{display: 'flex', gap: 14, justifyContent: 'center', marginTop: 85}}>
        {['准确', '稳定', '成本'].map((label, i) => <div key={label} style={{border: '1px solid #60b8b6', borderRadius: 30, padding: '12px 22px', color: '#c9edec', fontSize: 23, opacity: interpolate(frame, [30 + i * 12, 44 + i * 12], [0,1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{label}</div>)}
      </div>
      <SceneCaption>科技新闻，要把结论放回使用场景。</SceneCaption>
    </AbsoluteFill>
  );
};
