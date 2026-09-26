import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {HotspotLogo} from '../components/HotspotLogo';

export const BlenderBenchmarkDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const caption = frame < 72 ? '同一个基准，两个版本' : frame < 132 ? '从 61.8，提升到 82.7' : '镜头靠近，重点就清楚了';
  return (
    <AbsoluteFill style={{background: '#080c0e', color: '#f3f5f1', fontFamily: 'Noto Sans SC, Microsoft YaHei, sans-serif'}}>
      <Audio src={staticFile('blender/benchmark-sfx.wav')} />
      <div style={{position: 'absolute', inset: -80, opacity: .13, rotate: '-9deg', translate: `0 ${interpolate(frame, [0, 180, 209], [0, -55, -55])}px`, fontFamily: 'Bahnschrift, sans-serif', fontSize: 21, lineHeight: 2.8, letterSpacing: 1, color: '#a4b5b8', overflow: 'hidden'}}>
        {Array.from({length: 25}, (_, i) => <div key={i}>{i % 2 ? 'EVIDENCE / REASONING / TOOLS / VERIFICATION / ' : 'MODEL / BENCHMARK / DEEPSEEK / AGENT / '}{i % 2 ? 'EVIDENCE / REASONING / TOOLS' : 'MODEL / BENCHMARK / DEEPSEEK'}</div>)}
      </div>
      <div style={{position: 'absolute', left: 37, top: 115, width: 646, height: 963, padding: 8, borderRadius: 25, background: 'linear-gradient(125deg, #d7e0dd 0%, #5a676b 12%, #171e22 42%, #627477 73%, #afbcb7 100%)', boxShadow: '0 0 0 1px #cad5d655, 0 0 18px #b7e7e52b, 0 30px 65px #000'}}>
        <div style={{height: '100%', borderRadius: 18, background: 'linear-gradient(135deg, #292f32, #151b1e 50%, #2a3032)', overflow: 'hidden', border: '1px solid #d6dedc40'}}>
          <div style={{height: 83, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundImage: 'radial-gradient(#ffffff13 1px, transparent 1px)', backgroundSize: '15px 15px', borderBottom: '1px solid #d1d9d320'}}>
            <div style={{scale: '.78'}}><HotspotLogo inverse frameOverride={Math.min(frame, 180)} /></div>
          </div>
          <div style={{position: 'relative', height: 606, background: '#091316', overflow: 'hidden'}}>
            <Video src={staticFile('blender/benchmark-shot.mp4')} muted objectFit="cover" style={{width: '100%', height: '100%'}} />
            <div style={{position: 'absolute', left: 24, bottom: 17, padding: '6px 10px', borderRadius: 4, background: '#071014b8', color: '#b1c3c5', fontSize: 14, letterSpacing: .7}}>官方公布数据 · 非独立实测</div>
          </div>
          <div style={{height: 83, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 31, fontWeight: 600, letterSpacing: -.8, borderTop: '1px solid #ecf9f62b', borderBottom: '1px solid #ecf9f623', backgroundImage: 'radial-gradient(#ffffff10 1px, transparent 1px)', backgroundSize: '15px 15px'}}>{caption}</div>
          <div style={{padding: '26px 27px 0', fontSize: 41, lineHeight: 1.5, letterSpacing: -1.5, fontWeight: 500}}>
            <div><span style={{background: 'linear-gradient(transparent 77%, #21938890 77%, #21938890 93%, transparent 93%)'}}>DeepSeek 的新成绩</span></div>
            <div><span style={{background: 'linear-gradient(transparent 77%, #89b34e85 77%, #89b34e85 93%, transparent 93%)'}}>让关键数字成为焦点</span></div>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 58, right: 58, top: 1121, display: 'flex', justifyContent: 'space-between', fontSize: 16, letterSpacing: 1.5, color: '#819395'}}><span>热点君 · 动效试片</span><span>07 SEC</span></div>
      <div style={{position: 'absolute', left: 58, right: 58, top: 1160, height: 2, background: '#ffffff16'}}><div style={{height: '100%', background: '#7ab6ab', width: `${interpolate(frame, [0, 180, 209], [0, 100, 100])}%`}} /></div>
    </AbsoluteFill>
  );
};
