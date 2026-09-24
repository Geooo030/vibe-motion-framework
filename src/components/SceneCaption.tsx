import type {ReactNode} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

export const SceneCaption: React.FC<{number: string; children: ReactNode}> = ({number, children}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 112, display: 'flex', alignItems: 'center', gap: 22, padding: '0 31px', background: '#1C1D1B', color: '#F8F6F0', borderTop: '5px solid #E34B35'}}>
      <span style={{color: '#F3684B', fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 35}}>{number}</span>
      <span style={{fontSize: 29, lineHeight: 1.28, fontWeight: 800, opacity: interpolate(frame, [5,18], [0,1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), translate: `0 ${interpolate(frame, [5,18], [15,0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px`}}>{children}</span>
    </div>
  );
};
