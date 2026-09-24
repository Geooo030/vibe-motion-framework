import {Sequence} from 'remotion';
import {DeepSeekFrame} from './DeepSeekFrame';
import {DeepSeekShot} from './Shots';
import {DEEPSEEK_FPS, deepSeekShots} from './data';

export const DeepSeekEpisode: React.FC = () => {
  let from = 0;
  return (
    <DeepSeekFrame>
      {deepSeekShots.map((shot, index) => {
        const start = from;
        const frames = shot.duration * DEEPSEEK_FPS;
        from += frames;
        return (
          <Sequence key={shot.id} from={start} durationInFrames={frames} layout="none" name={`${String(index + 1).padStart(2, '0')} ${shot.label}`}>
            <DeepSeekShot id={shot.id} number={String(index + 1).padStart(2, '0')} caption={shot.caption} />
          </Sequence>
        );
      })}
    </DeepSeekFrame>
  );
};
