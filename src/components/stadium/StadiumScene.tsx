"use client";

import { useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(MotionPathPlugin);
}

// ── Kit / skin palette ────────────────────────────────────────
const SKIN      = "#C4855A";
const SKIN_D    = "#A0683A";
const HAIR      = "#1a1208";
const KIT_DARK  = "#0c1624";
const KIT_MID   = "#111d30";
const KIT_GREEN = "#55c878";
const SOCK      = "#dde8f0";
const BOOT      = "#111111";

// ── Player origin in SVG viewBox ─────────────────────────────
// Player group: translate(570, 775). y=0 = ground.
// All joints expressed as SVG-root coordinates for svgOrigin.
const PX = 570; // player x root
const PY = 775; // player y root (feet)

const JOINTS = {
  rHip:      [PX + 10,  PY - 112] as [number, number],
  rKnee:     [PX + 10,  PY - 57 ] as [number, number],
  rAnkle:    [PX + 14,  PY - 9  ] as [number, number],
  lHip:      [PX - 10,  PY - 112] as [number, number],
  lKnee:     [PX - 10,  PY - 57 ] as [number, number],
  lAnkle:    [PX - 14,  PY - 9  ] as [number, number],
  rShoulder: [PX + 22,  PY - 192] as [number, number],
  rElbow:    [PX + 22,  PY - 154] as [number, number],
  lShoulder: [PX - 22,  PY - 192] as [number, number],
  lElbow:    [PX - 22,  PY - 154] as [number, number],
  torso:     [PX,       PY - 112] as [number, number],
  head:      [PX + 3,   PY - 192] as [number, number],
};

// Ball start position in SVG
const BALL_X = 650;
const BALL_Y = 768;

export function StadiumScene() {
  // ── Refs ────────────────────────────────────────────────────
  const playerGroupRef   = useRef<SVGGElement>(null);
  const torsoRef         = useRef<SVGGElement>(null);
  const headRef          = useRef<SVGGElement>(null);
  const rThighRef        = useRef<SVGGElement>(null);
  const rShinRef         = useRef<SVGGElement>(null);
  const rFootRef         = useRef<SVGGElement>(null);
  const lThighRef        = useRef<SVGGElement>(null);
  const lShinRef         = useRef<SVGGElement>(null);
  const lFootRef         = useRef<SVGGElement>(null);
  const rArmRef          = useRef<SVGGElement>(null);
  const rForearmRef      = useRef<SVGGElement>(null);
  const lArmRef          = useRef<SVGGElement>(null);
  const lForearmRef      = useRef<SVGGElement>(null);
  const ballRef          = useRef<SVGGElement>(null);
  const netRef           = useRef<SVGGElement>(null);
  const idleTlRef        = useRef<gsap.core.Timeline | null>(null);

  const pathname = usePathname();

  // ── Helpers ─────────────────────────────────────────────────
  const allJoints = useCallback(() => [
    rThighRef, rShinRef, rFootRef,
    lThighRef, lShinRef, lFootRef,
    rArmRef, rForearmRef, lArmRef, lForearmRef,
    torsoRef, headRef,
  ].map(r => r.current).filter(Boolean), []);

  const resetPose = useCallback(() => {
    if (idleTlRef.current) { idleTlRef.current.kill(); idleTlRef.current = null; }
    gsap.killTweensOf(allJoints());
    gsap.killTweensOf([playerGroupRef.current, ballRef.current, netRef.current]);
    gsap.set(allJoints(), { rotation: 0 });
    gsap.set(playerGroupRef.current, { x: 0, y: 0 });
    gsap.set(ballRef.current, { x: BALL_X, y: BALL_Y, rotation: 0 });
    gsap.set(netRef.current, { x: 0, y: 0 });
  }, [allJoints]);

  // ── Idle breathing ──────────────────────────────────────────
  const playIdle = useCallback(() => {
    resetPose();
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(torsoRef.current, { rotation: 1.5, duration: 1.8, ease: "sine.inOut" }, 0)
      .to(headRef.current,  { rotation: -2,  duration: 2.3, ease: "sine.inOut" }, 0.4)
      .to(rArmRef.current,  { rotation:  4,  duration: 2.0, ease: "sine.inOut" }, 0)
      .to(lArmRef.current,  { rotation: -4,  duration: 2.0, ease: "sine.inOut" }, 0);
    idleTlRef.current = tl;
  }, [resetPose]);

  // ── Walk-on (auth) ──────────────────────────────────────────
  const playWalkOn = useCallback(() => {
    resetPose();
    gsap.set(playerGroupRef.current, { x: -220 });
    const tl = gsap.timeline({ onComplete: () => playIdle() });
    tl.to(playerGroupRef.current, { x: 0, duration: 1.2, ease: "power2.out" })
      .to(rThighRef.current, { rotation: -25, duration: 0.25, ease: "power1.inOut", yoyo: true, repeat: 3 }, 0)
      .to(lThighRef.current, { rotation:  25, duration: 0.25, ease: "power1.inOut", yoyo: true, repeat: 3 }, 0)
      .to(rArmRef.current,   { rotation:  20, duration: 0.25, ease: "power1.inOut", yoyo: true, repeat: 3 }, 0)
      .to(lArmRef.current,   { rotation: -20, duration: 0.25, ease: "power1.inOut", yoyo: true, repeat: 3 }, 0);
  }, [resetPose, playIdle]);

  // ── Strike (picks dashboard) ─────────────────────────────────
  const playStrike = useCallback((goalPath: string) => {
    resetPose();
    const tl = gsap.timeline({ onComplete: () => playIdle() });

    // Phase 1: run up (lean + small shift right)
    tl.to(torsoRef.current,       { rotation: -12, duration: 0.28, ease: "power2.in" }, 0)
      .to(playerGroupRef.current, { x: 28,         duration: 0.4,  ease: "power2.out"}, 0)
      .to(rThighRef.current,      { rotation: -30, duration: 0.25, ease: "power2.out"}, 0)
      .to(rShinRef.current,       { rotation:  30, duration: 0.25                    }, 0)
      .to(lThighRef.current,      { rotation:  18, duration: 0.25                    }, 0)
      .to(rArmRef.current,        { rotation:  35, duration: 0.22                    }, 0)
      .to(lArmRef.current,        { rotation: -28, duration: 0.22                    }, 0)

    // Phase 2: wind-up
      .to(rThighRef.current, { rotation: -52, duration: 0.22, ease: "power3.in"    }, 0.3)
      .to(rShinRef.current,  { rotation: -38, duration: 0.22                       }, 0.3)
      .to(lThighRef.current, { rotation:  14, duration: 0.2                        }, 0.3)
      .to(torsoRef.current,  { rotation: -6,  duration: 0.2                        }, 0.3)
      .to(rArmRef.current,   { rotation:  42, duration: 0.2                        }, 0.3)
      .to(lArmRef.current,   { rotation: -35, duration: 0.2                        }, 0.3)

    // Phase 3: STRIKE — fast
      .to(rThighRef.current, { rotation: 62,  duration: 0.14, ease: "power4.out"   }, 0.52)
      .to(rShinRef.current,  { rotation: 12,  duration: 0.14, ease: "power3.out"   }, 0.52)
      .to(torsoRef.current,  { rotation: -18, duration: 0.14                       }, 0.52)
      .to(rArmRef.current,   { rotation: -22, duration: 0.14                       }, 0.52)
      .to(lArmRef.current,   { rotation:  18, duration: 0.14                       }, 0.52)

    // Ball launches simultaneously with strike contact
      .to(ballRef.current, {
          motionPath: {
            path: goalPath,
            align: "self",
            alignOrigin: [0.5, 0.5],
          },
          duration: 0.85,
          ease: "power2.out",
        }, 0.55)
      .to(ballRef.current, { rotation: 900, duration: 0.85, ease: "none" }, 0.55)

    // Phase 4: follow-through
      .to(rThighRef.current, { rotation: 50, duration: 0.2                        }, 0.67)
      .to(rShinRef.current,  { rotation: 25, duration: 0.2                        }, 0.67)

    // Phase 5: recover
      .to(allJoints(), { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.8)" }, 1.1)
      .to(playerGroupRef.current, { x: 0, duration: 0.5, ease: "power2.inOut"    }, 1.1);

    idleTlRef.current = null;
  }, [resetPose, playIdle, allJoints]);

  // ── Goal celebration (pricing) ───────────────────────────────
  const playGoal = useCallback(() => {
    resetPose();
    const tl = gsap.timeline({ onComplete: () => playIdle() });

    // Kick into top-right corner
    tl.to(torsoRef.current,       { rotation: -14, duration: 0.14, ease: "power4.out"}, 0)
      .to(rThighRef.current,      { rotation: 60,  duration: 0.14, ease: "power4.out"}, 0)
      .to(rShinRef.current,       { rotation: 10,  duration: 0.14                    }, 0)

    // Ball into top-right corner
      .to(ballRef.current, {
          motionPath: {
            path: `M ${BALL_X} ${BALL_Y} C 760 540 870 400 1082 443`,
            align: "self",
            alignOrigin: [0.5, 0.5],
          },
          duration: 0.9,
          ease: "power2.out",
        }, 0.05)
      .to(ballRef.current, { rotation: 1080, duration: 0.9, ease: "none" }, 0.05)

    // Net jiggles on impact
      .to(netRef.current, { x: 6, y: 4, duration: 0.08, ease: "power4.out" }, 0.92)
      .to(netRef.current, { x: 0, y: 0, duration: 0.5,  ease: "elastic.out(1, 0.3)"}, 1.0)

    // Celebration
      .to(rArmRef.current,        { rotation: -100, duration: 0.35, ease: "back.out(2)"}, 0.9)
      .to(lArmRef.current,        { rotation:  100, duration: 0.35, ease: "back.out(2)"}, 0.9)
      .to(rForearmRef.current,    { rotation: -40,  duration: 0.3                      }, 0.95)
      .to(lForearmRef.current,    { rotation:  40,  duration: 0.3                      }, 0.95)
      .to(headRef.current,        { rotation: -15,  duration: 0.3, ease: "back.out"    }, 0.9)
      .to(torsoRef.current,       { rotation: -18,  duration: 0.3                      }, 0.9)
      .to(playerGroupRef.current, { y: -22,         duration: 0.28, ease: "power2.out" }, 0.9)
      .to(playerGroupRef.current, { y: 0,           duration: 0.35, ease: "bounce.out" }, 1.18);
  }, [resetPose, playIdle]);

  // ── Near miss (results) ──────────────────────────────────────
  const playNearMiss = useCallback(() => {
    resetPose();
    const tl = gsap.timeline({ onComplete: () => playIdle() });

    // Kick
    tl.to(rThighRef.current, { rotation: 58, duration: 0.14, ease: "power4.out" }, 0)
      .to(rShinRef.current,  { rotation: 8,  duration: 0.14                     }, 0)
      .to(torsoRef.current,  { rotation: -14, duration: 0.14                    }, 0)

    // Ball hits crossbar and bounces back
      .to(ballRef.current, {
          motionPath: {
            path: `M ${BALL_X} ${BALL_Y} C 770 530 870 410 1015 438`,
            align: "self",
            alignOrigin: [0.5, 0.5],
          },
          duration: 0.7,
          ease: "power2.out",
        }, 0.05)
      .to(ballRef.current, { rotation: 720, duration: 0.7, ease: "none" }, 0.05)
      // bounce back
      .to(ballRef.current, {
          motionPath: {
            path: "M 1015 438 C 900 350 750 500 620 600",
            align: "self",
            alignOrigin: [0.5, 0.5],
          },
          duration: 0.55,
          ease: "power1.out",
        }, 0.76)

    // Hands on head reaction
      .to(rArmRef.current,   { rotation: -80, duration: 0.3, ease: "back.out"}, 0.8)
      .to(lArmRef.current,   { rotation:  80, duration: 0.3, ease: "back.out"}, 0.8)
      .to(headRef.current,   { rotation:  10, duration: 0.3                  }, 0.85)
      .to(torsoRef.current,  { rotation:  5,  duration: 0.3                  }, 0.85);
  }, [resetPose, playIdle]);

  // ── Init: set svgOrigins once ────────────────────────────────
  useEffect(() => {
    const setOrigin = (ref: React.RefObject<SVGGElement | null>, [x, y]: [number, number]) => {
      if (ref.current) gsap.set(ref.current, { svgOrigin: `${x} ${y}` });
    };
    setOrigin(rThighRef,   JOINTS.rHip);
    setOrigin(rShinRef,    JOINTS.rKnee);
    setOrigin(rFootRef,    JOINTS.rAnkle);
    setOrigin(lThighRef,   JOINTS.lHip);
    setOrigin(lShinRef,    JOINTS.lKnee);
    setOrigin(lFootRef,    JOINTS.lAnkle);
    setOrigin(rArmRef,     JOINTS.rShoulder);
    setOrigin(rForearmRef, JOINTS.rElbow);
    setOrigin(lArmRef,     JOINTS.lShoulder);
    setOrigin(lForearmRef, JOINTS.lElbow);
    setOrigin(torsoRef,    JOINTS.torso);
    setOrigin(headRef,     JOINTS.head);

    // Set ball starting position via GSAP (not SVG attr)
    if (ballRef.current) gsap.set(ballRef.current, { x: BALL_X, y: BALL_Y });

    playIdle();
    return () => { idleTlRef.current?.kill(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Route-driven animation ───────────────────────────────────
  useEffect(() => {
    const DASHBOARD_PATH = `M ${BALL_X} ${BALL_Y} C 740 590 900 440 1018 478`;
    if (pathname === "/") {
      playIdle();
    } else if (pathname === "/dashboard") {
      playStrike(DASHBOARD_PATH);
    } else if (pathname === "/pricing") {
      playGoal();
    } else if (pathname === "/results") {
      playNearMiss();
    } else if (pathname?.startsWith("/auth")) {
      playWalkOn();
    } else {
      playIdle();
    }
  }, [pathname, playIdle, playStrike, playGoal, playNearMiss, playWalkOn]);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sky */}
          <radialGradient id="sp-sky" cx="50%" cy="15%" r="75%">
            <stop offset="0%"   stopColor="#0d2040" />
            <stop offset="55%"  stopColor="#071428" />
            <stop offset="100%" stopColor="#05080F" />
          </radialGradient>

          {/* Floodlight beams */}
          <radialGradient id="sp-flood-l" cx="0%" cy="0%" r="100%">
            <stop offset="0%"   stopColor="#fffde8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#fffde8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sp-flood-r" cx="100%" cy="0%" r="100%">
            <stop offset="0%"   stopColor="#fffde8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#fffde8" stopOpacity="0" />
          </radialGradient>

          {/* Pitch */}
          <linearGradient id="sp-pitch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1a5228" />
            <stop offset="100%" stopColor="#224f2c" />
          </linearGradient>
          <pattern id="sp-mow" x="0" y="0" width="90" height="900" patternUnits="userSpaceOnUse">
            <rect width="45" height="900" fill="#1e5c30" />
            <rect x="45" width="45" height="900" fill="#1a5228" />
          </pattern>

          {/* Net crosshatch */}
          <pattern id="sp-net" x="0" y="0" width="9" height="9" patternUnits="userSpaceOnUse">
            <path d="M0 0 L9 9 M9 0 L0 9" stroke="rgba(210,225,220,0.45)" strokeWidth="0.9" />
          </pattern>

          {/* Ball glow */}
          <filter id="sp-ball-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Player shadow */}
          <radialGradient id="sp-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>

          {/* Crowd blur */}
          <filter id="sp-crowd-blur">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>

          {/* Atmosphere haze */}
          <radialGradient id="sp-haze" cx="50%" cy="60%" r="60%">
            <stop offset="0%"   stopColor="#1a3a5c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1a3a5c" stopOpacity="0" />
          </radialGradient>

          {/* Pitch clip */}
          <clipPath id="sp-pitch-clip">
            <path d="M -60 905 L 1500 905 L 1210 448 L 230 448 Z" />
          </clipPath>

          {/* ── Depth shading gradients for player ── */}
          {/* Cylindrical shading for kit (edges dark, centre catches floodlight) */}
          <linearGradient id="sp-cyl-kit" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(0,0,0,0.45)" />
            <stop offset="28%"  stopColor="rgba(90,160,255,0.07)" />
            <stop offset="52%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
          </linearGradient>
          {/* Cylindrical shading for skin */}
          <linearGradient id="sp-cyl-skin" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(80,40,20,0.35)" />
            <stop offset="28%"  stopColor="rgba(255,190,140,0.18)" />
            <stop offset="52%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(80,40,20,0.45)" />
          </linearGradient>
          {/* Top-down floodlight: brighter at top, shadow at bottom */}
          <linearGradient id="sp-top-lit" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="rgba(180,220,255,0.1)" />
            <stop offset="45%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
          </linearGradient>
        </defs>

        {/* ── Sky ─────────────────────────────────────────── */}
        <rect width="1440" height="900" fill="url(#sp-sky)" />

        {/* Stars */}
        {([
          [135,52],[310,28],[490,75],[680,18],[840,60],[1020,32],[1180,55],[1360,22],
          [210,118],[400,92],[600,140],[780,105],[960,125],[1140,88],[1400,130],
          [75,182],[280,155],[460,200],[700,168],[900,190],[1090,162],[1310,205],
          [160,238],[380,218],[560,250],[760,230],[950,245],[1160,222],[1420,240],
          [50,295],[230,278],[450,308],[660,290],[880,300],[1060,282],[1280,312],
          [340,345],[630,340],[860,350],[1100,338],
        ] as [number,number][]).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 5 === 0 ? 1.6 : 1} fill="white" opacity={i % 3 === 0 ? 0.7 : 0.4} />
        ))}

        {/* ── Far-end stand (behind goal) ──────────────────── */}
        <path d="M 228 0 L 1212 0 L 1212 448 L 228 448 Z" fill="#090d1c" />
        {/* Far stand tiers */}
        {[20, 58, 96, 134, 172, 210, 248, 286, 324, 365, 405].map((y, i) => (
          <rect key={i} x={240 + i * 18} y={y} width={960 - i * 36} height={6} rx={2} fill="#131c30" opacity={0.9} />
        ))}

        {/* Far stand crowd (filtered/blurred for depth) */}
        <g filter="url(#sp-crowd-blur)">
          {(Array.from({ length: 80 }) as unknown[]).map((_, i) => {
            const col = i % 20;
            const row = Math.floor(i / 20);
            const cx = 270 + col * 46 + (row % 2) * 23;
            const cy = 340 + row * 26;
            const colors = ["#e8e8e8","#2a5c1a","#cc2020","#55c878","#ffffff","#0a2455","#e0c030","#cc6600"];
            const c = colors[i % colors.length];
            return (
              <g key={i}>
                <circle cx={cx} cy={cy - 10} r={7} fill={c} opacity={0.65} />
                <rect x={cx - 8} y={cy - 4} width={16} height={18} rx={4} fill={c} opacity={0.5} />
              </g>
            );
          })}
        </g>

        {/* ── Left stand ───────────────────────────────────── */}
        <path d="M 0 0 L 0 640 L 260 540 L 310 420 L 270 190 L 170 40 Z" fill="#080c1a" />
        {/* Tier lines */}
        {[50,95,140,185,230,275,320,370,420,470].map((y, i) => (
          <path key={i}
            d={`M ${15 + i*8} ${y} Q ${90+i*10} ${y+6} ${200+i*6} ${y+2}`}
            stroke="#151f35" strokeWidth={7} fill="none" opacity={0.9}
          />
        ))}
        {/* Left crowd */}
        <g filter="url(#sp-crowd-blur)">
          {(Array.from({ length: 35 }) as unknown[]).map((_, i) => {
            const row = Math.floor(i / 7);
            const col = i % 7;
            const cx = 18 + row * 28 + col * 14;
            const cy = 100 + col * 30 + row * 5;
            const colors = ["#e8e8e8","#55c878","#cc2020","#fff","#2255cc"];
            return (
              <g key={i} opacity={0.55}>
                <circle cx={cx} cy={cy - 8} r={6} fill={colors[i%colors.length]} />
                <rect x={cx-7} y={cy-3} width={14} height={17} rx={3} fill={colors[i%colors.length]} opacity={0.8} />
              </g>
            );
          })}
        </g>

        {/* ── Right stand ──────────────────────────────────── */}
        <path d="M 1440 0 L 1440 640 L 1180 540 L 1130 420 L 1170 190 L 1270 40 Z" fill="#080c1a" />
        {[50,95,140,185,230,275,320,370,420,470].map((y, i) => (
          <path key={i}
            d={`M ${1425-i*8} ${y} Q ${1350-i*10} ${y+6} ${1240-i*6} ${y+2}`}
            stroke="#151f35" strokeWidth={7} fill="none" opacity={0.9}
          />
        ))}
        <g filter="url(#sp-crowd-blur)">
          {(Array.from({ length: 35 }) as unknown[]).map((_, i) => {
            const row = Math.floor(i / 7);
            const col = i % 7;
            const cx = 1422 - row * 28 - col * 14;
            const cy = 100 + col * 30 + row * 5;
            const colors = ["#e8e8e8","#55c878","#cc2020","#fff","#2255cc"];
            return (
              <g key={i} opacity={0.55}>
                <circle cx={cx} cy={cy - 8} r={6} fill={colors[i%colors.length]} />
                <rect x={cx-7} y={cy-3} width={14} height={17} rx={3} fill={colors[i%colors.length]} opacity={0.8} />
              </g>
            );
          })}
        </g>

        {/* ── Floodlight towers ────────────────────────────── */}
        {/* Top-left */}
        <rect x="2" y="0" width="18" height="290" rx="4" fill="#141f36" />
        <rect x="-18" y="282" width="56" height="12" rx="3" fill="#1e2d48" />
        {/* Beam */}
        <path d="M 11 290 L 550 905 L 0 905 Z" fill="url(#sp-flood-l)" opacity="0.07" />
        {/* Top-right */}
        <rect x="1420" y="0" width="18" height="290" rx="4" fill="#141f36" />
        <rect x="1402" y="282" width="56" height="12" rx="3" fill="#1e2d48" />
        <path d="M 1429 290 L 890 905 L 1440 905 Z" fill="url(#sp-flood-r)" opacity="0.06" />

        {/* ── Pitch surface ─────────────────────────────────── */}
        <path d="M -60 905 L 1500 905 L 1210 448 L 230 448 Z" fill="url(#sp-pitch)" />
        <path d="M -60 905 L 1500 905 L 1210 448 L 230 448 Z" fill="url(#sp-mow)" opacity={0.38} />

        {/* Pitch markings */}
        {/* Touchlines */}
        <path d="M 230 448 L -60 905" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" opacity="0.45" />
        <path d="M 1210 448 L 1500 905" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" opacity="0.45" />
        {/* Goal line */}
        <path d="M 230 448 L 1210 448" stroke="rgba(255,255,255,0.55)" strokeWidth="2" opacity="0.45" />
        {/* Halfway line */}
        <path d="M 720 905 L 720 448" stroke="rgba(255,255,255,0.6)" strokeWidth="2" opacity="0.4" />
        {/* Centre circle */}
        <ellipse cx="720" cy="730" rx="130" ry="44" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" opacity="0.4" />
        {/* Centre spot */}
        <circle cx="720" cy="730" r="5" fill="rgba(255,255,255,0.6)" opacity="0.4" />
        {/* Far penalty area */}
        <path d="M 870 448 L 845 520 L 1155 520 L 1130 448" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" opacity="0.35" />
        {/* Near penalty area */}
        <path d="M 340 905 L 372 670 L 680 670 L 712 905" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" opacity="0.35" />
        {/* Near 6-yard box */}
        <path d="M 440 905 L 456 790 L 596 790 L 612 905" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" opacity="0.3" />
        {/* Free kick spot */}
        <circle cx={BALL_X} cy={BALL_Y - 8} r={5} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" opacity="0.5" />

        {/* Atmosphere haze overlay */}
        <rect width="1440" height="900" fill="url(#sp-haze)" />

        {/* ── Goal ──────────────────────────────────────────── */}
        {/* Positioned at far end, perspective-scaled */}
        <g>
          {/* Net */}
          <g ref={netRef}>
            <rect x="952" y="440" width="136" height="62" fill="url(#sp-net)" opacity="0.55" />
            {/* Back net shading */}
            <rect x="952" y="440" width="136" height="62" fill="rgba(0,0,0,0.1)" />
          </g>
          {/* Left post */}
          <rect x="948" y="437" width="5" height="65" rx="2" fill="#c8d4cc" />
          <rect x="950" y="437" width="2" height="65" fill="rgba(255,255,255,0.5)" rx="1" />
          {/* Right post */}
          <rect x="1087" y="437" width="5" height="65" rx="2" fill="#c8d4cc" />
          <rect x="1089" y="437" width="2" height="65" fill="rgba(255,255,255,0.5)" rx="1" />
          {/* Crossbar */}
          <rect x="948" y="434" width="144" height="5" rx="2" fill="#c8d4cc" />
          <rect x="948" y="434" width="144" height="2" fill="rgba(255,255,255,0.5)" rx="1" />
          {/* Goal-line shadow */}
          <rect x="948" y="500" width="144" height="2" fill="rgba(255,255,255,0.35)" />
        </g>

        {/* ── Player shadow ─────────────────────────────────── */}
        <ellipse cx={PX + 4} cy={PY - 1} rx={38} ry={11} fill="url(#sp-shadow)" opacity="0.65" />

        {/* ══ PLAYER ══════════════════════════════════════════ */}
        {/*
            Group origin: (PX=570, PY=775) = feet on pitch.
            All body parts use organic bezier paths — no rects.
            Render order: back→front (right arm, right leg, torso, left leg, left arm, head).
        */}
        <g ref={playerGroupRef} transform={`translate(${PX}, ${PY})`}>

          {/* ── Back arm (right) ── */}
          <g ref={rArmRef} transform="translate(22, -192)">
            {/* Upper arm: deltoid tapers to elbow */}
            <path d="M -7 2 C -9 14 -8 26 -6 38 L 6 38 C 8 26 9 14 7 2 C 3 -2 -3 -2 -7 2 Z" fill={KIT_DARK} />
            <path d="M -7 2 C -9 14 -8 26 -6 38 L 6 38 C 8 26 9 14 7 2 C 3 -2 -3 -2 -7 2 Z" fill="url(#sp-cyl-kit)" />
            <g ref={rForearmRef} transform="translate(0, 38)">
              {/* Forearm: tapers from elbow to wrist */}
              <path d="M -6 1 C -7 11 -6 22 -5 30 L 5 30 C 7 22 7 11 6 1 C 3 -1 -3 -1 -6 1 Z" fill={SKIN} />
              <path d="M -6 1 C -7 11 -6 22 -5 30 L 5 30 C 7 22 7 11 6 1 C 3 -1 -3 -1 -6 1 Z" fill="url(#sp-cyl-skin)" />
              {/* Hand (closed fist) */}
              <path d="M -5 30 C -7 33 -6 38 -2 39 C 1 40 6 38 8 35 C 9 32 8 30 5 30 Z" fill={SKIN_D} />
              <path d="M -1 32 L 0 36 M 2 32 L 3 37 M 4 32 L 5 36" stroke={SKIN_D} strokeWidth="0.7" opacity="0.5" strokeLinecap="round" />
            </g>
          </g>

          {/* ── Back leg (right) ── */}
          <g ref={rThighRef} transform="translate(10, -112)">
            {/* Thigh: wide at hip, quadriceps curve on outer side, narrows to knee */}
            <path d="M -11 2 C -13 20 -12 40 -10 55 L 9 55 C 13 40 14 20 11 2 C 6 -2 -6 -2 -11 2 Z" fill={KIT_DARK} />
            <path d="M -11 2 C -13 20 -12 40 -10 55 L 9 55 C 13 40 14 20 11 2 C 6 -2 -6 -2 -11 2 Z" fill="url(#sp-cyl-kit)" />
            <path d="M -11 2 C -13 20 -12 40 -10 55 L 9 55 C 13 40 14 20 11 2 C 6 -2 -6 -2 -11 2 Z" fill="url(#sp-top-lit)" />
            {/* Shorts hem */}
            <path d="M -10 50 C -6 58 6 58 10 50" stroke={KIT_GREEN} strokeWidth="2.5" fill="none" opacity="0.55" strokeLinecap="round" />
            {/* Crease lines */}
            <path d="M 0 10 C 2 30 2 45 1 55" stroke="rgba(0,0,0,0.12)" strokeWidth="1" fill="none" strokeLinecap="round" />

            <g ref={rShinRef} transform="translate(0, 55)">
              {/* Calf: narrow at knee, gastrocnemius belly, tapers to ankle */}
              <path d="M -7 2 C -9 15 -10 30 -8 48 L 7 48 C 10 30 12 16 8 2 C 5 -1 -4 -1 -7 2 Z" fill={SOCK} />
              <path d="M -7 2 C -9 15 -10 30 -8 48 L 7 48 C 10 30 12 16 8 2 C 5 -1 -4 -1 -7 2 Z" fill="url(#sp-cyl-kit)" opacity="0.35" />
              {/* Shin guard */}
              <path d="M -5 5 C -6 10 -6 22 -4 28 L 4 28 C 6 22 6 10 5 5 Z" fill="#a8b8c5" opacity="0.55" />
              <path d="M -4 6 L 3 6 C 4 8 4 10 3 12 L -4 12 Z" fill="rgba(255,255,255,0.15)" />

              <g ref={rFootRef} transform="translate(4, 48)">
                {/* Modern football boot — toe points right (+x) */}
                <path d="M -6 -3 C -9 0 -10 5 -8 10 C -4 13 6 13 18 10 C 23 8 24 4 22 0 C 18 -5 10 -6 4 -5 C 0 -5 -3 -4 -6 -3 Z" fill={BOOT} />
                {/* Boot upper (slightly lighter highlight) */}
                <path d="M -4 -3 C 2 -6 14 -5 22 0 C 18 -5 10 -6 4 -5 C 0 -5 -2 -4 -4 -3 Z" fill="rgba(255,255,255,0.08)" />
                {/* Toe box gloss */}
                <path d="M 15 -2 C 18 -3 22 0 22 0 C 21 2 18 2 15 1 Z" fill="rgba(255,255,255,0.16)" />
                {/* Ankle collar (sock peeks out) */}
                <path d="M -6 -4 C -3 -7 4 -8 10 -6 C 6 -5 0 -5 -6 -4 Z" fill={SOCK} opacity="0.6" />
                {/* Green brand tab */}
                <rect x="-7" y="-8" width="8" height="5" rx="2" fill={KIT_GREEN} opacity="0.9" />
                {/* Studs */}
                <circle cx="2" cy="12" r="1.5" fill="#080808" /><circle cx="9" cy="12" r="1.5" fill="#080808" /><circle cx="16" cy="11" r="1.5" fill="#080808" />
              </g>
            </g>
          </g>

          {/* ── Torso ── */}
          <g ref={torsoRef} transform="translate(0, -112)">
            {/* Shirt: V-taper — wide shoulders, slight waist, flared hips */}
            <path d="M -20 0 C -22 -28 -21 -56 -17 -77 C -14 -85 -8 -90 -1 -90 L 1 -90 C 8 -90 14 -85 17 -77 C 21 -56 22 -28 20 0 C 13 3 -13 3 -20 0 Z" fill={KIT_DARK} />
            <path d="M -20 0 C -22 -28 -21 -56 -17 -77 C -14 -85 -8 -90 -1 -90 L 1 -90 C 8 -90 14 -85 17 -77 C 21 -56 22 -28 20 0 C 13 3 -13 3 -20 0 Z" fill="url(#sp-cyl-kit)" />
            <path d="M -20 0 C -22 -28 -21 -56 -17 -77 C -14 -85 -8 -90 -1 -90 L 1 -90 C 8 -90 14 -85 17 -77 C 21 -56 22 -28 20 0 C 13 3 -13 3 -20 0 Z" fill="url(#sp-top-lit)" />
            {/* Collar */}
            <path d="M -5 -90 Q 0 -96 5 -90 Q 2 -93 -2 -93 Z" fill={KIT_MID} />
            {/* Green chest band */}
            <path d="M -17 -70 C -11 -68 11 -68 17 -70 L 17 -62 C 11 -60 -11 -60 -17 -62 Z" fill={KIT_GREEN} opacity="0.65" />
            {/* Kit number */}
            <text x="0" y="-44" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="var(--font-sans), sans-serif" fill="rgba(85,200,120,0.38)" letterSpacing="2">10</text>
            {/* Shoulder seams */}
            <path d="M -17 -77 C -19 -70 -20 -64 -20 -58" stroke={KIT_MID} strokeWidth="1.1" fill="none" opacity="0.4" strokeLinecap="round" />
            <path d="M 17 -77 C 19 -70 20 -64 20 -58"  stroke={KIT_MID} strokeWidth="1.1" fill="none" opacity="0.4" strokeLinecap="round" />
            {/* Floodlight catch at shoulder top */}
            <path d="M -17 -77 C -8 -80 8 -80 17 -77 C 9 -75 -9 -75 -17 -77 Z" fill="rgba(150,200,255,0.07)" />
          </g>

          {/* ── Front leg (left) ── */}
          <g ref={lThighRef} transform="translate(-10, -112)">
            <path d="M -11 2 C -14 20 -13 40 -10 55 L 9 55 C 12 40 13 20 11 2 C 6 -2 -6 -2 -11 2 Z" fill={KIT_MID} />
            <path d="M -11 2 C -14 20 -13 40 -10 55 L 9 55 C 12 40 13 20 11 2 C 6 -2 -6 -2 -11 2 Z" fill="url(#sp-cyl-kit)" />
            <path d="M -11 2 C -14 20 -13 40 -10 55 L 9 55 C 12 40 13 20 11 2 C 6 -2 -6 -2 -11 2 Z" fill="url(#sp-top-lit)" />
            <path d="M -10 50 C -6 58 6 58 10 50" stroke={KIT_GREEN} strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round" />
            <path d="M 0 10 C -2 30 -2 45 -1 55" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none" strokeLinecap="round" />

            <g ref={lShinRef} transform="translate(0, 55)">
              <path d="M -7 2 C -10 15 -10 30 -8 48 L 6 48 C 9 30 11 16 8 2 C 5 -1 -4 -1 -7 2 Z" fill={SOCK} />
              <path d="M -7 2 C -10 15 -10 30 -8 48 L 6 48 C 9 30 11 16 8 2 C 5 -1 -4 -1 -7 2 Z" fill="url(#sp-cyl-kit)" opacity="0.3" />
              <path d="M -5 5 C -6 10 -6 22 -4 28 L 4 28 C 6 22 6 10 5 5 Z" fill="#a8b8c5" opacity="0.5" />

              <g ref={lFootRef} transform="translate(-4, 48)">
                <path d="M -8 -3 C -11 0 -12 5 -10 10 C -6 13 4 13 16 10 C 21 8 22 4 20 0 C 16 -5 8 -6 2 -5 C -2 -5 -5 -4 -8 -3 Z" fill={BOOT} />
                <path d="M -6 -3 C 0 -6 12 -5 20 0 C 16 -5 8 -6 2 -5 C -2 -5 -4 -4 -6 -3 Z" fill="rgba(255,255,255,0.08)" />
                <path d="M 12 -2 C 15 -3 20 0 20 0 C 19 2 16 2 12 1 Z" fill="rgba(255,255,255,0.16)" />
                <path d="M -8 -4 C -5 -7 2 -8 8 -6 C 4 -5 -2 -5 -8 -4 Z" fill={SOCK} opacity="0.6" />
                <rect x="-9" y="-8" width="8" height="5" rx="2" fill={KIT_GREEN} opacity="0.9" />
                <circle cx="-2" cy="12" r="1.5" fill="#080808" /><circle cx="4" cy="12" r="1.5" fill="#080808" /><circle cx="11" cy="12" r="1.5" fill="#080808" />
              </g>
            </g>
          </g>

          {/* ── Front arm (left) ── */}
          <g ref={lArmRef} transform="translate(-22, -192)">
            <path d="M -7 2 C -9 14 -8 26 -6 38 L 6 38 C 8 26 9 14 7 2 C 3 -2 -3 -2 -7 2 Z" fill={KIT_DARK} />
            <path d="M -7 2 C -9 14 -8 26 -6 38 L 6 38 C 8 26 9 14 7 2 C 3 -2 -3 -2 -7 2 Z" fill="url(#sp-cyl-kit)" />
            <g ref={lForearmRef} transform="translate(0, 38)">
              <path d="M -6 1 C -7 11 -6 22 -5 30 L 5 30 C 7 22 7 11 6 1 C 3 -1 -3 -1 -6 1 Z" fill={SKIN} />
              <path d="M -6 1 C -7 11 -6 22 -5 30 L 5 30 C 7 22 7 11 6 1 C 3 -1 -3 -1 -6 1 Z" fill="url(#sp-cyl-skin)" />
              <path d="M -5 30 C -7 33 -6 38 -2 39 C 1 40 6 38 8 35 C 9 32 8 30 5 30 Z" fill={SKIN_D} />
              <path d="M -1 32 L 0 36 M 2 32 L 3 37 M 4 32 L 5 36" stroke={SKIN_D} strokeWidth="0.7" opacity="0.5" strokeLinecap="round" />
            </g>
          </g>

          {/* ── Head ── */}
          <g ref={headRef} transform="translate(3, -192)">
            {/* Neck — trapezoid with muscle curves */}
            <path d="M -7 0 C -8 -6 -7 -12 -5 -17 L 8 -17 C 10 -12 9 -6 8 0 Z" fill={SKIN} />
            <path d="M -7 0 C -8 -6 -7 -12 -5 -17 L 8 -17 C 10 -12 9 -6 8 0 Z" fill="url(#sp-cyl-skin)" />
            {/* Neck shadow on collar line */}
            <path d="M -7 0 C -4 -4 4 -4 8 0 C 4 2 -4 2 -7 0 Z" fill="rgba(0,0,0,0.12)" />

            {/* Head silhouette — proper side profile facing right */}
            <path d="
              M 5 -17
              C -1 -20 -8 -26 -12 -34
              C -18 -43 -20 -54 -18 -64
              C -15 -74 -7 -80 3 -81
              C 13 -82 23 -76 26 -66
              C 29 -58 28 -47 25 -40
              C 23 -35 28 -30 28 -26
              C 28 -20 24 -16 20 -15
              C 15 -13 10 -14 5 -17
              Z
            " fill={SKIN} />

            {/* Hair — cap of short hair on cranium */}
            <path d="
              M -18 -64
              C -16 -74 -7 -84 4 -85
              C 15 -85 25 -78 26 -68
              C 22 -76 13 -82 3 -81
              C -7 -80 -15 -74 -18 -64
              Z
            " fill={HAIR} />
            {/* Hair texture grain */}
            <path d="M -8 -80 C 0 -83 10 -82 20 -78" stroke={HAIR} strokeWidth="3" fill="none" opacity="0.55" strokeLinecap="round" />
            <path d="M -14 -72 C -10 -76 -4 -80 4 -82" stroke={HAIR} strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />

            {/* Ear */}
            <path d="M -18 -44 C -22 -42 -24 -38 -22 -33 C -20 -28 -16 -28 -14 -32 C -12 -36 -12 -42 -14 -45 C -16 -46 -18 -46 -18 -44 Z" fill={SKIN_D} />
            <path d="M -18 -42 C -20 -39 -20 -35 -18 -32" stroke={SKIN} strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />

            {/* Sideburn */}
            <path d="M -12 -64 C -15 -56 -16 -47 -15 -40 C -13 -44 -11 -54 -12 -64 Z" fill={HAIR} opacity="0.6" />

            {/* Temple / brow shadow */}
            <path d="M 10 -65 C 6 -60 4 -52 6 -44 C 8 -48 10 -58 10 -65 Z" fill="rgba(0,0,0,0.07)" />

            {/* Eye socket subtle depth */}
            <ellipse cx="20" cy="-47" rx="6" ry="4.5" fill="rgba(0,0,0,0.08)" />
            {/* Sclera */}
            <ellipse cx="20" cy="-47" rx="4.5" ry="3.5" fill="white" />
            {/* Iris — green/hazel */}
            <circle cx="21" cy="-47" r="2.4" fill="#4a6e30" />
            {/* Pupil */}
            <circle cx="21.5" cy="-47" r="1.4" fill="#0c0e08" />
            {/* Catch light */}
            <circle cx="22.2" cy="-48.2" r="0.7" fill="rgba(255,255,255,0.92)" />
            {/* Lower lid */}
            <path d="M 15 -44 Q 20 -42 25 -44" stroke={SKIN_D} strokeWidth="0.8" fill="none" opacity="0.45" strokeLinecap="round" />
            {/* Upper lid crease */}
            <path d="M 15 -50 Q 20 -52 25 -50" stroke={SKIN_D} strokeWidth="0.6" fill="none" opacity="0.3" strokeLinecap="round" />

            {/* Eyebrow — slight arch, focused expression */}
            <path d="M 12 -54 C 17 -58 22 -57 27 -54" stroke={HAIR} strokeWidth="2.3" fill="none" strokeLinecap="round" />

            {/* Nose — bridge + tip protrusion */}
            <path d="M 24 -42 C 26 -38 28 -33 27 -28" stroke={SKIN_D} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 23 -28 C 25 -26 29 -27 28 -28 C 27 -31 24 -30 23 -28 Z" fill={SKIN_D} opacity="0.75" />
            <circle cx="26" cy="-26" r="1.5" fill={SKIN_D} opacity="0.4" />

            {/* Cheekbone catch light */}
            <ellipse cx="22" cy="-40" rx="6" ry="4" fill="rgba(230,170,130,0.2)" />

            {/* Philtrum */}
            <path d="M 22 -22 C 24 -19 23 -16 21 -14" stroke={SKIN_D} strokeWidth="1.2" fill="none" opacity="0.45" strokeLinecap="round" />
            {/* Lips */}
            <path d="M 8 -16 C 14 -13 19 -14 23 -16" stroke="#9a6855" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Lower lip highlight */}
            <path d="M 10 -15 C 14 -13 18 -13 22 -15" stroke="rgba(220,160,130,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Jaw shadow */}
            <path d="M -7 0 C -4 -6 0 -10 5 -13 C 2 -10 -2 -5 -7 0 Z" fill="rgba(0,0,0,0.1)" />
          </g>
        </g>

        {/* ══ BALL ════════════════════════════════════════════ */}
        {/* GSAP sets x/y; drawn at local origin (0,0) */}
        <g ref={ballRef}>
          <circle cx="0" cy="0" r="13" fill="#f0f0f2" stroke="#1a1a22" strokeWidth="1.5" filter="url(#sp-ball-glow)" />
          {/* Pentagon pattern */}
          <path
            d="M 0 -13 L -7 -7 L -7 4 L 0 10 L 7 4 L 7 -7 Z"
            fill="#1a1a22"
            opacity="0.75"
          />
          {/* Side panels */}
          <path d="M -13 0 L -7 -7 M -13 0 L -7 4 M 13 0 L 7 -7 M 13 0 L 7 4" stroke="#1a1a22" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M -4 -13 L 0 -13 M 4 -13 L 0 -13 M -4 10 L 0 10 M 4 10 L 0 10" stroke="#1a1a22" strokeWidth="1" fill="none" opacity="0.5" />
        </g>
      </svg>

      {/* ── Gradient overlay: darkens centre for readability, ──
           stadium breathes through at edges                 ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 75% 65% at 50% 55%,
              rgba(5,8,15,0.38) 0%,
              rgba(5,8,15,0.0)  55%),
            linear-gradient(to bottom,
              rgba(5,8,15,0.55) 0%,
              rgba(5,8,15,0.15) 35%,
              rgba(5,8,15,0.25) 65%,
              rgba(5,8,15,0.75) 100%)
          `,
        }}
      />
    </div>
  );
}
