import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {episode} from '../episode';
import {MediaSlot} from '../components/MediaSlot';
import {SceneCaption} from '../components/SceneCaption';

export const ContrastScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#F8F6F0', overflow: 'hidden'}}>
      {episode.assets.contrast ? <MediaSlot asset={episode.assets.contrast} label="对比材料 / 标明日期与来源" /> : (
        <>
          <div style={{position: 'absolute', left: 35, top: 30, fontFamily: 'Georgia, Noto Sans SC, serif', fontSize: 21, fontWeight: 900}}>02 / 对照</div>
          <div style={{position: 'absolute', left: 35, top: 77, fontSize: 46, fontWeight: 900, letterSpacing: -2}}>同一模型，两种视角</div>
          <div style={{position: 'absolute', left: 35, top: 164, width: 255, height: 298, background: '#1C1D1B', color: '#F8F6F0', padding: '25px 22px', translate: `${interpolate(frame, [0,19], [-280,0], {extrapolateRight: 'clamp'})}px 0`}}>
            <div style={{fontSize: 23, fontWeight: 800}}>基准测试</div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 104, lineHeight: 1.55, fontWeight: 900}}>96<span style={{fontSize: 42, color: '#F46D4E'}}>.4</span></div>
            <div style={{position: 'absolute', bottom: 27, left: 22, fontSize: 19, opacity: .8}}>单项示意分数</div>
          </div>
          <div style={{position: 'absolute', left: 324, top: 164, width: 255, height: 298, border: '2px solid #1C1D1B', padding: '25px 22px', translate: `${interpolate(frame, [7,27], [280,0], {extrapolateRight: 'clamp'})}px 0`}}>
            <div style={{fontSize: 23, fontWeight: 800}}>真实任务</div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 150, lineHeight: 1.05, fontWeight: 900, color: '#E34B35', textAlign: 'center', scale: interpolate(frame, [20,35], [.6,1], {extrapolateRight: 'clamp'})}}>?</div>
            <div style={{position: 'absolute', bottom: 27, left: 22, fontSize: 19}}>稳定 · 速度 · 成本</div>
          </div>
          <div style={{position: 'absolute', left: 37, top: 489, fontSize: 19, color: '#5D5E59'}}>示意图，不代表任何产品的真实测评结果</div>
          <div style={{position: 'absolute', left: 37, top: 530, width: interpolate(frame, [35,70], [0,530], {extrapolateRight: 'clamp'}), height: 3, background: '#E34B35'}} />
        </>
      )}
      <SceneCaption number="02">{episode.captions.contrast}</SceneCaption>
    </AbsoluteFill>
  );
};
