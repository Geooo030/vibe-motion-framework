import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {episode} from '../episode';
import {MediaSlot} from '../components/MediaSlot';
import {SceneCaption} from '../components/SceneCaption';

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slam = spring({frame: frame - 16, fps, config: {damping: 13, stiffness: 180}});
  return (
    <AbsoluteFill style={{background: '#F8F6F0', overflow: 'hidden'}}>
      {episode.assets.hook ? <MediaSlot asset={episode.assets.hook} label="新闻素材 / 使用前请核实来源" /> : (
        <>
          <div style={{position: 'absolute', left: 35, top: 31, fontFamily: 'Georgia, Noto Sans SC, serif', fontSize: 21, fontWeight: 900, letterSpacing: 1}}>01 / 提问</div>
          <div style={{position: 'absolute', left: 36, top: 110, fontSize: 75, lineHeight: 1.12, fontWeight: 900, letterSpacing: -4, clipPath: `inset(0 ${interpolate(frame, [0,21], [100,0], {extrapolateRight: 'clamp', easing: Easing.bezier(.2,.9,.2,1)})}% 0 0)`}}>榜单第一</div>
          <div style={{position: 'absolute', left: 208, top: 192, fontFamily: 'Arial, sans-serif', color: '#E34B35', fontSize: 225, fontWeight: 900, lineHeight: 1, scale: slam, rotate: `${interpolate(frame, [15,30], [-18,0], {extrapolateRight: 'clamp'})}deg`}}>≠</div>
          <div style={{position: 'absolute', left: 37, top: 416, fontSize: 80, lineHeight: 1, fontWeight: 900, letterSpacing: -5, clipPath: `inset(0 ${interpolate(frame, [28,49], [100,0], {extrapolateRight: 'clamp'})}% 0 0)`}}>最好用</div>
          <div style={{position: 'absolute', left: 38, top: 515, width: interpolate(frame, [42,62], [0,305], {extrapolateRight: 'clamp'}), height: 8, background: '#E34B35'}} />
          <div style={{position: 'absolute', right: 29, top: 39, width: 85, height: 85, border: '1px solid #1C1D1B', borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 900, fontSize: 30, rotate: `${interpolate(frame, [0,135], [0,28])}deg`}}>?</div>
        </>
      )}
      <SceneCaption number="01">{episode.captions.hook}</SceneCaption>
    </AbsoluteFill>
  );
};
