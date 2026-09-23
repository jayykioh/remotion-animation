import React from "react";
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../../director/schema";
import {SceneFrame} from "../SceneFrame";

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.toLowerCase().includes(term));

const CutoutObject: React.FC<{label: string; color: string; accent: string; index: number}> = ({label, color, accent, index}) => {
  const lower = label.toLowerCase();
  if (includesAny(lower, ["mâm", "tray"])) {
    return <div style={{width: 220, height: 76, borderRadius: "50%", backgroundColor: "#60442E", border: "6px solid #17151A", boxShadow: "0 12px 0 rgba(0,0,0,0.24)"}} />;
  }
  if (includesAny(lower, ["cháo", "bát", "bowl", "food", "ăn"])) {
    return (
      <div style={{position: "relative", width: 190, height: 110}}>
        <div style={{position: "absolute", inset: "14px 0 auto", height: 54, borderRadius: "50%", backgroundColor: "#F3EEE1", border: "6px solid #1B1818"}} />
        <div style={{position: "absolute", left: 18, right: 18, top: 36, height: 62, borderRadius: "0 0 70px 70px", backgroundColor: "#E7DFD0", border: "6px solid #1B1818", borderTop: 0}} />
      </div>
    );
  }
  if (includesAny(lower, ["hương", "incense"])) {
    return (
      <div style={{position: "relative", width: 92, height: 170}}>
        {[18, 42, 66].map((left, stickIndex) => <div key={left} style={{position: "absolute", left, bottom: 18, width: 7, height: 116 - stickIndex * 9, borderRadius: 8, backgroundColor: "#8A5A37", border: "2px solid #17151A"}} />)}
        {[20, 44, 68].map((left) => <div key={left} style={{position: "absolute", left, top: 38, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#FF6A35", boxShadow: "0 0 18px #FF6A35"}} />)}
        <div style={{position: "absolute", left: 5, right: 5, bottom: 0, height: 32, borderRadius: "50% 50% 10px 10px", backgroundColor: "#3A2B24", border: "4px solid #17151A"}} />
      </div>
    );
  }
  if (includesAny(lower, ["đèn", "light", "ánh"])) {
    return <div style={{width: 94, height: 94, borderRadius: "50%", backgroundColor: accent, border: "6px solid #17151A", boxShadow: `0 0 70px ${accent}88`}} />;
  }
  if (includesAny(lower, ["khói", "smoke"])) {
    return (
      <div style={{position: "relative", width: 90, height: 160}}>
        {[0, 1, 2].map((line) => <div key={line} style={{position: "absolute", left: 18 + line * 22, bottom: 0, width: 9, height: 125 - line * 16, borderRadius: "50%", borderLeft: `6px solid ${color}88`, rotate: `${line % 2 ? 8 : -8}deg`}} />)}
      </div>
    );
  }
  if (includesAny(lower, ["người", "person", "man", "woman", "nhân vật"])) {
    return (
      <div style={{position: "relative", width: 110, height: 230}}>
        <div style={{position: "absolute", left: 31, top: 0, width: 50, height: 50, borderRadius: "50%", backgroundColor: accent}} />
        <div style={{position: "absolute", left: 16, top: 58, width: 80, height: 116, borderRadius: "28px 28px 12px 12px", backgroundColor: color, border: "5px solid #17151A"}} />
        <div style={{position: "absolute", left: 18, top: 164, width: 25, height: 64, borderRadius: 20, backgroundColor: "#17151A"}} />
        <div style={{position: "absolute", right: 16, top: 164, width: 25, height: 64, borderRadius: 20, backgroundColor: "#17151A"}} />
      </div>
    );
  }
  if (includesAny(lower, ["internet", "mạng", "kết nối", "signal", "network"])) {
    return (
      <div style={{position: "relative", width: 200, height: 150}}>
        {[{x: 82, y: 8}, {x: 18, y: 92}, {x: 150, y: 94}].map((point, pointIndex) => (
          <React.Fragment key={pointIndex}>
            {pointIndex > 0 && <div style={{position: "absolute", left: pointIndex === 1 ? 54 : 104, top: 73, width: 72, height: 5, backgroundColor: color, rotate: pointIndex === 1 ? "-38deg" : "38deg", transformOrigin: "left center"}} />}
            <div style={{position: "absolute", left: point.x, top: point.y, width: 42, height: 42, borderRadius: "50%", backgroundColor: pointIndex === 0 ? accent : color, border: "5px solid #17151A"}} />
          </React.Fragment>
        ))}
      </div>
    );
  }
  return (
    <div style={{width: 115 + index * 10, height: 58, borderRadius: 12, backgroundColor: index % 2 ? accent : color, border: "5px solid #17151A", boxShadow: "8px 10px 0 rgba(0,0,0,0.22)"}} />
  );
};

export const StoryIllustrationScene: React.FC<{scene: RenderScene; theme: RenderPlan["theme"]}> = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const board = scene.storyboard || {
    setting: "abstract" as const,
    focus: scene.keywords[0] || scene.headline,
    supportingObjects: scene.keywords.slice(1),
    action: "reveal" as const,
    camera: "wide" as const,
    lighting: "spotlight" as const,
  };
  const enter = spring({fps, frame: frame - 5, config: {damping: 18, stiffness: 90, mass: 0.8}});
  const focusY = interpolate(enter, [0, 1], [190, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const focusScale = interpolate(enter, [0, 1], [0.72, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1), output: "perceptual-scale"});
  const cameraScale = board.camera === "push-in" || board.camera === "close-up"
    ? interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [1, board.camera === "close-up" ? 1.18 : 1.1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
    : 1;
  const lightOpacity = interpolate(frame, [0, 16, Math.max(17, durationInFrames - 12), durationInFrames - 1], [0, 0.68, 0.68, 0.25], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const isInterior = board.setting === "interior" || board.setting === "exterior";
  const isCity = board.setting === "city" || board.setting === "archival";
  const objects = [board.focus, ...board.supportingObjects].slice(0, 4);

  return (
    <SceneFrame scene={scene} theme={theme} style={{padding: 0}} hideChrome>
      <div style={{position: "absolute", inset: 0, overflow: "hidden", scale: cameraScale, transformOrigin: "50% 58%"}}>
        <div style={{position: "absolute", inset: 0, background: "linear-gradient(180deg, #0B0B12 0%, #171520 62%, #08080D 100%)"}} />
        <div style={{position: "absolute", inset: 0, opacity: 0.16, backgroundImage: "repeating-linear-gradient(93deg, transparent 0 8px, rgba(255,255,255,0.025) 9px 10px), repeating-linear-gradient(2deg, transparent 0 11px, rgba(0,0,0,0.18) 12px 13px)"}} />

        {isInterior && (
          <>
            <div style={{position: "absolute", left: "5%", top: "9%", width: "50%", height: "56%", backgroundColor: "#171824", border: "7px solid #0D0D13", boxShadow: "16px 20px 0 rgba(0,0,0,0.18)"}} />
            <div style={{position: "absolute", left: "21%", top: "22%", width: "29%", height: "43%", backgroundColor: "#2B2425", border: "8px solid #0D0D13"}} />
            <div style={{position: "absolute", left: "45%", top: "42%", width: 32, height: 32, borderRadius: "50%", backgroundColor: theme.accent}} />
          </>
        )}
        {isCity && [0, 1, 2].map((item) => (
          <div key={item} style={{position: "absolute", left: `${4 + item * 31}%`, bottom: "34%", width: `${28 + item * 3}%`, height: `${42 + (item % 2) * 16}%`, backgroundColor: item === 1 ? "#211C28" : "#151620", border: "7px solid #0C0C12", boxShadow: "14px 0 24px rgba(0,0,0,0.28)"}} />
        ))}
        {board.setting === "nature" && (
          <>
            <div style={{position: "absolute", left: "-18%", right: "35%", bottom: "33%", height: "30%", borderRadius: "50% 50% 0 0", backgroundColor: "#17231E", rotate: "-8deg"}} />
            <div style={{position: "absolute", left: "35%", right: "-18%", bottom: "32%", height: "38%", borderRadius: "50% 50% 0 0", backgroundColor: "#22251D", rotate: "7deg"}} />
          </>
        )}

        <div style={{position: "absolute", left: "-5%", right: "-5%", bottom: "31%", height: 8, backgroundColor: "#34313A", boxShadow: "0 14px 0 #09090D"}} />
        <div style={{position: "absolute", left: "8%", right: "8%", bottom: "15%", height: "28%", borderRadius: "50%", background: `radial-gradient(ellipse, ${theme.accent}3D 0%, ${theme.accent}16 48%, transparent 72%)`, opacity: lightOpacity, filter: "blur(2px)"}} />

        <div style={{position: "absolute", left: "9%", right: "9%", bottom: "26%", height: "27%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 22, opacity: enter, translate: `0 ${focusY}px`, scale: focusScale}}>
          <div style={{position: "absolute", left: "8%", right: "8%", bottom: 8, height: 95, borderRadius: "50%", backgroundColor: "#4A3627", border: "7px solid #111016", boxShadow: "0 20px 34px rgba(0,0,0,0.38)"}} />
          {objects.map((object, index) => (
            <div key={`${object}-${index}`} style={{position: "relative", zIndex: 2, marginBottom: 46 + (index % 2) * 12, translate: `0 ${Math.sin((frame + index * 9) / 12) * 4}px`}}>
              <CutoutObject label={object} color={theme.foreground} accent={theme.accent} index={index} />
            </div>
          ))}
        </div>

        <div style={{position: "absolute", top: "9%", right: "7%", maxWidth: "45%", textAlign: "right", opacity: interpolate(frame, [10, 24], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), translate: `${interpolate(frame, [10, 24], [45, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px 0`}}>
          <div style={{fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -1.5, color: theme.accent, textTransform: "uppercase"}}>{board.focus}</div>
          <div style={{marginTop: 14, fontSize: 24, lineHeight: 1.25, color: theme.muted}}>{scene.headline}</div>
        </div>
      </div>
    </SceneFrame>
  );
};
