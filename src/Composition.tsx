import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {VideoFrame} from './components/VideoFrame';
import {HookScene} from './scenes/HookScene';
import {ContrastScene} from './scenes/ContrastScene';
import {WorkflowScene} from './scenes/WorkflowScene';
import {TakeawayScene} from './scenes/TakeawayScene';

export const TechExplainer: React.FC = () => (
  <VideoFrame>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={135} name="问题钩子"><HookScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 10})} />
      <TransitionSeries.Sequence durationInFrames={145} name="矛盾对比"><ContrastScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 10})} />
      <TransitionSeries.Sequence durationInFrames={150} name="机制图解"><WorkflowScene /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: 10})} />
      <TransitionSeries.Sequence durationInFrames={140} name="结论收束"><TakeawayScene /></TransitionSeries.Sequence>
    </TransitionSeries>
  </VideoFrame>
);
