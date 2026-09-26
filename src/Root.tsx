import {Composition} from 'remotion';
import {TechExplainer} from './Composition';
import {DeepSeekEpisode} from './deepseek/DeepSeekEpisode';
import {DEEPSEEK_DURATION} from './deepseek/data';
import {BlenderBenchmarkDemo} from './blender/BlenderBenchmarkDemo';
import './index.css';
import {EpisodeCover, HotspotEpisode} from './hotspot/HotspotEpisode';
import {EPISODE_DURATION} from './hotspot/episodeData';

export const RemotionRoot: React.FC = () => {
  return <>
    <Composition id="HotspotEpisode" component={HotspotEpisode} durationInFrames={EPISODE_DURATION} fps={30} width={720} height={1280}/>
    <Composition id="HotspotCover" component={EpisodeCover} durationInFrames={1} fps={30} width={720} height={1280}/>
    <Composition
      id="BlenderBenchmarkDemo"
      component={BlenderBenchmarkDemo}
      durationInFrames={210}
      fps={30}
      width={720}
      height={1280}
    />
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
