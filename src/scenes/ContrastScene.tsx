import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SceneCaption} from '../components/SceneCaption';

const rows = [
  {label: '基准测试', width: 410, color: '#4be9dd'},
  {label: '多步任务', width: 295, color: '#a9e968'},
  {label: '失败恢复', width: 180, color: '#ffad6b'},
];

export const ContrastScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{padding: '52px 40px 120px'}}>
      <div style={{fontSize: 25, color: '#6cebe2', letterSpacing: 4, fontWeight: 800}}>02 / CONTRAST</div>
      <div style={{fontSize: 51, fontWeight: 900, marginTop: 32, lineHeight: 1.25}}>真实任务，比<br />一道考题更复杂</div>
      <div style={{marginTop: 30, padding: '20px 22px', border: '1px solid rgba(156,227,226,.35)', borderRadius: 22, background: 'rgba(3,16,20,.65)'}}>
        {rows.map((row, i) => (
          <div key={row.label} style={{marginBottom: i === 2 ? 0 : 18}}>
            <div style={{fontSize: 26, marginBottom: 13, fontWeight: 800}}>{row.label}</div>
            <div style={{height: 26, borderRadius: 18, background: '#1d353b'}}>
              <div style={{width: interpolate(frame, [6 + i * 14, 35 + i * 14], [0, row.width], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), height: 26, borderRadius: 18, background: row.color, boxShadow: `0 0 20px ${row.color}77`}} />
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 15, fontSize: 19, color: '#a4bdc1'}}>概念示意，不代表任何产品测评结果</div>
      <SceneCaption>跑分是线索，任务完成率才是答案。</SceneCaption>
    </AbsoluteFill>
  );
};
