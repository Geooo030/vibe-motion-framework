import {Video} from '@remotion/media';
import {CanvasImage, interpolate, staticFile, useCurrentFrame} from 'remotion';

export type SlotAsset = {kind: 'image' | 'video'; src: string};

/** Put an original/licensed image or clip in public/, then feed its relative path here. */
export const MediaSlot: React.FC<{asset: SlotAsset; label?: string}> = ({asset, label}) => {
  const frame = useCurrentFrame();
  const style: React.CSSProperties = {
    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
    scale: interpolate(frame, [0, 150], [1.04, 1.16], {extrapolateRight: 'clamp'}),
  };
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#191919'}}>
      {asset.kind === 'image' ? <CanvasImage src={staticFile(asset.src)} style={style} /> : <Video src={staticFile(asset.src)} style={style} />}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(transparent 58%, rgba(0,0,0,.58))'}} />
      {label && <div style={{position: 'absolute', left: 25, bottom: 20, color: '#fff', fontSize: 22, fontWeight: 800}}>{label}</div>}
    </div>
  );
};
