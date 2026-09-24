import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {DeepSeekShotId} from './data';

const CYAN = '#72F2E0';
const LIME = '#D7F06A';
const WHITE = '#F3F9F6';
const MUTED = '#A6B9B8';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const appear = (frame: number, start: number, length = 14) => interpolate(frame, [start, start + length], [0, 1], clamp);
const lift = (frame: number, start: number, length = 14) => interpolate(frame, [start, start + length], [34, 0], clamp);

const Label: React.FC<{number: string; text: string}> = ({number, text}) => (
  <div style={{position: 'absolute', top: 29, left: 31, right: 31, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: CYAN, fontSize: 18, fontWeight: 800, letterSpacing: 2}}>
    <span>{number} / {text}</span><span style={{fontFamily: 'Bahnschrift, sans-serif', fontWeight: 500}}>DEEPSEEK / 0731</span>
  </div>
);

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    <Label number="01" text="新问题" />
    <div style={{position: 'absolute', top: 90, left: 56, fontFamily: 'Bahnschrift, sans-serif', fontSize: 218, lineHeight: 1, fontWeight: 800, letterSpacing: -16, opacity: appear(frame, 1, 13), translate: `0 ${lift(frame, 1, 13)}px`}}>V4</div>
    <div style={{position: 'absolute', top: 317, left: 60, fontFamily: 'Bahnschrift, sans-serif', fontSize: 86, lineHeight: 1, fontWeight: 700, letterSpacing: 7, color: CYAN, clipPath: `inset(0 ${100 - appear(frame, 14, 17) * 100}% 0 0)`}}>FLASH</div>
    <div style={{position: 'absolute', top: 432, left: 60, right: 45, height: 3, background: '#355354'}}>
      <div style={{width: `${appear(frame, 24, 18) * 100}%`, height: '100%', background: CYAN}} />
    </div>
    <div style={{position: 'absolute', top: 467, left: 60, fontSize: 55, fontWeight: 800, letterSpacing: -2, opacity: appear(frame, 28, 14), translate: `0 ${lift(frame, 28, 14)}px`}}>高分，<span style={{color: LIME}}>会做事吗？</span></div>
    <div style={{position: 'absolute', top: 560, left: 60, color: MUTED, fontFamily: 'Bahnschrift, sans-serif', fontSize: 21, letterSpacing: 2}}>OFFICIAL RELEASE  /  2026.07.31</div>
  </>;
};

const Release: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    <Label number="02" text="版本更新" />
    <div style={{position: 'absolute', top: 104, left: 44, fontSize: 50, fontWeight: 800}}>从预览，到正式版</div>
    <div style={{position: 'absolute', left: 43, top: 220, width: 245, height: 250, border: '2px solid #466166', background: '#1C2B30', padding: '34px 25px', opacity: appear(frame, 3), translate: `${-lift(frame, 3)}px 0`}}>
      <div style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 25, color: MUTED, letterSpacing: 3}}>PREVIEW</div>
      <div style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 77, marginTop: 17, fontWeight: 700}}>V4</div>
      <div style={{fontSize: 20, color: MUTED}}>早期版本</div>
    </div>
    <div style={{position: 'absolute', top: 327, left: 294, fontFamily: 'Bahnschrift, sans-serif', fontSize: 37, color: CYAN, opacity: appear(frame, 20)}}>→</div>
    <div style={{position: 'absolute', left: 349, top: 220, width: 245, height: 250, border: `2px solid ${CYAN}`, background: '#163334', padding: '34px 25px', opacity: appear(frame, 18), translate: `${lift(frame, 18)}px 0`}}>
      <div style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 25, color: CYAN, letterSpacing: 3}}>0731</div>
      <div style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 77, marginTop: 17, fontWeight: 700}}>V4</div>
      <div style={{fontSize: 20, color: CYAN}}>正式版</div>
    </div>
    <div style={{position: 'absolute', left: 45, top: 536, fontSize: 42, fontWeight: 800, color: LIME, opacity: appear(frame, 35)}}>Agent 能力更新</div>
  </>;
};

const Benchmark: React.FC<{kind: 'terminal' | 'deepswe'}> = ({kind}) => {
  const frame = useCurrentFrame();
  const terminal = kind === 'terminal';
  const prev = terminal ? 61.8 : 7.3;
  const now = terminal ? 82.7 : 54.4;
  const title = terminal ? 'Terminal Bench 2.1' : 'DeepSWE';
  return <>
    <Label number={terminal ? '03' : '04'} text="官方公布的数据" />
    <div style={{position: 'absolute', top: 97, left: 44, fontFamily: 'Bahnschrift, Noto Sans SC, sans-serif', fontSize: terminal ? 46 : 60, fontWeight: 800}}>{title}</div>
    <div style={{position: 'absolute', top: 174, left: 46, fontSize: 19, color: MUTED}}>同一榜单，预览版与 0731 版本</div>
    {[{name: 'PREVIEW', value: prev, color: '#73888B', start: 6}, {name: 'FLASH 0731', value: now, color: CYAN, start: 22}].map((bar, i) => (
      <div key={bar.name} style={{position: 'absolute', left: 45, right: 45, top: 258 + i * 175}}>
        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 13}}>
          <span style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 25, letterSpacing: 2, color: i ? CYAN : MUTED}}>{bar.name}</span>
          <span style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 67, lineHeight: 1, fontWeight: 700, color: i ? CYAN : WHITE}}>{(bar.value * appear(frame, bar.start, 27)).toFixed(1)}</span>
        </div>
        <div style={{height: 37, background: '#2B4043'}}>
          <div style={{height: '100%', width: `${bar.value * appear(frame, bar.start, 27)}%`, background: bar.color}} />
        </div>
      </div>
    ))}
    <div style={{position: 'absolute', left: 45, top: 601, fontSize: 18, color: MUTED}}>来源：DeepSeek-V4-Flash-0731 模型卡 · 非独立实测</div>
  </>;
};

const Method: React.FC = () => {
  const frame = useCurrentFrame();
  const cards = [
    {code: 'MODEL', detail: 'V4 Flash 0731', color: WHITE},
    {code: 'HARNESS', detail: 'minimal mode', color: CYAN},
    {code: 'EFFORT', detail: 'max', color: LIME},
  ];
  return <>
    <Label number="05" text="读榜单，也要读注释" />
    <div style={{position: 'absolute', left: 43, top: 98, fontSize: 48, fontWeight: 800}}>一个分数，三层条件</div>
    <div style={{position: 'absolute', left: 75, top: 204, width: 4, height: 334, background: '#365E60'}} />
    {cards.map((card, i) => (
      <div key={card.code} style={{position: 'absolute', left: 47, right: 45, top: 180 + i * 127, height: 100, border: '1px solid #40666A', background: '#192C30', display: 'flex', alignItems: 'center', padding: '0 30px', opacity: appear(frame, 5 + i * 17), translate: `${lift(frame, 5 + i * 17)}px 0`}}>
        <div style={{width: 13, height: 13, background: card.color, rotate: '45deg', marginRight: 24}} />
        <div style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 25, letterSpacing: 2, color: MUTED}}>{card.code}</div>
        <div style={{marginLeft: 'auto', fontFamily: 'Bahnschrift, Noto Sans SC, sans-serif', fontSize: 29, fontWeight: 700, color: card.color}}>{card.detail}</div>
      </div>
    ))}
    <div style={{position: 'absolute', left: 46, top: 590, fontFamily: 'Bahnschrift, sans-serif', fontSize: 17, color: MUTED}}>temperature 1.0   /   top_p 0.95</div>
  </>;
};

const Process: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    <Label number="06" text="真实任务流程示意" />
    <div style={{position: 'absolute', top: 102, left: 44, fontSize: 49, fontWeight: 800}}>任务不是一道选择题</div>
    <div style={{position: 'absolute', left: 75, right: 74, top: 334, height: 4, background: '#35575A'}}>
      <div style={{height: '100%', width: `${appear(frame, 12, 63) * 100}%`, background: CYAN}} />
    </div>
    {['理解问题', '调用工具', '核验结果'].map((name, i) => (
      <div key={name} style={{position: 'absolute', top: 263, left: 35 + i * 204, width: 166, height: 145, border: `2px solid ${i === 2 ? LIME : CYAN}`, background: '#1A3235', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: appear(frame, 4 + i * 22), scale: interpolate(frame, [4 + i * 22, 19 + i * 22], [.86, 1], clamp)}}>
        <div style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 23, color: CYAN}}>0{i + 1}</div>
        <div style={{fontSize: 26, fontWeight: 800, marginTop: 13}}>{name}</div>
      </div>
    ))}
    <div style={{position: 'absolute', top: 490, left: 46, fontSize: 29, color: MUTED, opacity: appear(frame, 73, 15)}}>每一步，都可能影响最终体验。</div>
    <div style={{position: 'absolute', top: 577, left: 47, fontSize: 17, color: MUTED}}>流程示意 · 非 DeepSeek 内部架构</div>
  </>;
};

const Checklist: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    <Label number="07" text="自己动手测" />
    <div style={{position: 'absolute', top: 100, left: 45, fontSize: 50, fontWeight: 800}}>把变量控制住</div>
    {['同一任务', '同一工具', '同一预算'].map((item, i) => (
      <div key={item} style={{position: 'absolute', top: 203 + i * 121, left: 46, right: 47, height: 89, borderBottom: '1px solid #3E585B', display: 'flex', alignItems: 'center', opacity: appear(frame, 7 + i * 23), translate: `0 ${lift(frame, 7 + i * 23)}px`}}>
        <div style={{width: 46, height: 46, border: `2px solid ${CYAN}`, color: CYAN, display: 'grid', placeItems: 'center', fontSize: 32, lineHeight: 1}}>✓</div>
        <div style={{fontSize: 38, fontWeight: 800, marginLeft: 29}}>{item}</div>
        <div style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 21, color: MUTED, marginLeft: 'auto'}}>0{i + 1}</div>
      </div>
    ))}
    <div style={{position: 'absolute', top: 588, left: 46, fontSize: 18, color: MUTED}}>编辑建议：让你的测试条件可复现</div>
  </>;
};

const End: React.FC = () => {
  const frame = useCurrentFrame();
  return <>
    <Label number="08" text="结论" />
    <div style={{position: 'absolute', top: 159, left: 43, fontSize: 71, lineHeight: 1.3, fontWeight: 800, opacity: appear(frame, 2, 16), translate: `0 ${lift(frame, 2, 16)}px`}}>榜单是起点</div>
    <div style={{position: 'absolute', top: 316, left: 43, fontSize: 59, lineHeight: 1.3, fontWeight: 800, color: LIME, opacity: appear(frame, 18, 16), translate: `0 ${lift(frame, 18, 16)}px`}}>任务才是答案</div>
    <div style={{position: 'absolute', top: 440, left: 46, width: 500 * appear(frame, 30, 19), height: 8, background: CYAN}} />
    <div style={{position: 'absolute', top: 546, left: 46, fontFamily: 'Bahnschrift, sans-serif', fontSize: 22, letterSpacing: 2, color: MUTED}}>HOTSPOT JUN  /  DEEPSEEK V4 FLASH</div>
  </>;
};

const contentById: Record<DeepSeekShotId, React.FC> = {
  hook: Hook,
  release: Release,
  terminal: () => <Benchmark kind="terminal" />,
  deepswe: () => <Benchmark kind="deepswe" />,
  method: Method,
  process: Process,
  checklist: Checklist,
  end: End,
};

export const DeepSeekShot: React.FC<{id: DeepSeekShotId; number: string; caption: string}> = ({id, number, caption}) => {
  const frame = useCurrentFrame();
  const Content = contentById[id];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{bottom: 113, overflow: 'hidden'}}><Content /></AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 112, background: '#091316', borderTop: `3px solid ${CYAN}`, display: 'flex', alignItems: 'center', gap: 17, padding: '0 28px'}}>
        <span style={{fontFamily: 'Bahnschrift, sans-serif', fontSize: 31, fontWeight: 700, color: CYAN}}>{number}</span>
        <span style={{fontSize: 26, lineHeight: 1.27, fontWeight: 700, opacity: appear(frame, 4, 10)}}>{caption}</span>
      </div>
    </AbsoluteFill>
  );
};
