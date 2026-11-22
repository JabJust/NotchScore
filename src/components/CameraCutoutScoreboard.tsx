import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CutoutStyle,
  GlowIntensity,
  GoalEvent,
  TeamInfo,
  TeamSide,
  hexToRgba,
} from '../data/fixtures';

export type GoalAnimationPhase = 'idle' | 'flash' | 'scorer';

interface CameraCutoutScoreboardProps {
  home: TeamInfo;
  away: TeamInfo;
  homeScore: number;
  awayScore: number;
  cutoutStyle: CutoutStyle;
  glowIntensity: GlowIntensity;
  activeGoal: GoalEvent | null;
  goalPhase: GoalAnimationPhase;
  onQuickGoal?: (side: TeamSide) => void;
  /** Optional className for container positioning */
  className?: string;
}

const PHONE_WIDTH = 390;
const CENTER_X = PHONE_WIDTH / 2; // 195px — physical camera axis

const GLOW_PRESETS: Record<
  GlowIntensity,
  {
    outerBlurAlpha: number;
    haloSpread: number;
    ambientTopAlpha: number;
    ringOpacity: number;
    innerWashAlpha: number;
  }
> = {
  subtle: {
    outerBlurAlpha: 0.42,
    haloSpread: 16,
    ambientTopAlpha: 0.16,
    ringOpacity: 0.72,
    innerWashAlpha: 0.18,
  },
  vibrant: {
    outerBlurAlpha: 0.68,
    haloSpread: 26,
    ambientTopAlpha: 0.28,
    ringOpacity: 0.95,
    innerWashAlpha: 0.28,
  },
  stadium: {
    outerBlurAlpha: 0.88,
    haloSpread: 38,
    ambientTopAlpha: 0.42,
    ringOpacity: 1,
    innerWashAlpha: 0.38,
  },
};

/** Crisp geometric football micro-icon shown next to scorer name */
function MicroFootballIcon({ color }: { color: string }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="8" cy="8" r="6.8" stroke={color} strokeWidth="1.5" />
      <polygon
        points="8,4.6 10.9,6.7 9.8,10.1 6.2,10.1 5.1,6.7"
        fill={color}
      />
    </svg>
  );
}

/** Odometer-style rolling score numeral */
function RollingScore({
  value,
  highlightColor,
  isCelebrating,
  isDimmed,
}: {
  value: number;
  highlightColor: string;
  isCelebrating: boolean;
  isDimmed: boolean;
}) {
  return (
    <div
      className="relative h-[22px] w-[18px] overflow-hidden flex items-center justify-center shrink-0"
      style={{
        opacity: isDimmed ? 0.5 : 1,
        transition: 'opacity 260ms ease',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 16, opacity: 0, scale: 0.78 }}
          animate={{
            y: 0,
            opacity: 1,
            scale: isCelebrating ? [1.26, 1] : 1,
          }}
          exit={{ y: -16, opacity: 0, scale: 0.8 }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 26,
          }}
          className="font-mono text-[15px] font-bold leading-none tabular-nums select-none"
          style={{
            color: isCelebrating ? '#FFFFFF' : '#F8FAFC',
            textShadow: isCelebrating
              ? `0 0 10px ${hexToRgba(highlightColor, 0.95)}`
              : 'none',
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/** Realistic multi-coated front camera lens locked to hardware center */
function HardwareCameraLens({
  glowColor,
  isGlowing,
  standalone,
}: {
  glowColor: string | null;
  isGlowing: boolean;
  standalone: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 flex items-center justify-center rounded-full"
      style={{
        left: `${CENTER_X}px`,
        width: standalone ? '26px' : '22px',
        height: standalone ? '26px' : '22px',
        background: standalone ? '#040507' : '#090B10',
        boxShadow: isGlowing && glowColor
          ? standalone
            ? `0 0 0 1.5px ${hexToRgba(glowColor, 0.72)}, 0 0 16px ${hexToRgba(glowColor, 0.6)}`
            : `inset 0 0 0 1px ${hexToRgba(glowColor, 0.45)}`
          : standalone
            ? '0 2px 8px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.08)'
            : 'inset 0 0 0 1px rgba(255,255,255,0.07)',
        transition: 'box-shadow 320ms ease',
      }}
    >
      {/* Inner sapphire aperture */}
      <div
        className="relative w-[13px] h-[13px] rounded-full flex items-center justify-center"
        style={{
          background:
            'radial-gradient(circle at 38% 35%, #1D2C4A 0%, #0A101E 45%, #020305 100%)',
          boxShadow: 'inset 0 0 3px rgba(0,0,0,0.95)',
        }}
      >
        {/* Center dark pupil */}
        <div className="w-[5.5px] h-[5.5px] rounded-full bg-[#020409] ring-1 ring-sky-400/20" />
        {/* Tiny optical glass specular glint */}
        <div className="absolute top-[2.5px] left-[3px] w-[3px] h-[2px] rounded-full bg-white/45 rotate-[-28deg]" />
      </div>
    </div>
  );
}

export const CameraCutoutScoreboard: React.FC<CameraCutoutScoreboardProps> = ({
  home,
  away,
  homeScore,
  awayScore,
  cutoutStyle,
  glowIntensity,
  activeGoal,
  goalPhase,
  onQuickGoal,
  className = '',
}) => {
  const [rippleKey, setRippleKey] = useState(0);

  useEffect(() => {
    if (activeGoal && goalPhase === 'flash') {
      setRippleKey((k) => k + 1);
    }
  }, [activeGoal, goalPhase]);

  const isCelebrating = goalPhase !== 'idle' && activeGoal !== null;
  const scoringSide: TeamSide | null = isCelebrating ? activeGoal.side : null;
  const glowColor = isCelebrating ? activeGoal.teamColor : null;
  const glowCfg = GLOW_PRESETS[glowIntensity];

  // Collapsed-state horizontal geometry (vertical height NEVER expands beyond 36px)
  // Camera lens stays mathematically anchored at CENTER_X (195px).
  const isHomeGoal = scoringSide === 'home';
  const isAwayGoal = scoringSide === 'away';

  const leftHalfW =
    goalPhase === 'scorer' && isHomeGoal
      ? 176
      : goalPhase === 'flash' && isHomeGoal
        ? 124
        : isAwayGoal
          ? 92
          : 108;

  const rightHalfW =
    goalPhase === 'scorer' && isAwayGoal
      ? 176
      : goalPhase === 'flash' && isAwayGoal
        ? 124
        : isHomeGoal
          ? 92
          : 108;

  const unifiedLeft = CENTER_X - leftHalfW;
  const unifiedWidth = leftHalfW + rightHalfW;

  // Split punch-hole wing widths (leaving a crisp 17px clearance from camera center)
  const splitGap = 17;
  const splitLeftW = leftHalfW - splitGap;
  const splitRightW = rightHalfW - splitGap;

  const springTransition = {
    type: 'spring' as const,
    stiffness: 350,
    damping: 30,
    mass: 0.88,
  };

  // Shared Left Wing Inner Content
  const renderLeftContent = () => {
    const celebratingHome = isHomeGoal && isCelebrating;
    const dimmed = isAwayGoal && isCelebrating;
    return (
      <button
        type="button"
        onClick={() => onQuickGoal?.('home')}
        aria-label={`Trigger goal for ${home.name}`}
        title={`Click to score for ${home.name}`}
        className="group relative flex h-full w-full items-center justify-between pl-[8px] pr-[10px] text-left focus:outline-none cursor-pointer"
      >
        {/* Left Team Color Bar + Team / Goal / Scorer */}
        <div className="flex items-center gap-[6px] min-w-0 flex-1 overflow-hidden">
          {/* Team color vertical capsule */}
          <motion.span
            animate={{
              height: celebratingHome ? 20 : 14,
              scaleX: celebratingHome ? 1.15 : 1,
              opacity: dimmed ? 0.45 : 1,
            }}
            transition={{ duration: 0.25 }}
            className="w-[3.5px] rounded-full shrink-0"
            style={{
              backgroundColor: home.color,
              boxShadow: celebratingHome
                ? `0 0 12px ${hexToRgba(home.color, 0.95)}`
                : `0 0 6px ${hexToRgba(home.color, 0.45)}`,
            }}
          />

          <div className="relative flex items-center min-w-0 flex-1 h-[22px] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {celebratingHome && goalPhase === 'flash' ? (
                <motion.div
                  key="home-goal-flash"
                  initial={{ opacity: 0, scale: 0.72, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -6 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                  className="flex items-center gap-[5px] whitespace-nowrap"
                >
                  <MicroFootballIcon color={home.color} />
                  <span
                    className="font-display text-[12px] font-bold tracking-[0.09em] text-white"
                    style={{ textShadow: `0 0 10px ${hexToRgba(home.color, 0.9)}` }}
                  >
                    GOAL
                  </span>
                </motion.div>
              ) : celebratingHome && goalPhase === 'scorer' && activeGoal ? (
                <motion.div
                  key={`home-scorer-${activeGoal.id}`}
                  initial={{ opacity: 0, x: -10, scale: 0.88 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className="flex items-center gap-[5px] min-w-0 w-full"
                >
                  <MicroFootballIcon color={home.color} />
                  <span className="truncate text-[11.5px] font-semibold tracking-tight text-white">
                    {activeGoal.scorer}
                  </span>
                  <span
                    className="font-mono text-[10px] font-semibold tabular-nums shrink-0"
                    style={{ color: hexToRgba(home.color, 0.95) }}
                  >
                    {activeGoal.minute}&apos;
                  </span>
                </motion.div>
              ) : (
                <motion.span
                  key={`home-code-${home.code}`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: dimmed ? 0.45 : 0.95, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.18 }}
                  className="font-display text-[12px] font-semibold tracking-[0.04em] text-white/95 whitespace-nowrap group-hover:text-white"
                >
                  {home.code}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Home Score */}
        <RollingScore
          value={homeScore}
          highlightColor={home.color}
          isCelebrating={celebratingHome}
          isDimmed={dimmed}
        />
      </button>
    );
  };

  // Shared Right Wing Inner Content
  const renderRightContent = () => {
    const celebratingAway = isAwayGoal && isCelebrating;
    const dimmed = isHomeGoal && isCelebrating;
    return (
      <button
        type="button"
        onClick={() => onQuickGoal?.('away')}
        aria-label={`Trigger goal for ${away.name}`}
        title={`Click to score for ${away.name}`}
        className="group relative flex h-full w-full items-center justify-between pl-[10px] pr-[8px] text-right focus:outline-none cursor-pointer"
      >
        {/* Away Score */}
        <RollingScore
          value={awayScore}
          highlightColor={away.color}
          isCelebrating={celebratingAway}
          isDimmed={dimmed}
        />

        {/* Team / Goal / Scorer + Right Team Color Bar */}
        <div className="flex items-center justify-end gap-[6px] min-w-0 flex-1 overflow-hidden">
          <div className="relative flex items-center justify-end min-w-0 flex-1 h-[22px] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {celebratingAway && goalPhase === 'flash' ? (
                <motion.div
                  key="away-goal-flash"
                  initial={{ opacity: 0, scale: 0.72, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -6 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                  className="flex items-center gap-[5px] whitespace-nowrap"
                >
                  <span
                    className="font-display text-[12px] font-bold tracking-[0.09em] text-white"
                    style={{ textShadow: `0 0 10px ${hexToRgba(away.color, 0.9)}` }}
                  >
                    GOAL
                  </span>
                  <MicroFootballIcon color={away.color} />
                </motion.div>
              ) : celebratingAway && goalPhase === 'scorer' && activeGoal ? (
                <motion.div
                  key={`away-scorer-${activeGoal.id}`}
                  initial={{ opacity: 0, x: 10, scale: 0.88 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 6, scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className="flex items-center justify-end gap-[5px] min-w-0 w-full"
                >
                  <span
                    className="font-mono text-[10px] font-semibold tabular-nums shrink-0"
                    style={{ color: hexToRgba(away.color, 0.95) }}
                  >
                    {activeGoal.minute}&apos;
                  </span>
                  <span className="truncate text-[11.5px] font-semibold tracking-tight text-white">
                    {activeGoal.scorer}
                  </span>
                  <MicroFootballIcon color={away.color} />
                </motion.div>
              ) : (
                <motion.span
                  key={`away-code-${away.code}`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: dimmed ? 0.45 : 0.95, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.18 }}
                  className="font-display text-[12px] font-semibold tracking-[0.04em] text-white/95 whitespace-nowrap group-hover:text-white"
                >
                  {away.code}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Away team color vertical capsule */}
          <motion.span
            animate={{
              height: celebratingAway ? 20 : 14,
              scaleX: celebratingAway ? 1.15 : 1,
              opacity: dimmed ? 0.45 : 1,
            }}
            transition={{ duration: 0.25 }}
            className="w-[3.5px] rounded-full shrink-0"
            style={{
              backgroundColor: away.color,
              boxShadow: celebratingAway
                ? `0 0 12px ${hexToRgba(away.color, 0.95)}`
                : `0 0 6px ${hexToRgba(away.color, 0.45)}`,
            }}
          />
        </div>
      </button>
    );
  };

  return (
    <div
      className={`relative w-[390px] h-[36px] select-none ${className}`}
      role="region"
      aria-label={`Live camera cutout scoreboard: ${home.name} ${homeScore}, ${away.name} ${awayScore}`}
    >
      {/* Subtle Ambient Light Reflection Bleed onto top of display during Goal */}
      <AnimatePresence>
        {isCelebrating && glowColor && (
          <motion.div
            key={`ambient-bleed-${activeGoal?.id}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.4 }}
            aria-hidden="true"
            className="pointer-events-none absolute -top-[14px] h-[84px] rounded-full blur-[26px] z-0"
            style={{
              left: isHomeGoal ? `${CENTER_X - 185}px` : `${CENTER_X - 45}px`,
              width: '230px',
              background: `radial-gradient(ellipse at center, ${hexToRgba(
                glowColor,
                glowCfg.ambientTopAlpha
              )} 0%, transparent 72%)`,
            }}
          />
        )}
      </AnimatePresence>

      {cutoutStyle === 'unified' ? (
        /* ==================== UNIFIED COLLAPSED PILL MODE ==================== */
        <>
          {/* One-shot Radial Shockwave Ripple on Goal Impact */}
          <AnimatePresence>
            {isCelebrating && glowColor && rippleKey > 0 && (
              <motion.div
                key={`ripple-${rippleKey}`}
                aria-hidden="true"
                initial={{
                  opacity: 0.92,
                  scaleX: 1,
                  scaleY: 1,
                }}
                animate={{
                  opacity: 0,
                  scaleX: 1.18,
                  scaleY: 1.95,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.82, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute top-0 h-[36px] rounded-full z-10"
                style={{
                  left: `${unifiedLeft}px`,
                  width: `${unifiedWidth}px`,
                  border: `2px solid ${glowColor}`,
                  boxShadow: `0 0 18px ${hexToRgba(glowColor, 0.75)}`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Main Morphing Collapsed Capsule */}
          <motion.div
            animate={{
              left: unifiedLeft,
              width: unifiedWidth,
            }}
            transition={springTransition}
            className="absolute top-0 h-[36px] rounded-full z-20"
            style={{
              boxShadow:
                isCelebrating && glowColor
                  ? `0 0 ${glowCfg.haloSpread}px ${hexToRgba(
                      glowColor,
                      glowCfg.outerBlurAlpha
                    )}, 0 6px 20px rgba(0, 0, 0, 0.55)`
                  : '0 6px 18px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Rotating Conic Luminous Border Ring (Active on Goal) */}
            <div
              className="relative h-full w-full rounded-full p-[1.5px] overflow-hidden"
              style={{
                background:
                  isCelebrating && glowColor
                    ? hexToRgba(glowColor, 0.25)
                    : 'rgba(255,255,255,0.08)',
                transition: 'background 300ms ease',
              }}
            >
              {isCelebrating && glowColor && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[360px] h-[360px] animate-cutout-beam"
                  style={{
                    opacity: glowCfg.ringOpacity,
                    background: `conic-gradient(from 0deg, transparent 0deg, ${glowColor} 58deg, #FFFFFF 86deg, ${glowColor} 122deg, transparent 190deg, ${hexToRgba(
                      glowColor,
                      0.55
                    )} 285deg, transparent 360deg)`,
                  }}
                />
              )}

              {/* Solid OLED Pitch-Black Inner Capsule */}
              <div className="relative h-full w-full rounded-full bg-[#06070A] overflow-hidden">
                {/* Ambient Idle & Active Dual-Team Tints on Left and Right Ends */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-[44%] transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, ${hexToRgba(
                      home.color,
                      isHomeGoal && isCelebrating ? glowCfg.innerWashAlpha : 0.14
                    )} 0%, transparent 100%)`,
                    opacity: isAwayGoal && isCelebrating ? 0.2 : 1,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 w-[44%] transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(270deg, ${hexToRgba(
                      away.color,
                      isAwayGoal && isCelebrating ? glowCfg.innerWashAlpha : 0.14
                    )} 0%, transparent 100%)`,
                    opacity: isHomeGoal && isCelebrating ? 0.2 : 1,
                  }}
                />

                {/* Sweeping Light Shimmer across the scoring side */}
                {isCelebrating && glowColor && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-[46%] animate-cutout-sweep"
                    style={{
                      left: isHomeGoal ? '0%' : '50%',
                      background: `linear-gradient(90deg, transparent 0%, ${hexToRgba(
                        glowColor,
                        0.38
                      )} 50%, transparent 100%)`,
                    }}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Left Content Zone — Locked cleanly between pill left edge and physical center camera */}
          <motion.div
            animate={{
              left: unifiedLeft + 1.5,
              width: leftHalfW - 16,
            }}
            transition={springTransition}
            className="absolute top-0 h-[36px] z-30 flex items-center"
          >
            {renderLeftContent()}
          </motion.div>

          {/* Right Content Zone — Locked cleanly between physical center camera and pill right edge */}
          <motion.div
            animate={{
              left: CENTER_X + 15,
              width: rightHalfW - 16.5,
            }}
            transition={springTransition}
            className="absolute top-0 h-[36px] z-30 flex items-center"
          >
            {renderRightContent()}
          </motion.div>

          {/* Physical Center Camera Lens (Always Pinned at Exact Center) */}
          <HardwareCameraLens
            glowColor={glowColor}
            isGlowing={isCelebrating}
            standalone={false}
          />
        </>
      ) : (
        /* ==================== PUNCH-HOLE SPLIT WINGS MODE ==================== */
        <>
          {/* Left Floating Score Wing */}
          <motion.div
            animate={{
              left: CENTER_X - splitGap - splitLeftW,
              width: splitLeftW,
            }}
            transition={springTransition}
            className="absolute top-[1px] h-[34px] rounded-full z-20"
            style={{
              boxShadow:
                isHomeGoal && isCelebrating
                  ? `0 0 ${glowCfg.haloSpread}px ${hexToRgba(
                      home.color,
                      glowCfg.outerBlurAlpha
                    )}, 0 4px 16px rgba(0,0,0,0.45)`
                  : '0 4px 14px rgba(0,0,0,0.38)',
            }}
          >
            {/* Shockwave ripple on left wing */}
            <AnimatePresence>
              {isHomeGoal && isCelebrating && rippleKey > 0 && (
                <motion.div
                  key={`split-left-ripple-${rippleKey}`}
                  aria-hidden="true"
                  initial={{ opacity: 0.9, scaleX: 1, scaleY: 1 }}
                  animate={{ opacity: 0, scaleX: 1.24, scaleY: 2.0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    border: `2px solid ${home.color}`,
                    boxShadow: `0 0 14px ${hexToRgba(home.color, 0.7)}`,
                  }}
                />
              )}
            </AnimatePresence>

            <div
              className="relative h-full w-full rounded-full p-[1.5px] overflow-hidden"
              style={{
                background:
                  isHomeGoal && isCelebrating
                    ? hexToRgba(home.color, 0.35)
                    : 'rgba(255,255,255,0.1)',
              }}
            >
              {isHomeGoal && isCelebrating && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[240px] h-[240px] animate-cutout-beam"
                  style={{
                    opacity: glowCfg.ringOpacity,
                    background: `conic-gradient(from 0deg, transparent 0deg, ${home.color} 70deg, #FFFFFF 100deg, ${home.color} 140deg, transparent 220deg)`,
                  }}
                />
              )}
              <div className="relative h-full w-full rounded-full bg-[#06070A] overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, ${hexToRgba(
                      home.color,
                      isHomeGoal && isCelebrating ? glowCfg.innerWashAlpha : 0.16
                    )} 0%, transparent 80%)`,
                  }}
                />
                {renderLeftContent()}
              </div>
            </div>
          </motion.div>

          {/* Center Standalone Punch-Hole Camera */}
          <HardwareCameraLens
            glowColor={glowColor}
            isGlowing={isCelebrating}
            standalone={true}
          />

          {/* Right Floating Score Wing */}
          <motion.div
            animate={{
              left: CENTER_X + splitGap,
              width: splitRightW,
            }}
            transition={springTransition}
            className="absolute top-[1px] h-[34px] rounded-full z-20"
            style={{
              boxShadow:
                isAwayGoal && isCelebrating
                  ? `0 0 ${glowCfg.haloSpread}px ${hexToRgba(
                      away.color,
                      glowCfg.outerBlurAlpha
                    )}, 0 4px 16px rgba(0,0,0,0.45)`
                  : '0 4px 14px rgba(0,0,0,0.38)',
            }}
          >
            {/* Shockwave ripple on right wing */}
            <AnimatePresence>
              {isAwayGoal && isCelebrating && rippleKey > 0 && (
                <motion.div
                  key={`split-right-ripple-${rippleKey}`}
                  aria-hidden="true"
                  initial={{ opacity: 0.9, scaleX: 1, scaleY: 1 }}
                  animate={{ opacity: 0, scaleX: 1.24, scaleY: 2.0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    border: `2px solid ${away.color}`,
                    boxShadow: `0 0 14px ${hexToRgba(away.color, 0.7)}`,
                  }}
                />
              )}
            </AnimatePresence>

            <div
              className="relative h-full w-full rounded-full p-[1.5px] overflow-hidden"
              style={{
                background:
                  isAwayGoal && isCelebrating
                    ? hexToRgba(away.color, 0.35)
                    : 'rgba(255,255,255,0.1)',
              }}
            >
              {isAwayGoal && isCelebrating && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[240px] h-[240px] animate-cutout-beam"
                  style={{
                    opacity: glowCfg.ringOpacity,
                    background: `conic-gradient(from 0deg, transparent 0deg, ${away.color} 70deg, #FFFFFF 100deg, ${away.color} 140deg, transparent 220deg)`,
                  }}
                />
              )}
              <div className="relative h-full w-full rounded-full bg-[#06070A] overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(270deg, ${hexToRgba(
                      away.color,
                      isAwayGoal && isCelebrating ? glowCfg.innerWashAlpha : 0.16
                    )} 0%, transparent 80%)`,
                  }}
                />
                {renderRightContent()}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};
