import {Composition} from 'remotion';
import {TechExplainer} from './Composition';
import {DeepSeekEpisode} from './deepseek/DeepSeekEpisode';
import {DEEPSEEK_DURATION} from './deepseek/data';
import {BlenderBenchmarkDemo} from './blender/BlenderBenchmarkDemo';
import './index.css';
import {TomcatFusion, TomcatFusionCover, TOMCAT_FUSION_DURATION} from './tomcat/TomcatFusion';
import tomcatConfig from '../episodes/tomcat-01/episode.json';

export const RemotionRoot: React.FC = () => {
  return <>
    <Composition id="TomcatFusion" component={TomcatFusion} durationInFrames={TOMCAT_FUSION_DURATION} fps={30} width={720} height={1280} calculateMetadata={()=>({fps:tomcatConfig.fps,width:tomcatConfig.width,height:tomcatConfig.height,durationInFrames:TOMCAT_FUSION_DURATION})}/>
    <Composition id="TomcatFusionCover" component={TomcatFusionCover} durationInFrames={1} fps={30} width={720} height={1280}/>
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
