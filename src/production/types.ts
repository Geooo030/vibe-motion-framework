export type RendererKind = "dom" | "canvas" | "three" | "shader" | "media";

export type CaptionCue = {
  text: string;
  /** Frame offset relative to the beginning of this scene. */
  from: number;
  durationInFrames: number;
};

export type RenderScene = {
  id: string;
  renderer: RendererKind;
  title: string;
  body: string;
  accent: string;
  items: string[];
  /** Absolute frame offset on the production timeline. */
  from: number;
  durationInFrames: number;
  narration: string;
  audio?: { src: string; durationInFrames: number };
  media?: { src: string; kind: "image" | "video" };
  captions: CaptionCue[];
};

export type AudioTrack = {
  /** Path relative to public/, never a credential or remote TTS endpoint. */
  src: string;
  kind: "bgm" | "sfx";
  from: number;
  durationInFrames: number;
  volume: number;
};

export type RenderPlan = {
  schemaVersion: 1;
  id: string;
  title: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  audioMode: "none" | "local" | "qwen";
  scenes: RenderScene[];
  tracks: AudioTrack[];
};

export type ProductionProps = { plan: RenderPlan };
