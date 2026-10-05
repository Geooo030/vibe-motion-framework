import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  type CalculateMetadataFunction,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneVisual } from "./renderers";
import { fadeEnvelope, trackVolume } from "./timing";
import type { ProductionProps, RenderScene } from "./types";
import { validateRenderPlan } from "./validatePlan";

const rendererLabels = {
  dom: "HTML / CSS + GSAP",
  canvas: "CANVAS 2D",
  three: "THREE.JS",
  shader: "WEBGL / GLSL",
  media: "IMAGE / VIDEO",
};

const SceneLayer: React.FC<{ scene: RenderScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const portrait = height > width;
  const unit = Math.min(width, height) / 720;
  const side = Math.round(width * 0.065);
  const stageWidth = width - side * 2;
  const stageHeight = Math.round(height * (portrait ? 0.36 : 0.355));
  const caption = scene.captions.find(
    (cue) => frame >= cue.from && frame < cue.from + cue.durationInFrames,
  );
  const titleLength = [...scene.title].length;
  const titleSize =
    Math.max(36, 58 - Math.max(0, titleLength - (portrait ? 20 : 30)) * 0.5) *
    unit;

  return (
    <AbsoluteFill
      style={{
        opacity: fadeEnvelope(
          frame,
          scene.durationInFrames,
          Math.round(fps * 0.18),
        ),
      }}
    >
      <div
        style={{
          position: "absolute",
          top: height * (portrait ? 0.155 : 0.145),
          left: side,
          right: side,
        }}
      >
        <div
          style={{
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 16 * unit,
            letterSpacing: "0.12em",
            color: scene.accent,
            marginBottom: 18 * unit,
          }}
        >
          {rendererLabels[scene.renderer]}
        </div>
        <h1
          style={{
            fontSize: titleSize,
            fontWeight: 750,
            lineHeight: 1.2,
            letterSpacing: "-0.04em",
            margin: 0,
            maxWidth: portrait ? "100%" : "92%",
            overflowWrap: "anywhere",
          }}
        >
          {scene.title}
        </h1>
        <p
          style={{
            fontSize: 27 * unit,
            lineHeight: 1.5,
            color: "#AABCCA",
            marginTop: 17 * unit,
            marginBottom: 0,
            overflowWrap: "anywhere",
          }}
        >
          {scene.body}
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          top: Math.round(height * (portrait ? 0.41 : 0.405)),
          left: side,
          width: stageWidth,
          height: stageHeight,
        }}
      >
        <SceneVisual
          scene={scene}
          width={stageWidth}
          height={stageHeight}
          fps={fps}
        />
      </div>

      {caption ? (
        <div
          style={{
            position: "absolute",
            bottom: height * 0.115,
            left: side,
            right: side,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "#FFFFFF",
              fontSize: (portrait ? 31 : 28) * unit,
              fontWeight: 600,
              lineHeight: 1.45,
              padding: "10px 20px",
              borderRadius: 10,
              background: "#070B13EC",
              textAlign: "center",
              maxWidth: "100%",
              overflowWrap: "anywhere",
              border: "1px solid #FFFFFF15",
            }}
          >
            {caption.text}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const AudioLayers: React.FC<ProductionProps> = ({ plan }) => (
  <>
    {plan.audioMode !== "none"
      ? plan.scenes
          .filter((scene) => scene.audio)
          .map((scene) => {
            const audio = scene.audio!;
            const duration = Math.min(
              audio.durationInFrames,
              scene.durationInFrames,
            );
            return (
              <Sequence
                key={`voice-${scene.id}`}
                name={`Voice: ${scene.id}`}
                from={scene.from}
                durationInFrames={duration}
                layout="none"
              >
                <Audio
                  src={staticFile(audio.src)}
                  volume={(frame) => fadeEnvelope(frame, duration, 2)}
                />
              </Sequence>
            );
          })
      : null}
    {plan.tracks.map((track, index) => (
      <Sequence
        key={`track-${index}`}
        name={`${track.kind}: ${track.src}`}
        from={track.from}
        durationInFrames={track.durationInFrames}
        layout="none"
      >
        <Audio
          src={staticFile(track.src)}
          loop={track.kind === "bgm"}
          loopVolumeCurveBehavior="extend"
          volume={(frame) => trackVolume(frame, track, plan)}
        />
      </Sequence>
    ))}
  </>
);

/** No TTS calls, asset downloads, wall-clock animation or randomness at render time. */
export const ProductionVideo: React.FC<ProductionProps> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const unit = Math.min(width, height) / 720;
  const side = Math.round(width * 0.065);
  const activeIndex = Math.max(
    0,
    plan.scenes.findIndex(
      (scene) =>
        frame >= scene.from && frame < scene.from + scene.durationInFrames,
    ),
  );
  const active = plan.scenes[activeIndex];
  const accent = active?.accent ?? "#66E3CA";
  const progress = interpolate(
    frame,
    [0, Math.max(1, plan.durationInFrames - 1)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: "#080E17",
        color: "#F2F6FA",
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          opacity: 0.3,
          backgroundImage:
            "linear-gradient(#FFFFFF0C 1px, transparent 1px), linear-gradient(90deg, #FFFFFF0C 1px, transparent 1px)",
          backgroundSize: `${48 * unit}px ${48 * unit}px`,
          backgroundPosition: `0px ${(frame * 0.18) % (48 * unit)}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: width * 0.65,
          height: width * 0.65,
          top: -width * 0.46,
          right: -width * 0.08,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}18, transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: height * 0.058,
          left: side,
          right: side,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <span
          style={{
            fontSize: 17 * unit,
            fontFamily: 'Consolas, "Courier New", monospace',
            letterSpacing: "0.06em",
            color: "#ACBECD",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {plan.title}
        </span>
        <span
          style={{
            fontSize: 16 * unit,
            color: accent,
            fontFamily: 'Consolas, "Courier New", monospace',
            whiteSpace: "nowrap",
          }}
        >
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(plan.scenes.length).padStart(2, "0")}
        </span>
      </div>

      {plan.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          name={`${scene.renderer}: ${scene.title}`}
          from={scene.from}
          durationInFrames={scene.durationInFrames}
        >
          <SceneLayer scene={scene} />
        </Sequence>
      ))}
      <AudioLayers plan={plan} />

      <div
        style={{
          position: "absolute",
          bottom: height * 0.046,
          left: side,
          right: side,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12 * unit,
            fontSize: 14 * unit,
            fontFamily: 'Consolas, "Courier New", monospace',
            letterSpacing: "0.06em",
            color: "#7F95A6",
          }}
        >
          <span>CODEX VIDEO</span>
          <span>
            {(frame / plan.fps).toFixed(1)}s /{" "}
            {(plan.durationInFrames / plan.fps).toFixed(1)}s
          </span>
        </div>
        <div
          style={{
            height: 3 * unit,
            borderRadius: 5,
            background: "#FFFFFF12",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              background: accent,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Metadata comes only from a prepared plan: rendering never makes cloud calls. */
export const calculateProductionMetadata: CalculateMetadataFunction<
  ProductionProps
> = ({ props }) => {
  const plan = validateRenderPlan(props.plan);
  return {
    fps: plan.fps,
    width: plan.width,
    height: plan.height,
    durationInFrames: plan.durationInFrames,
    props,
  };
};
