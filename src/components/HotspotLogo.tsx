import {interpolate, useCurrentFrame} from 'remotion';
import {episode} from '../episode';

/** Original code-drawn mark: a point with three expanding news/signal arcs. */
export const HotspotLogo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 13}}>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-label="热点君图标">
        <rect x="0" y="0" width="56" height="56" rx="8" fill="#E34B35" />
        <circle cx="17" cy="39" r="5" fill="#F7F3EB" />
        <path d="M17 26a13 13 0 0 1 13 13" stroke="#F7F3EB" strokeWidth="4" fill="none" strokeLinecap="round" opacity={interpolate(frame % 75, [0, 12, 65, 74], [.45, 1, 1, .45])} />
        <path d="M17 13a26 26 0 0 1 26 26" stroke="#F7F3EB" strokeWidth="4" fill="none" strokeLinecap="round" opacity={interpolate((frame + 16) % 75, [0, 12, 65, 74], [.45, 1, 1, .45])} />
      </svg>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <div style={{fontSize: 35, lineHeight: 1, fontWeight: 900, letterSpacing: -2}}>{episode.brand}</div>
        <div style={{fontSize: 11, lineHeight: 1.4, letterSpacing: 3, fontWeight: 800}}>HOTSPOT  ·  NEWS</div>
      </div>
    </div>
  );
};
