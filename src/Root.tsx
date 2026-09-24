import {Composition} from 'remotion';
import {TechExplainer} from './Composition';
import {DeepSeekEpisode} from './deepseek/DeepSeekEpisode';
import {DEEPSEEK_DURATION} from './deepseek/data';
import './index.css';

export const RemotionRoot: React.FC = () => {
  return <>
    <Composition
      id="TechExplainerDemo"
      component={TechExplainer}
      durationInFrames={540}
      fps={30}
      width={720}
      height={1280}
    />
    <Composition
      id="DeepSeekV4Flash"
      component={DeepSeekEpisode}
      durationInFrames={DEEPSEEK_DURATION}
      fps={30}
      width={720}
      height={1280}
    />
  </>;
};
