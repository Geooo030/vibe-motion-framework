import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {episode} from '../episode';
import {MediaSlot} from '../components/MediaSlot';
import {SceneCaption} from '../components/SceneCaption';

const steps = [
  {index: '01', name: '理解问题', detail: '目标是什么？'},
  {index: '02', name: '调用工具', detail: '需要查什么？'},
  {index: '03', name: '核验结果', detail: '哪里会出错？'},
];

export const WorkflowScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#1C1D1B', color: '#F8F6F0', overflow: 'hidden'}}>
      {episode.assets.workflow ? <MediaSlot asset={episode.assets.workflow} label="流程画面 / 原创或授权" /> : (
        <>
          <div style={{position: 'absolute', left: 36, top: 31, fontFamily: 'Georgia, Noto Sans SC, serif', fontSize: 21, fontWeight: 900, color: '#F46D4E'}}>03 / 拆解</div>
          <div style={{position: 'absolute', left: 35, top: 80, fontSize: 49, fontWeight: 900, letterSpacing: -2}}>真实任务有三道关</div>
          <div style={{position: 'absolute', left: 68, top: 203, width: 3, height: 272, background: '#7C7D75'}} />
          <div style={{position: 'absolute', left: 61, top: 200 + interpolate(frame, [0,110], [0,272], {extrapolateRight: 'clamp'}), width: 17, height: 17, borderRadius: '50%', background: '#E34B35', boxShadow: '0 0 0 6px rgba(227,75,53,.2)'}} />
          {steps.map((step, i) => (
            <div key={step.index} style={{position: 'absolute', top: 187 + i * 132, left: 100, right: 34, height: 105, borderTop: '1px solid #666861', display: 'flex', alignItems: 'center', gap: 25, opacity: interpolate(frame, [i * 19, i * 19 + 13], [0,1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), translate: `${interpolate(frame, [i * 19, i * 19 + 15], [55,0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px 0`}}>
              <span style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#F46D4E', fontWeight: 900}}>{step.index}</span>
              <span style={{fontSize: 37, fontWeight: 900}}>{step.name}</span>
              <span style={{fontSize: 18, color: '#B8B9B0', marginLeft: 'auto'}}>{step.detail}</span>
            </div>
          ))}
        </>
      )}
      <SceneCaption number="03">{episode.captions.workflow}</SceneCaption>
    </AbsoluteFill>
  );
};
