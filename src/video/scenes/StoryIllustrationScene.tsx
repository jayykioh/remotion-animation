import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { RenderPlan, RenderScene } from "../../../director/schema";
import { SceneFrame } from "../SceneFrame";

// --- Atmosphere Components ---
const RainLayer: React.FC<{ density: number }> = ({ density }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.5, pointerEvents: "none" }} aria-hidden="true">
      {Array.from({ length: density }).map((_, i) => {
        const speed = 15 + (i % 10);
        const y = (frame * speed + (i * 99)) % 120 - 10;
        const x = (i * 3) % 110 - 5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 1.5,
              height: 40 + (i % 20),
              background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 100%)",
              transform: "rotate(15deg)",
              filter: "blur(0.5px)"
            }}
          />
        );
      })}
    </div>
  );
};

const FogLayer: React.FC<{ density: number; color: string }> = ({ density, color }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.6, pointerEvents: "none" }} aria-hidden="true">
      {Array.from({ length: density }).map((_, i) => {
        const xOff = Math.sin(frame / 60 + i) * 20;
        const yOff = Math.cos(frame / 70 + i) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(i * 30) % 100 - 20 + xOff}%`,
              top: `${40 + (i * 15) % 50 + yOff}%`,
              width: 400 + (i % 3) * 150,
              height: 200 + (i % 2) * 100,
              background: color,
              borderRadius: "50%",
              filter: "blur(60px)",
              opacity: 0.4
            }}
          />
        );
      })}
    </div>
  );
};

const DustParticle: React.FC<{frame: number; seed: number; accent: string}> = ({frame, seed, accent}) => {
  const speed = 0.28 + (seed % 7) * 0.06;
  const xBase = 5 + (seed * 13 % 90);
  const size = 2 + (seed % 3);
  const xDrift = Math.sin((frame * speed + seed * 1.7) / 14) * 22;
  const yPos = 85 - ((frame * speed * 0.9 + seed * 18) % 70);
  const opacity = Math.sin((frame * speed + seed * 2.3) / 18) * 0.18 + 0.08;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${xBase + xDrift}%`,
        top: `${yPos}%`,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: seed % 3 === 0 ? accent : "rgba(220,215,230,0.9)",
        opacity,
        filter: "blur(0.5px)",
      }}
    />
  );
};

// --- Dynamic Elements ---
const EmojiElement: React.FC<{ element: any, captions: any[], fps: number }> = ({ element, captions, fps }) => {
  const frame = useCurrentFrame();
  
  // Find start frame matching the trigger word
  let startFrame = 0;
  if (element.triggerWord && captions) {
    for (const caption of captions) {
      if (!caption.words) continue;
      const foundWord = caption.words.find((w: any) => 
        w.text.toLowerCase().includes(element.triggerWord.toLowerCase())
      );
      if (foundWord) {
        startFrame = Math.round(foundWord.startSeconds * fps);
        break;
      }
    }
  }

  let animationStyles: React.CSSProperties = {};
  if (element.animation === "float") {
    const yOff = Math.sin((frame - startFrame) / 15) * 10;
    animationStyles = { transform: `translate(-50%, calc(-50% + ${yOff}px))` };
  } else if (element.animation === "sweep") {
    const xOff = ((frame - startFrame) * 5) % 200 - 50; // sweep across
    animationStyles = { transform: `translate(calc(-50% + ${xOff}px), -50%)` };
  } else if (element.animation === "pulse") {
    const scale = 1 + Math.sin((frame - startFrame) / 10) * 0.1;
    animationStyles = { transform: `translate(-50%, -50%) scale(${scale})` };
  } else {
    animationStyles = { transform: "translate(-50%, -50%)" };
  }

  // Progressive fade in
  const opacity = interpolate(frame, [startFrame, startFrame + 15], [0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div style={{
      position: "absolute",
      left: `${element.x}%`,
      top: `${element.y}%`,
      fontSize: `${element.size}px`,
      lineHeight: 1,
      filter: "brightness(0) invert(1) drop-shadow(0 0 20px rgba(255,255,255,0.3))",
      opacity,
      ...animationStyles
    }}>
      {element.emoji}
    </div>
  );
};

// --- Environments ---
const GenericEnvironment: React.FC<{ type: string, theme: any }> = ({ type, theme }) => {
  if (type === "mountain") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        <path d="M0,100 L0,50 L20,30 L45,55 L75,20 L100,45 L100,100 Z" fill="#0c111a" opacity={0.8} />
        <path d="M0,100 L0,60 L30,40 L60,65 L90,35 L100,45 L100,100 Z" fill="#080b12" opacity={0.9} />
        <path d="M0,90 Q40,85 50,75 T100,65" fill="none" stroke="#2a2e38" strokeWidth="8" />
      </svg>
    );
  }
  if (type === "interior") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        <path d="M-10,110 L-10,80 Q50,75 110,80 L110,110 Z" fill="#05070a" />
        <path d="M-10,-10 L15,80 L0,80 L-10,-10 Z" fill="#0a0d14" />
        <path d="M110,-10 L85,80 L100,80 L110,-10 Z" fill="#0a0d14" />
      </svg>
    );
  }
  if (type === "city") {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
        <div style={{ width: "30%", height: "60%", background: "#080a0f" }} />
        <div style={{ width: "40%", height: "80%", background: "#0a0d14" }} />
        <div style={{ width: "20%", height: "50%", background: "#06080c" }} />
      </div>
    );
  }
  // Abstract
  return <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, ${theme.background} 0%, #000 100%)` }} />;
};

// ─── Main Scene ───────────────────────────────────────────────────────────────
export const StoryIllustrationScene: React.FC<{scene: RenderScene; theme: RenderPlan["theme"]}> = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();

  // Read descriptor from director
  const illustration = scene.illustration || {
    atmosphere: ["dust"],
    environment: "abstract",
    elements: []
  };

  const isInterior = illustration.environment === "interior";
  
  // Camera motion
  const zoomFactor = isInterior ? 1.05 : 1.15;
  const cameraScale = interpolate(frame, [0, durationInFrames], [1.0, zoomFactor], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad)
  });
  const panX = interpolate(frame, [0, durationInFrames], [isInterior ? 0 : 10, isInterior ? 0 : -10]);

  return (
    <SceneFrame scene={scene} theme={theme} style={{padding: 0}} hideChrome>
      <div style={{position: "absolute", inset: 0, background: "linear-gradient(180deg, #090b14 0%, #151a28 60%, #05070a 100%)"}} />

      {/* Camera wrapper */}
      <div style={{position: "absolute", inset: -30, scale: cameraScale, translate: `${panX}px 0`, transformOrigin: "50% 50%"}}>
        <GenericEnvironment type={illustration.environment} theme={theme} />
        
        {illustration.elements.map((el: any, idx: number) => (
          <EmojiElement key={idx} element={el} captions={scene.captions} fps={fps} />
        ))}
        
        {illustration.atmosphere.includes("fog") && <FogLayer density={5} color="rgba(200,210,230,0.15)" />}
        {illustration.atmosphere.includes("rain") && <RainLayer density={80} />}
        {illustration.atmosphere.includes("dust") && [1, 3, 5, 7].map(seed => <DustParticle key={seed} frame={frame} seed={seed} accent={theme.accent} />)}
      </div>

      {/* Global Atmosphere */}
      <div style={{position: "absolute", inset: 0, background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 100%)"}} />
      <div style={{position: "absolute", inset: 0, opacity: 0.12, backgroundImage: "repeating-linear-gradient(93deg, transparent 0 8px, rgba(255,255,255,0.02) 9px 10px)"}} aria-hidden="true" />
    </SceneFrame>
  );
};
