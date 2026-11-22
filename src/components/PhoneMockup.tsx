import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  Flashlight,
  Calendar,
  CloudSun,
  MessageSquare,
  Music,
  Compass,
  Phone,
  Mail,
  MapPin,
  Bookmark,
  Share2,
} from 'lucide-react';
import {
  CameraCutoutScoreboard,
  GoalAnimationPhase,
} from './CameraCutoutScoreboard';
import {
  CutoutStyle,
  GlowIntensity,
  GoalEvent,
  PhoneScreenContext,
  TeamInfo,
  TeamSide,
  WALLPAPERS,
  WallpaperId,
  hexToRgba,
} from '../data/fixtures';

interface PhoneMockupProps {
  home: TeamInfo;
  away: TeamInfo;
  homeScore: number;
  awayScore: number;
  matchMinute: number;
  competition: string;
  venue: string;
  cutoutStyle: CutoutStyle;
  glowIntensity: GlowIntensity;
  screenContext: PhoneScreenContext;
  wallpaperId: WallpaperId;
  macroZoom: boolean;
  activeGoal: GoalEvent | null;
  goalPhase: GoalAnimationPhase;
  onQuickGoal: (side: TeamSide) => void;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  home,
  away,
  homeScore,
  awayScore,
  matchMinute,
  competition,
  venue,
  cutoutStyle,
  glowIntensity,
  screenContext,
  wallpaperId,
  macroZoom,
  activeGoal,
  goalPhase,
  onQuickGoal,
}) => {
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  const wallpaper = WALLPAPERS[wallpaperId];
  const isLightScreen = screenContext === 'article';
  const isCelebrating = goalPhase !== 'idle' && activeGoal !== null;
  const isWideCutout = goalPhase === 'scorer' && activeGoal !== null;

  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      {/* Viewport clip container when Macro Zoom is active */}
      <div
        className={`relative flex justify-center w-full transition-all duration-500 ${
          macroZoom
            ? 'h-[340px] sm:h-[420px] overflow-hidden rounded-3xl bg-slate-900/[0.03] border border-slate-200/80 pt-7'
            : 'py-1 max-[440px]:h-[690px] overflow-x-clip'
        }`}
      >
        <div className="max-[440px]:scale-[0.84] max-[440px]:origin-top">
          <motion.div
            animate={
              macroZoom
                ? { scale: 1.48, y: 12 }
                : { scale: 1, y: 0 }
            }
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ transformOrigin: 'top center' }}
            className="relative shrink-0"
          >
          {/* Outer Titanium Chassis (414px outer, 390px inner OLED screen) */}
          <div
            className="relative w-[414px] h-[812px] rounded-[56px] p-[12px] bg-[#16181D] shadow-[0_32px_70px_-18px_rgba(15,23,42,0.34),0_0_0_1px_rgba(255,255,255,0.12)_inset,0_0_0_2px_#272A33]"
          >
            {/* Side Hardware Buttons */}
            <div
              aria-hidden="true"
              className="absolute -left-[3px] top-[132px] w-[3px] h-[30px] rounded-l-sm bg-[#2D313B]"
            />
            <div
              aria-hidden="true"
              className="absolute -left-[3px] top-[184px] w-[3px] h-[54px] rounded-l-sm bg-[#2D313B]"
            />
            <div
              aria-hidden="true"
              className="absolute -left-[3px] top-[250px] w-[3px] h-[54px] rounded-l-sm bg-[#2D313B]"
            />
            <div
              aria-hidden="true"
              className="absolute -right-[3px] top-[204px] w-[3px] h-[78px] rounded-r-sm bg-[#2D313B]"
            />

            {/* Inner 390x788 OLED Display */}
            <div
              className={`relative w-[390px] h-[788px] rounded-[45px] overflow-hidden ${
                isLightScreen ? 'bg-white text-slate-900' : 'bg-[#090B10] text-white'
              }`}
            >
              {/* Wallpaper Layer (for Lock Screen & Home Screen) */}
              {!isLightScreen && (
                <div
                  className="absolute inset-0 z-0"
                  style={{ background: wallpaper.fallbackGradient }}
                >
                  {!imgFailed[wallpaper.src] && (
                    <img
                      src={wallpaper.src}
                      alt={`${wallpaper.label} smartphone wallpaper`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImgFailed((prev) => ({ ...prev, [wallpaper.src]: true }))
                      }
                      className="h-full w-full object-cover object-center"
                    />
                  )}
                  {/* Top legibility scrim so status bar & cutout always stay razor-sharp */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-[150px] bg-gradient-to-b from-black/72 via-black/28 to-transparent"
                  />
                  {/* Subtle bottom scrim for lock/home controls */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-t from-black/68 via-black/20 to-transparent"
                  />
                </div>
              )}

              {/* Subtle Top Display Edge Glow Reflection when a Goal Occurs */}
              {isCelebrating && activeGoal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isLightScreen ? 0.2 : 0.35 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[110px] z-10"
                  style={{
                    background: `radial-gradient(ellipse 68% 58% at ${
                      activeGoal.side === 'home' ? '36%' : '64%'
                    } 0%, ${hexToRgba(activeGoal.teamColor, 0.52)} 0%, transparent 72%)`,
                  }}
                />
              )}

              {/* Authentic Smartphone Status Bar flanking the Collapsed Camera Cutout */}
              <div
                className={`relative z-20 flex items-center justify-between px-[22px] pt-[17px] h-[46px] transition-opacity duration-300 ${
                  isLightScreen ? 'text-slate-900' : 'text-white'
                }`}
              >
                {/* Left Time */}
                <span
                  className="font-display text-[13.5px] font-semibold tracking-tight tabular-nums transition-opacity duration-300"
                  style={{ opacity: isWideCutout ? 0.14 : 0.94 }}
                >
                  9:41
                </span>

                {/* Right Signal + 5G + Battery */}
                <div
                  className="flex items-center gap-[5px] transition-opacity duration-300"
                  style={{ opacity: isWideCutout ? 0.14 : 0.92 }}
                >
                  {/* Signal bars */}
                  <div className="flex items-end gap-[1.5px] h-[10px]" aria-hidden="true">
                    <span className="w-[2.5px] h-[4px] rounded-[1px] bg-current opacity-85" />
                    <span className="w-[2.5px] h-[6px] rounded-[1px] bg-current opacity-90" />
                    <span className="w-[2.5px] h-[8px] rounded-[1px] bg-current" />
                    <span className="w-[2.5px] h-[10px] rounded-[1px] bg-current" />
                  </div>
                  <span className="text-[10.5px] font-semibold tracking-tight">5G</span>
                  {/* Battery outline */}
                  <div className="flex items-center gap-[1.5px]" aria-hidden="true">
                    <div className="w-[20px] h-[10px] rounded-[3px] border border-current/60 p-[1.5px]">
                      <div className="h-full w-[78%] rounded-[1.5px] bg-current" />
                    </div>
                    <div className="w-[1.5px] h-[4px] rounded-r-[1px] bg-current/60" />
                  </div>
                </div>
              </div>

              {/* ==================== COLLAPSED CAMERA CUTOUT SCOREBOARD ==================== */}
              <div className="absolute top-[11px] left-0 right-0 z-30">
                <CameraCutoutScoreboard
                  home={home}
                  away={away}
                  homeScore={homeScore}
                  awayScore={awayScore}
                  cutoutStyle={cutoutStyle}
                  glowIntensity={glowIntensity}
                  activeGoal={activeGoal}
                  goalPhase={goalPhase}
                  onQuickGoal={onQuickGoal}
                />
              </div>

              {/* ==================== PHONE SCREEN CONTEXT CONTENT ==================== */}
              {screenContext === 'lockscreen' && (
                <div className="relative z-10 flex flex-col justify-between h-[742px] px-7 pt-14 pb-9">
                  {/* Lock Screen Date & Large Clock */}
                  <div className="flex flex-col items-center text-center">
                    <p className="text-[14px] font-medium tracking-wide text-white/75">
                      Sunday, November 22
                    </p>
                    <p className="font-display text-[76px] font-semibold leading-[0.98] tracking-[-0.03em] text-white/95 mt-1 tabular-nums">
                      9:41
                    </p>
                    <p className="text-[12.5px] text-white/65 mt-3">
                      {competition} · {venue} · {matchMinute}&apos;
                    </p>
                  </div>

                  {/* Subtle Bottom Quick Actions (Flashlight & Camera) */}
                  <div className="flex items-center justify-between px-3">
                    <div
                      aria-hidden="true"
                      className="w-[46px] h-[46px] rounded-full bg-black/40 backdrop-blur-md border border-white/12 flex items-center justify-center text-white/90"
                    >
                      <Flashlight className="w-[18px] h-[18px]" />
                    </div>
                    <p className="text-[11px] text-white/55 tracking-wide">
                      Swipe up to unlock
                    </p>
                    <div
                      aria-hidden="true"
                      className="w-[46px] h-[46px] rounded-full bg-black/40 backdrop-blur-md border border-white/12 flex items-center justify-center text-white/90"
                    >
                      <Camera className="w-[18px] h-[18px]" />
                    </div>
                  </div>
                </div>
              )}

              {screenContext === 'homescreen' && (
                <div className="relative z-10 flex flex-col justify-between h-[742px] px-6 pt-8 pb-7">
                  <div className="space-y-6">
                    {/* Clean Frosted Weather + Schedule Widgets */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="rounded-[24px] bg-white/12 backdrop-blur-xl border border-white/12 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium text-white/80">
                            London
                          </span>
                          <CloudSun className="w-4 h-4 text-amber-200" />
                        </div>
                        <p className="font-display text-[34px] font-semibold leading-none mt-2.5 tabular-nums">
                          13°
                        </p>
                        <p className="text-[11px] text-white/65 mt-2">
                          Clear night · H:15° L:9°
                        </p>
                      </div>

                      <div className="rounded-[24px] bg-white/12 backdrop-blur-xl border border-white/12 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium text-white/80">
                            Sunday
                          </span>
                          <Calendar className="w-4 h-4 text-white/75" />
                        </div>
                        <p className="font-display text-[34px] font-semibold leading-none mt-2.5 tabular-nums">
                          22
                        </p>
                        <p className="text-[11px] text-white/65 mt-2 truncate">
                          Matchday · {home.code} v {away.code}
                        </p>
                      </div>
                    </div>

                    {/* Minimal App Grid */}
                    <div className="grid grid-cols-4 gap-y-5 gap-x-4 pt-1">
                      {[
                        { label: 'Calendar', icon: Calendar, bg: 'bg-slate-800/85' },
                        { label: 'Maps', icon: MapPin, bg: 'bg-emerald-700/85' },
                        { label: 'Mail', icon: Mail, bg: 'bg-sky-700/85' },
                        { label: 'Music', icon: Music, bg: 'bg-rose-700/85' },
                        { label: 'Notes', icon: Bookmark, bg: 'bg-amber-600/85' },
                        { label: 'Browser', icon: Compass, bg: 'bg-indigo-700/85' },
                        { label: 'Messages', icon: MessageSquare, bg: 'bg-teal-700/85' },
                        { label: 'Camera', icon: Camera, bg: 'bg-zinc-700/85' },
                      ].map((app) => {
                        const Icon = app.icon;
                        return (
                          <div key={app.label} className="flex flex-col items-center gap-1.5">
                            <div
                              className={`w-[54px] h-[54px] rounded-[15px] ${app.bg} backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-sm`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10.5px] font-medium text-white/80">
                              {app.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Frosted Bottom Dock */}
                  <div className="rounded-[28px] bg-white/14 backdrop-blur-xl border border-white/14 px-4 py-3 flex items-center justify-around">
                    {[Phone, Compass, MessageSquare, Music].map((Icon, idx) => (
                      <div
                        key={idx}
                        className="w-[50px] h-[50px] rounded-[14px] bg-black/35 border border-white/10 flex items-center justify-center text-white/90"
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {screenContext === 'article' && (
                <div className="relative z-10 flex flex-col h-[742px] bg-white text-slate-900">
                  {/* Editorial App Bar */}
                  <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-slate-100">
                    <span className="font-display text-[13px] font-semibold text-slate-900">
                      The Pitch Journal
                    </span>
                    <div className="flex items-center gap-3 text-slate-400">
                      <Bookmark className="w-4 h-4" />
                      <Share2 className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Clean Article Prose (shows cutout glow legibility over light mode!) */}
                  <div className="flex-1 overflow-hidden px-6 pt-6 space-y-4">
                    <p className="text-[11.5px] font-medium text-slate-500">
                      Tactical Analysis · 4 min read · {competition}
                    </p>
                    <h3 className="font-display text-[24px] font-bold leading-[1.18] tracking-tight text-slate-900">
                      How narrow half-space overloads decide title-race derbies
                    </h3>
                    <p className="text-[13.5px] leading-[1.65] text-slate-600">
                      With both fullbacks stepping into midfield during the first phase of build-up,
                      the decisive moments rarely arrive from wide crosses. Instead, quick vertical
                      combinations between the lines force center-backs into split-second decisions.
                    </p>
                    <div className="h-[1px] bg-slate-100 my-2" />
                    <div className="grid grid-cols-2 gap-4 py-1">
                      <div>
                        <p className="text-[11px] text-slate-500">Live Score</p>
                        <p className="font-mono text-[18px] font-bold text-slate-900 tabular-nums mt-0.5">
                          {home.code} {homeScore} – {awayScore} {away.code}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Match Clock</p>
                        <p className="font-mono text-[18px] font-bold text-slate-900 tabular-nums mt-0.5">
                          {matchMinute}&apos;
                        </p>
                      </div>
                    </div>
                    <div className="h-[1px] bg-slate-100 my-2" />
                    <p className="text-[13.5px] leading-[1.65] text-slate-600">
                      Notice how the collapsed camera cutout scoreboard keeps the live score and
                      team colors pinned cleanly at the top edge—glowing and revealing the scorer
                      the instant a goal lands without ever pulling you out of the page.
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom OS Home Gesture Indicator */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[8px] left-1/2 -translate-x-1/2 z-30 w-[132px] h-[4.5px] rounded-full"
                style={{
                  backgroundColor: isLightScreen
                    ? 'rgba(15,23,42,0.22)'
                    : 'rgba(255,255,255,0.42)',
                }}
              />
            </div>
          </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
