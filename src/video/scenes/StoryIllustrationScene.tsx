import React from "react";
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../../director/schema";
import {SceneFrame} from "../SceneFrame";

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.toLowerCase().includes(term));

// ─── Dust particle ────────────────────────────────────────────────────────────
const DustParticle: React.FC<{frame: number; seed: number; accent: string}> = ({frame, seed, accent}) => {
  const speed   = 0.28 + (seed % 7) * 0.06;
  const xBase   = 5 + (seed * 13 % 90);
  const size    = 2 + (seed % 3);
  const xDrift  = Math.sin((frame * speed + seed * 1.7) / 14) * 22;
  const yPos    = 85 - ((frame * speed * 0.9 + seed * 18) % 70);
  const opacity = Math.sin((frame * speed + seed * 2.3) / 18) * 0.18 + 0.08;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left:    `${xBase + xDrift}%`,
        top:     `${yPos}%`,
        width:   size,
        height:  size,
        borderRadius: "50%",
        backgroundColor: seed % 3 === 0 ? accent : "rgba(220,215,230,0.9)",
        opacity,
        filter: "blur(0.5px)",
      }}
    />
  );
};

// ─── Cutout Objects ───────────────────────────────────────────────────────────
const CutoutObject: React.FC<{label: string; color: string; accent: string; index: number; frame: number}> = ({label, color, accent, index, frame}) => {
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
        {[18, 42, 66].map((left, i) => <div key={left} style={{position: "absolute", left, bottom: 18, width: 7, height: 116 - i * 9, borderRadius: 8, backgroundColor: "#8A5A37", border: "2px solid #17151A"}} />)}
        {[20, 44, 68].map((left) => {
          const pulse = Math.sin(frame / 7 + left) * 0.3 + 0.7;
          return <div key={left} style={{position: "absolute", left, top: 38, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#FF6A35", boxShadow: `0 0 ${18 * pulse}px #FF6A35`, opacity: pulse}} />;
        })}
        <div style={{position: "absolute", left: 5, right: 5, bottom: 0, height: 32, borderRadius: "50% 50% 10px 10px", backgroundColor: "#3A2B24", border: "4px solid #17151A"}} />
      </div>
    );
  }

  if (includesAny(lower, ["đèn", "light", "ánh", "lamp", "lantern"])) {
    // Pulsing glow — frame-driven, no CSS animation
    const pulse    = Math.sin(frame / 9 + index) * 0.28 + 0.72;
    const glowSize = 55 + pulse * 30;
    return (
      <div style={{position: "relative", width: 94, height: 130}}>
        {/* lantern body */}
        <div style={{
          position: "absolute", left: 17, top: 28, width: 60, height: 80,
          borderRadius: "10px 10px 30px 30px",
          backgroundColor: "#2E2218", border: "5px solid #17151A",
          boxShadow: `0 0 ${glowSize}px ${accent}${Math.round(pulse * 180).toString(16).padStart(2,"0")}`,
        }} />
        {/* cap */}
        <div style={{position: "absolute", left: 10, top: 16, width: 74, height: 18, borderRadius: "50% 50% 0 0", backgroundColor: "#1A1410", border: "4px solid #17151A"}} />
        {/* hook */}
        <div style={{position: "absolute", left: 42, top: 0, width: 10, height: 22, borderRadius: 8, backgroundColor: "#17151A"}} />
        {/* inner glow */}
        <div style={{position: "absolute", left: 25, top: 40, width: 44, height: 56, borderRadius: "8px 8px 22px 22px", backgroundColor: accent, opacity: pulse * 0.55}} />
      </div>
    );
  }

  if (includesAny(lower, ["khói", "smoke"])) {
    return (
      <div style={{position: "relative", width: 90, height: 160}}>
        {[0, 1, 2].map((i) => {
          const drift = Math.sin((frame + i * 11) / 16) * 12;
          return <div key={i} style={{position: "absolute", left: 18 + i * 22 + drift, bottom: 0, width: 9, height: 125 - i * 16, borderRadius: "50%", borderLeft: `6px solid ${color}88`, rotate: `${i % 2 ? 8 : -8}deg`}} />;
        })}
      </div>
    );
  }

  if (includesAny(lower, ["người", "person", "man", "woman", "nhân vật", "tèo", "bà", "cô gái", "em bé", "child"])) {
    const breathe = Math.sin(frame / 18 + index) * 2;
    return (
      <div style={{position: "relative", width: 110, height: 230}}>
        {/* head */}
        <div style={{position: "absolute", left: 31, top: 0, width: 50, height: 50, borderRadius: "50%", backgroundColor: accent, translate: `0 ${breathe}px`}} />
        {/* body */}
        <div style={{position: "absolute", left: 16, top: 58, width: 80, height: 116, borderRadius: "28px 28px 12px 12px", backgroundColor: color, border: "5px solid #17151A", translate: `0 ${breathe * 0.5}px`}} />
        {/* legs */}
        <div style={{position: "absolute", left: 18, top: 164, width: 25, height: 64, borderRadius: 20, backgroundColor: "#17151A"}} />
        <div style={{position: "absolute", right: 16, top: 164, width: 25, height: 64, borderRadius: 20, backgroundColor: "#17151A"}} />
      </div>
    );
  }

  if (includesAny(lower, ["internet", "mạng", "kết nối", "signal", "network"])) {
    return (
      <div style={{position: "relative", width: 200, height: 150}}>
        {[{x: 82, y: 8}, {x: 18, y: 92}, {x: 150, y: 94}].map((point, pi) => (
          <React.Fragment key={pi}>
            {pi > 0 && <div style={{position: "absolute", left: pi === 1 ? 54 : 104, top: 73, width: 72, height: 5, backgroundColor: color, rotate: pi === 1 ? "-38deg" : "38deg", transformOrigin: "left center"}} />}
            <div style={{position: "absolute", left: point.x, top: point.y, width: 42, height: 42, borderRadius: "50%", backgroundColor: pi === 0 ? accent : color, border: "5px solid #17151A"}} />
          </React.Fragment>
        ))}
      </div>
    );
  }

  return <div style={{width: 115 + index * 10, height: 58, borderRadius: 12, backgroundColor: index % 2 ? accent : color, border: "5px solid #17151A", boxShadow: "8px 10px 0 rgba(0,0,0,0.22)"}} />;
};

// ─── Main Scene ───────────────────────────────────────────────────────────────
export const StoryIllustrationScene: React.FC<{scene: RenderScene; theme: RenderPlan["theme"]}> = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const board = scene.storyboard ?? {
    setting:          "abstract" as const,
    focus:            scene.keywords[0] ?? scene.headline,
    supportingObjects: scene.keywords.slice(1),
    action:           "reveal"   as const,
    camera:           "wide"     as const,
    lighting:         "spotlight" as const,
  };

  // ── Scene-out: fade objects out 0.6 s before end ──────────────────────────
  const outStart = Math.max(0, durationInFrames - Math.round(fps * 0.6));
  const outSpring = spring({fps, frame: frame - outStart, config: {damping: 200}});
  const objectsOpacity = interpolate(outSpring, [0, 1], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  // ── Camera motion ──────────────────────────────────────────────────────────
  const cameraScale = board.camera === "push-in" || board.camera === "close-up"
    ? interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [1, board.camera === "close-up" ? 1.18 : 1.09], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad)})
    : board.camera === "pan"
    ? 1
    : 1;
  const panX = board.camera === "pan"
    ? interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, -28], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
    : 0;

  // ── Parallax layers ─────────────────────────────────────────────────────────
  const parallaxSlow = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [-6, 6], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const parallaxMed  = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [-12, 12], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  // ── Spotlight bloom ────────────────────────────────────────────────────────
  const lightOpacity = interpolate(frame, [0, 16, Math.max(17, durationInFrames - 12), durationInFrames - 1], [0, 0.68, 0.68, 0.2], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  // ── Headline slide-in ──────────────────────────────────────────────────────
  const headlineEnter  = spring({fps, frame: frame - 10, config: {damping: 200}});
  const headlineSlideX = interpolate(headlineEnter, [0, 1], [52, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const headlineOpacity = interpolate(headlineEnter, [0, 1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  // ── Context flags ─────────────────────────────────────────────────────────
  const isInterior = board.setting === "interior" || board.setting === "exterior";
  const isCity     = board.setting === "city"     || board.setting === "archival";
  const storyText  = `${scene.narration} ${scene.visualIntent} ${board.focus} ${board.supportingObjects.join(" ")}`.toLowerCase();
  const isRiver    = includesAny(storyText, ["sông", "bờ", "mặt nước", "river"]);
  const hasWindow  = includesAny(storyText, ["cửa sổ", "rèm", "window", "curtain"]);
  const hasFootprints = includesAny(storyText, ["dấu chân", "footprint"]);
  const hasAltar      = includesAny(storyText, ["bàn thờ", "ảnh cũ", "khung kính", "altar", "portrait"]);
  const isFinale      = includesAny(scene.visualIntent.toLowerCase(), ["phía sau căn nhà", "behind the house"]);
  const scenery  = ["sông", "tre", "rèm", "cửa sổ", "dấu chân", "bàn thờ", "ảnh", "nhà", "phố"];
  const objects  = [board.focus, ...board.supportingObjects].filter((o) => !scenery.includes(o.toLowerCase())).slice(0, 4);

  return (
    <SceneFrame scene={scene} theme={theme} style={{padding: 0}} hideChrome>
      {/* ── Camera wrap ───────────────────────────────────────────────────── */}
      <div style={{position: "absolute", inset: 0, overflow: "hidden", scale: cameraScale, translate: `${panX}px 0`, transformOrigin: "50% 58%"}}>

        {/* ── Sky background (parallax slow) ──────────────────────────────── */}
        <div style={{position: "absolute", inset: 0, translate: `${parallaxSlow * 0.4}px 0`, background: "linear-gradient(180deg, #0B0B12 0%, #171520 62%, #08080D 100%)"}} />

        {/* ── Stars (parallax slow) ────────────────────────────────────────── */}
        <div style={{position: "absolute", inset: 0, translate: `${parallaxSlow * 0.3}px 0`}} aria-hidden="true">
          {[14, 27, 41, 58, 72, 83, 91, 36, 62].map((x, i) => {
            const twinkle = Math.sin(frame / (9 + i * 1.3)) * 0.3 + 0.5;
            return <div key={i} style={{position: "absolute", left: `${x}%`, top: `${4 + (i * 7 % 24)}%`, width: 2 + i % 2, height: 2 + i % 2, borderRadius: "50%", backgroundColor: "white", opacity: twinkle * 0.45}} />;
          })}
        </div>

        {/* ── Film grain ──────────────────────────────────────────────────── */}
        <div style={{position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "repeating-linear-gradient(93deg, transparent 0 8px, rgba(255,255,255,0.025) 9px 10px), repeating-linear-gradient(2deg, transparent 0 11px, rgba(0,0,0,0.18) 12px 13px)"}} aria-hidden="true" />

        {/* ── Particle dust ─────────────────────────────────────────────── */}
        {[1, 3, 5, 7, 11, 13, 17, 19].map((seed) => <DustParticle key={seed} frame={frame} seed={seed} accent={theme.accent} />)}

        {/* ── Setting layer (parallax medium) ─────────────────────────── */}
        <div style={{position: "absolute", inset: 0, translate: `${parallaxMed * 0.6}px 0`}}>
          {isInterior && (
            <>
              <div style={{position: "absolute", left: "5%",  top: "9%",  width: "50%", height: "56%", backgroundColor: "#171824", border: "7px solid #0D0D13", boxShadow: "16px 20px 0 rgba(0,0,0,0.18)"}} />
              <div style={{position: "absolute", left: "21%", top: "22%", width: "29%", height: "43%", backgroundColor: "#2B2425", border: "8px solid #0D0D13"}} />
              <div style={{position: "absolute", left: "45%", top: "42%", width: 32, height: 32, borderRadius: "50%", backgroundColor: theme.accent}} />
            </>
          )}
          {isCity && [0, 1, 2].map((i) => (
            <div key={i} style={{position: "absolute", left: `${4 + i * 31}%`, bottom: "34%", width: `${28 + i * 3}%`, height: `${42 + (i % 2) * 16}%`, backgroundColor: i === 1 ? "#211C28" : "#151620", border: "7px solid #0C0C12", boxShadow: "14px 0 24px rgba(0,0,0,0.28)"}} />
          ))}
          {board.setting === "nature" && (
            <>
              <div style={{position: "absolute", left: "-18%", right: "35%", bottom: "33%", height: "30%", borderRadius: "50% 50% 0 0", backgroundColor: "#17231E", rotate: "-8deg"}} />
              <div style={{position: "absolute", left: "35%", right: "-18%", bottom: "32%", height: "38%", borderRadius: "50% 50% 0 0", backgroundColor: "#22251D", rotate: "7deg"}} />
            </>
          )}
        </div>

        {/* ── River (parallax medium + shimmer) ────────────────────────── */}
        {isRiver && (
          <div style={{position: "absolute", inset: 0, translate: `${parallaxMed * 0.5}px 0`}}>
            <div style={{position: "absolute", left: 0, right: 0, bottom: "29%", height: "32%", background: "linear-gradient(180deg, #101520 0%, #080B11 100%)", borderTop: "5px solid #282A33"}} />
            {/* Shimmer strips */}
            {[0, 1, 2, 3].map((i) => {
              const shimmer = interpolate((frame + i * 5) % 24, [0, 12, 24], [0.05, 0.28, 0.05], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
              return <div key={i} style={{position: "absolute", left: `${8 + i * 9}%`, right: `${18 - i * 3}%`, bottom: `${34 + i * 5}%`, height: 3, borderRadius: 10, backgroundColor: i === 1 ? `${theme.accent}` : "rgba(220,225,235,1)", opacity: shimmer}} />;
            })}
            {/* Bamboo */}
            {[0, 1, 2, 3].map((b) => (
              <div key={b} style={{position: "absolute", left: `${4 + b * 5}%`, bottom: "59%", width: 10, height: 250 + b * 38, borderRadius: 8, backgroundColor: "#171E19", rotate: `${-8 + b * 4}deg`, transformOrigin: "bottom center"}} />
            ))}
            {/* Floating lantern */}
            <div style={{
              position: "absolute",
              left: `${interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [72, isFinale ? 64 : 24], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%`,
              bottom: isFinale ? "48%" : "44%",
              width: 68, height: 68, borderRadius: "50%",
              backgroundColor: theme.accent,
              border: "5px solid #17151A",
              boxShadow: `0 0 ${85 + Math.sin(frame / 8) * 20}px ${theme.accent}CC`,
              opacity: interpolate(frame, [4, 18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
            }} />
          </div>
        )}

        {/* ── House finale ─────────────────────────────────────────────── */}
        {isFinale && (
          <div style={{position: "absolute", left: "18%", right: "18%", bottom: "29%", height: "38%", backgroundColor: "#111117", border: "8px solid #08080C", clipPath: "polygon(0 28%, 50% 0, 100% 28%, 100% 100%, 0 100%)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)"}}>
            <div style={{position: "absolute", left: "40%", bottom: 0, width: "22%", height: "47%", backgroundColor: "#211B20", border: "6px solid #08080C"}} />
            {/* Window glow */}
            <div style={{position: "absolute", left: "42%", bottom: "8%", width: "18%", height: "35%", backgroundColor: theme.accent, opacity: (Math.sin(frame / 9) * 0.15 + 0.35)}} />
          </div>
        )}

        {/* ── Window with animated curtains ────────────────────────────── */}
        {hasWindow && (
          <div style={{position: "absolute", left: "9%", top: "16%", width: "55%", height: "43%", border: "14px solid #17151A", background: `linear-gradient(135deg, #11151F, ${theme.accent}22)`, overflow: "hidden"}}>
            <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: `${interpolate(frame, [0, 30], [8, 48], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%`, backgroundColor: "#29232C", borderRight: "6px solid #17151A"}} />
            <div style={{position: "absolute", right: 0, top: 0, bottom: 0, width: `${interpolate(frame, [0, 30], [8, 48], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%`, backgroundColor: "#29232C", borderLeft: "6px solid #17151A"}} />
          </div>
        )}

        {/* ── Footprints appearing sequentially ────────────────────────── */}
        {hasFootprints && (
          <div style={{position: "absolute", left: "13%", right: "18%", bottom: "30%", height: "38%", rotate: "-14deg"}}>
            {[0, 1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} style={{position: "absolute", left: `${s * 13}%`, bottom: `${s * 10}%`, width: 38, height: 78, borderRadius: "48% 48% 58% 58%", backgroundColor: "rgba(142,174,188,0.42)", rotate: `${s % 2 ? 18 : -18}deg`, opacity: interpolate(frame, [s * 7, s * 7 + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}), boxShadow: "0 0 22px rgba(133,173,190,0.2)"}} />
            ))}
          </div>
        )}

        {/* ── Altar ────────────────────────────────────────────────────── */}
        {hasAltar && (
          <div style={{position: "absolute", left: "22%", right: "22%", bottom: "29%", height: "31%"}}>
            <div style={{position: "absolute", left: "8%", right: "8%", bottom: 0, height: 110, backgroundColor: "#4A2D25", border: "7px solid #17151A"}} />
            <div style={{position: "absolute", left: "31%", top: 0, width: "38%", height: 210, backgroundColor: "#D4CBBB", border: "13px solid #2A1D1C", boxShadow: `0 0 38px ${theme.accent}33`}}>
              <div style={{position: "absolute", left: "33%", top: "20%", width: "34%", height: "26%", borderRadius: "50%", backgroundColor: "#5F5A58"}} />
              <div style={{position: "absolute", left: "25%", right: "25%", top: "46%", bottom: "12%", borderRadius: "40% 40% 0 0", backgroundColor: "#77716D"}} />
              <div style={{position: "absolute", inset: 0, background: `linear-gradient(125deg, transparent 42%, ${theme.accent}44 49%, transparent 56%)`, opacity: interpolate(frame, [0, durationInFrames - 1], [0.15, 0.7], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}} />
            </div>
          </div>
        )}

        {/* ── Ground line ──────────────────────────────────────────────── */}
        <div style={{position: "absolute", left: "-5%", right: "-5%", bottom: "31%", height: 8, backgroundColor: "#34313A", boxShadow: "0 14px 0 #09090D"}} />

        {/* ── Spotlight bloom ──────────────────────────────────────────── */}
        <div style={{position: "absolute", left: "8%", right: "8%", bottom: "15%", height: "28%", borderRadius: "50%", background: `radial-gradient(ellipse, ${theme.accent}3D 0%, ${theme.accent}16 48%, transparent 72%)`, opacity: lightOpacity, filter: "blur(2px)"}} aria-hidden="true" />

        {/* ── Objects (staggered spring + scene-out) ───────────────────── */}
        {!hasFootprints && !hasAltar && !isFinale && (
          <div style={{position: "absolute", left: "9%", right: "9%", bottom: "26%", height: "27%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 22, opacity: objectsOpacity}}>
            {/* Shadow platform */}
            <div style={{position: "absolute", left: "8%", right: "8%", bottom: 8, height: 95, borderRadius: "50%", backgroundColor: "#4A3627", border: "7px solid #111016", boxShadow: "0 20px 34px rgba(0,0,0,0.38)"}} />
            {objects.map((obj, i) => {
              // Each object gets its own stagger spring
              const objEnter = spring({fps, frame: frame - 5 - i * 4, config: {damping: 18, stiffness: 90, mass: 0.8}});
              const objY     = interpolate(objEnter, [0, 1], [190, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)});
              const objScale = interpolate(objEnter, [0, 1], [0.72, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)});
              const floatY   = Math.sin((frame + i * 9) / 12) * 4;
              return (
                <div key={`${obj}-${i}`} style={{position: "relative", zIndex: 2, marginBottom: 46 + (i % 2) * 12, opacity: objEnter, scale: objScale, translate: `0 ${objY + floatY}px`}}>
                  <CutoutObject label={obj} color={theme.foreground} accent={theme.accent} index={i} frame={frame} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Headline ─────────────────────────────────────────────────── */}
        <div style={{position: "absolute", top: "9%", right: "7%", maxWidth: "45%", textAlign: "right", opacity: headlineOpacity, translate: `${headlineSlideX}px 0`}}>
          <div style={{fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -1.5, color: theme.accent, textTransform: "uppercase"}}>{board.focus}</div>
          <div style={{marginTop: 14, fontSize: 24, lineHeight: 1.25, color: theme.muted}}>{scene.headline}</div>
        </div>

      </div>
    </SceneFrame>
  );
};
