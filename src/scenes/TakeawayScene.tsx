import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {episode} from '../episode';
import {MediaSlot} from '../components/MediaSlot';
import {SceneCaption} from '../components/SceneCaption';

export const TakeawayScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#E34B35', color: '#F8F6F0', overflow: 'hidden'}}>
      {episode.assets.takeaway ? <MediaSlot asset={episode.assets.takeaway} label="结论镜头 / 原创或授权" /> : (
        <>
          <div style={{position: 'absolute', left: 35, top: 30, fontFamily: 'Georgia, Noto Sans SC, serif', fontSize: 21, fontWeight: 900}}>04 / 结论</div>
          <div style={{position: 'absolute', left: 29, top: 108, fontSize: 100, lineHeight: 1.2, fontWeight: 900, letterSpacing: -7, translate: `${interpolate(frame, [0,22], [-650,0], {extrapolateRight: 'clamp'})}px 0`}}>先看任务</div>
          <div style={{position: 'absolute', left: 30, top: 286, fontSize: 88, lineHeight: 1.2, fontWeight: 900, letterSpacing: -6, color: '#1C1D1B', translate: `${interpolate(frame, [10,34], [650,0], {extrapolateRight: 'clamp'})}px 0`}}>再看榜单</div>
          <div style={{position: 'absolute', left: 37, top: 254, width: interpolate(frame, [30,58], [0,525], {extrapolateRight: 'clamp'}), height: 9, background: '#1C1D1B'}} />
          <div style={{position: 'absolute', left: 39, top: 455, right: 35, display: 'flex', justifyContent: 'space-between'}}>
            {['准确', '稳定', '成本'].map((text, i) => <div key={text} style={{width: 166, textAlign: 'center', border: '2px solid #F8F6F0', padding: '11px 0', fontSize: 25, fontWeight: 900, opacity: interpolate(frame, [43 + i * 8, 54 + i * 8], [0,1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>{text}</div>)}
          </div>
        </>
      )}
      <SceneCaption number="04">{episode.captions.takeaway}</SceneCaption>
    </AbsoluteFill>
  );
};
