import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SceneCaption} from '../components/SceneCaption';

const steps = [
  {id: '01', title: '理解问题', desc: '目标与约束'},
  {id: '02', title: '调用工具', desc: '搜索、计算、执行'},
  {id: '03', title: '核验结果', desc: '发现错误并重试'},
];

export const WorkflowScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{padding: '52px 42px 120px'}}>
      <div style={{fontSize: 25, color: '#6cebe2', letterSpacing: 4, fontWeight: 800}}>03 / WORKFLOW</div>
      <div style={{fontSize: 52, fontWeight: 900, lineHeight: 1.2, marginTop: 35}}>真正的能力，<br />藏在<span style={{color: '#97ed66'}}>完整流程</span>里</div>
      <div style={{position: 'absolute', left: 87, top: 284, width: 3, height: 275, background: '#257078'}} />
      {steps.map((step, i) => (
        <div key={step.id} style={{position: 'absolute', left: 50, right: 42, top: 265 + i * 118, height: 95, borderRadius: 20, border: '1px solid rgba(143,230,222,.45)', background: 'linear-gradient(90deg, #153b42, #0b1d23)', display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px', opacity: interpolate(frame, [i * 24, i * 24 + 12], [0,1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), translate: `${interpolate(frame, [i * 24, i * 24 + 15], [70,0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px 0`}}>
          <div style={{fontSize: 31, color: '#61e8df', fontWeight: 900}}>{step.id}</div>
          <div><div style={{fontSize: 34, fontWeight: 900}}>{step.title}</div><div style={{fontSize: 22, color: '#a5c5c7', marginTop: 5}}>{step.desc}</div></div>
        </div>
      ))}
      <SceneCaption>从回答，到执行，再到验证。</SceneCaption>
    </AbsoluteFill>
  );
};
