import React, { useLayoutEffect, useRef } from "react";
import { useGsapTimeline } from "@remotion/gsap";
import { Video } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Color } from "three";
import type { RenderScene } from "./types";

type VisualProps = {
  scene: RenderScene;
  width: number;
  height: number;
  fps: number;
};

const smallLabel: React.CSSProperties = {
  fontFamily: 'Consolas, "Courier New", monospace',
  letterSpacing: "0.1em",
  fontWeight: 600,
};

const DomVisual: React.FC<VisualProps> = ({ scene, width, height }) => {
  const columns = width / height > 2.2 ? 4 : 2;
  const items = (scene.items.length ? scene.items : [scene.title]).slice(0, 4);
  const scope = useGsapTimeline<HTMLDivElement>(
    ({ timeline, selector }) => {
      timeline
        .fromTo(
          selector("[data-card]"),
          { y: 35, opacity: 0, scale: 0.91 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.65,
            stagger: 0.13,
            ease: "power3.out",
          },
          0,
        )
        .fromTo(
          selector("[data-rule]"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: "power2.inOut" },
          0.1,
        )
        .fromTo(
          selector("[data-dot]"),
          { x: -14, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.13 },
          0.3,
        );
    },
    { dependencies: [scene, width, height] },
  );

  return (
    <AbsoluteFill ref={scope} style={{ justifyContent: "center" }}>
      <div
        data-rule
        style={{
          height: 2,
          width: "100%",
          background: `linear-gradient(90deg, transparent, ${scene.accent}, transparent)`,
          transformOrigin: "left",
          position: "absolute",
          top: "50%",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: 16,
          padding: "10px 0",
        }}
      >
        {items.map((item, index) => (
          <div
            key={`${index}-${item}`}
            data-card
            style={{
              minHeight: columns === 4 ? height * 0.66 : height * 0.36,
              border: `1px solid ${scene.accent}55`,
              background: "#121B25",
              borderRadius: 18,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 18px 38px #00000045",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ ...smallLabel, fontSize: 15, color: scene.accent }}
              >
                0{index + 1}
              </span>
              <span
                data-dot
                style={{
                  width: 8,
                  height: 8,
                  background: scene.accent,
                  borderRadius: 10,
                  boxShadow: `0 0 16px ${scene.accent}`,
                }}
              />
            </div>
            <div
              style={{
                fontSize: Math.max(19, Math.min(29, width / columns / 9)),
                fontWeight: 700,
                lineHeight: 1.3,
                overflowWrap: "anywhere",
              }}
            >
              {item}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Redraw the complete canvas from frame input; no retained simulation state. */
const CanvasVisual: React.FC<VisualProps> = ({ scene, width, height, fps }) => {
  const frame = useCurrentFrame();
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx)
      throw new Error("Canvas2D renderer could not create a drawing context");
    const seconds = frame / fps;
    const reveal = Math.min(1, frame / (fps * 0.9));
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#101B26";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#FFFFFF0D";
    ctx.lineWidth = 1;
    const step = Math.max(24, Math.round(height / 6));
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // A data-driven signal is recomputed at every frame, including reverse seeks.
    ctx.strokeStyle = scene.accent;
    ctx.lineWidth = Math.max(2, height / 80);
    ctx.shadowColor = scene.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let x = 0; x <= width * reveal; x += 3) {
      const u = x / width;
      const amplitude = Math.sin(u * Math.PI) * height * 0.23;
      const y =
        height * 0.42 +
        Math.sin(u * 17 + seconds * 2) * amplitude +
        Math.sin(u * 43 - seconds) * amplitude * 0.2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    const count = 40;
    const gap = width * 0.018;
    const barWidth = (width - gap * (count - 1)) / count;
    ctx.globalAlpha = 0.38;
    for (let i = 0; i < count; i++) {
      const value =
        (0.2 + 0.8 * Math.abs(Math.sin(i * 0.7 + seconds))) *
        height *
        0.16 *
        reveal;
      ctx.fillStyle = scene.accent;
      ctx.fillRect(i * (barWidth + gap), height - value, barWidth, value);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 26; i++) {
      // Fixed index-based trajectories, intentionally without Math.random().
      const x =
        (((i * 137.7 + seconds * (15 + (i % 5))) % width) + width) % width;
      const y =
        height * (0.15 + (Math.sin(i * 1.7 + seconds * 0.7) + 1) * 0.31);
      ctx.beginPath();
      ctx.arc(x, y, i % 3 === 0 ? 3 : 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `${scene.accent}AA`;
      ctx.fill();
    }
  }, [frame, fps, width, height, scene.accent]);

  return (
    <AbsoluteFill
      style={{
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid #FFFFFF16",
      }}
    >
      <canvas
        ref={canvas}
        width={width}
        height={height}
        style={{ display: "block", width, height }}
      />
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 20,
          ...smallLabel,
          fontSize: 15,
          color: scene.accent,
        }}
      >
        CANVAS 2D / FRAME {String(frame).padStart(4, "0")}
      </div>
      <ItemLegend scene={scene} />
    </AbsoluteFill>
  );
};

const ItemLegend: React.FC<{ scene: RenderScene }> = ({ scene }) => (
  <div
    style={{
      position: "absolute",
      bottom: 18,
      left: 20,
      right: 20,
      display: "flex",
      flexWrap: "wrap",
      gap: 9,
    }}
  >
    {scene.items.slice(0, 4).map((item, index) => (
      <span
        key={`${index}-${item}`}
        style={{
          ...smallLabel,
          fontSize: 14,
          color: "#DCE6EE",
          padding: "7px 11px",
          border: `1px solid ${scene.accent}50`,
          borderRadius: 7,
          background: "#0A111ADB",
          maxWidth: "100%",
          overflowWrap: "anywhere",
        }}
      >
        {item}
      </span>
    ))}
  </div>
);

const ThreeVisual: React.FC<VisualProps> = ({ scene, width, height, fps }) => {
  const frame = useCurrentFrame();
  const time = frame / fps;
  const entry = interpolate(frame, [0, Math.round(fps * 0.8)], [0.45, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        borderRadius: 22,
        overflow: "hidden",
        background: "#101923",
        border: "1px solid #FFFFFF16",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 1.6, 7], fov: 38 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={2.5}
          color="#E5F3FF"
        />
        <pointLight position={[-4, 1, 2]} intensity={14} color={scene.accent} />
        <group
          rotation={[0.18, time * 0.48, -0.08]}
          scale={entry}
          position={[0, 0.45, 0]}
        >
          <mesh>
            <icosahedronGeometry args={[0.88, 0]} />
            <meshStandardMaterial
              color={scene.accent}
              metalness={0.65}
              roughness={0.25}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.4, 0.036, 12, 72]} />
            <meshStandardMaterial
              color="#D8E8FF"
              emissive={scene.accent}
              emissiveIntensity={0.45}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          {[0, 1, 2, 3].map((index) => {
            const angle = (index * Math.PI) / 2;
            return (
              <mesh
                key={index}
                position={[
                  Math.cos(angle) * 1.8,
                  Math.sin(angle) * 0.42,
                  Math.sin(angle) * 1.8,
                ]}
                rotation={[time * 0.3, angle, 0]}
              >
                <boxGeometry args={[0.36, 0.36, 0.36]} />
                <meshStandardMaterial
                  color={index % 2 === 0 ? scene.accent : "#CAD4E4"}
                  metalness={0.45}
                  roughness={0.35}
                />
              </mesh>
            );
          })}
        </group>
        <gridHelper
          args={[16, 24, scene.accent, "#273646"]}
          position={[0, -0.82, 0]}
        />
      </ThreeCanvas>
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 20,
          ...smallLabel,
          color: scene.accent,
          fontSize: 15,
        }}
      >
        THREE.JS / MODEL + LIGHT + CAMERA
      </div>
      <ItemLegend scene={scene} />
    </AbsoluteFill>
  );
};

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float iTime;
uniform float aspect;
uniform vec3 accent;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  vec3 color = vec3(0.035, 0.060, 0.09);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float wave = sin(p.x * (1.7 + fi * 0.28) + iTime * 0.7 + fi) * 0.16;
    wave += cos(p.x * 3.4 - iTime * 0.4 + fi * 1.2) * 0.08;
    float ribbon = 0.006 / (abs(p.y - wave - (fi - 2.0) * 0.036) + 0.018);
    color += accent * ribbon * (0.26 + fi * 0.045);
  }
  float halo = exp(-length(p - vec2(sin(iTime * 0.35) * 0.5, 0.0)) * 2.2);
  color += accent * halo * 0.13;
  float vignette = 1.0 - smoothstep(0.12, 1.0, length(vUv - 0.5));
  gl_FragColor = vec4(color * (0.6 + vignette * 0.4), 1.0);
}
`;

const ShaderVisual: React.FC<VisualProps> = ({ scene, width, height, fps }) => {
  const frame = useCurrentFrame();
  const aspect = width / height;
  return (
    <AbsoluteFill
      style={{
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid #FFFFFF16",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        camera={{ position: [0, 0, 2], zoom: height / 2 }}
        gl={{ antialias: false }}
      >
        <mesh>
          <planeGeometry args={[aspect * 2, 2]} />
          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={{
              iTime: { value: frame / fps },
              aspect: { value: aspect },
              accent: { value: new Color(scene.accent) },
            }}
          />
        </mesh>
      </ThreeCanvas>
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 20,
          ...smallLabel,
          color: "#EDF3FA",
          fontSize: 15,
        }}
      >
        GLSL / iTime = {(frame / fps).toFixed(3)}
      </div>
      <ItemLegend scene={scene} />
    </AbsoluteFill>
  );
};

const MediaVisual: React.FC<VisualProps> = ({ scene }) => {
  if (!scene.media)
    throw new Error(`Scene ${scene.id}: media renderer requires a media asset`);
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };
  return (
    <AbsoluteFill
      style={{
        borderRadius: 22,
        overflow: "hidden",
        background: "#111A25",
        border: "1px solid #FFFFFF16",
      }}
    >
      {scene.media.kind === "video" ? (
        <Video src={staticFile(scene.media.src)} muted style={style} />
      ) : (
        <CanvasImage src={staticFile(scene.media.src)} style={style} />
      )}
    </AbsoluteFill>
  );
};

export const SceneVisual: React.FC<VisualProps> = (props) => {
  switch (props.scene.renderer) {
    case "dom":
      return <DomVisual {...props} />;
    case "canvas":
      return <CanvasVisual {...props} />;
    case "three":
      return <ThreeVisual {...props} />;
    case "shader":
      return <ShaderVisual {...props} />;
    case "media":
      return <MediaVisual {...props} />;
    default:
      throw new Error(`Unknown production renderer: ${props.scene.renderer}`);
  }
};
