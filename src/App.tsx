import { useCallback, useEffect, useRef, useState } from 'react';
import { PhoneMockup } from './components/PhoneMockup';
import { GoalAnimationPhase } from './components/CameraCutoutScoreboard';
import { ControlPanel, StudioTab } from './components/ControlPanel';
import {
  CutoutStyle,
  FIXTURE_PRESETS,
  GlowIntensity,
  GoalEvent,
  PhoneScreenContext,
  TeamInfo,
  TeamSide,
  WallpaperId,
} from './data/fixtures';
import { playGoalChime } from './utils/sound';

const FLASH_DURATION_MS = 920;
const SCORER_HOLD_DURATION_MS = 3700;

export default function App() {
  const initialPreset = FIXTURE_PRESETS[0];

  const [presetId, setPresetId] = useState<string>(initialPreset.id);
  const [competition, setCompetition] = useState<string>(initialPreset.competition);
  const [venue, setVenue] = useState<string>(initialPreset.venue);
  const [matchMinute, setMatchMinute] = useState<number>(initialPreset.minute);

  const [home, setHome] = useState<TeamInfo>(initialPreset.home);
  const [away, setAway] = useState<TeamInfo>(initialPreset.away);
  const [homeScore, setHomeScore] = useState<number>(initialPreset.initialHomeScore);
  const [awayScore, setAwayScore] = useState<number>(initialPreset.initialAwayScore);

  const [selectedHomeScorer, setSelectedHomeScorer] = useState<string>(
    initialPreset.home.scorers[0]
  );
  const [selectedAwayScorer, setSelectedAwayScorer] = useState<string>(
    initialPreset.away.scorers[0]
  );

  // Cutout & phone hardware presentation settings
  const [cutoutStyle, setCutoutStyle] = useState<CutoutStyle>('unified');
  const [glowIntensity, setGlowIntensity] = useState<GlowIntensity>('vibrant');
  const [screenContext, setScreenContext] = useState<PhoneScreenContext>('lockscreen');
  const [wallpaperId, setWallpaperId] = useState<WallpaperId>('stadium');
  const [macroZoom, setMacroZoom] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoSimulate, setAutoSimulate] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<StudioTab>('display');

  // Goal animation state machine (strictly in collapsed state)
  const [activeGoal, setActiveGoal] = useState<GoalEvent | null>(null);
  const [goalPhase, setGoalPhase] = useState<GoalAnimationPhase>('idle');
  const [goalLog, setGoalLog] = useState<GoalEvent[]>([]);

  const flashTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  const clearGoalTimers = useCallback(() => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearGoalTimers();
  }, [clearGoalTimers]);

  const runGoalAnimation = useCallback(
    (event: GoalEvent) => {
      clearGoalTimers();
      setActiveGoal(event);
      setGoalPhase('flash');

      if (soundEnabled) {
        playGoalChime();
      }

      flashTimerRef.current = window.setTimeout(() => {
        setGoalPhase('scorer');
        settleTimerRef.current = window.setTimeout(() => {
          setGoalPhase('idle');
        }, SCORER_HOLD_DURATION_MS);
      }, FLASH_DURATION_MS);
    },
    [clearGoalTimers, soundEnabled]
  );

  const triggerGoal = useCallback(
    (side: TeamSide, overrideScorer?: string) => {
      const nextMinute = Math.min(90, matchMinute + 1);
      const nextHomeScore = side === 'home' ? homeScore + 1 : homeScore;
      const nextAwayScore = side === 'away' ? awayScore + 1 : awayScore;
      const team = side === 'home' ? home : away;
      const rawScorer =
        overrideScorer ?? (side === 'home' ? selectedHomeScorer : selectedAwayScorer);
      const scorerName = rawScorer.trim() || team.scorers[0] || 'Goal Scorer';

      setMatchMinute(nextMinute);
      setHomeScore(nextHomeScore);
      setAwayScore(nextAwayScore);

      const newEvent: GoalEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        side,
        teamCode: team.code,
        teamName: team.name,
        teamColor: team.color,
        scorer: scorerName,
        minute: nextMinute,
        homeScore: nextHomeScore,
        awayScore: nextAwayScore,
        timestamp: Date.now(),
      };

      setGoalLog((prev) => [newEvent, ...prev]);
      runGoalAnimation(newEvent);

      // Cycle next default scorer on that side so repeated taps feel realistic
      if (!overrideScorer && team.scorers.length > 1) {
        const idx = team.scorers.indexOf(scorerName);
        const nextScorer = team.scorers[(idx + 1) % team.scorers.length];
        if (side === 'home') {
          setSelectedHomeScorer(nextScorer);
        } else {
          setSelectedAwayScorer(nextScorer);
        }
      }
    },
    [
      away,
      awayScore,
      home,
      homeScore,
      matchMinute,
      runGoalAnimation,
      selectedAwayScorer,
      selectedHomeScorer,
    ]
  );

  const handleDemoGoal = useCallback(() => {
    // Alternate sides gracefully based on the last goal
    const nextSide: TeamSide = activeGoal?.side === 'home' ? 'away' : 'home';
    triggerGoal(nextSide);
  }, [activeGoal, triggerGoal]);

  const handleReplayGoal = useCallback(
    (event: GoalEvent) => {
      runGoalAnimation({
        ...event,
        id: `replay-${Date.now()}`,
      });
    },
    [runGoalAnimation]
  );

  const handleSelectPreset = useCallback(
    (id: string) => {
      const found = FIXTURE_PRESETS.find((f) => f.id === id);
      if (!found) return;
      clearGoalTimers();
      setAutoSimulate(false);
      setGoalPhase('idle');
      setActiveGoal(null);
      setPresetId(found.id);
      setCompetition(found.competition);
      setVenue(found.venue);
      setMatchMinute(found.minute);
      setHome(found.home);
      setAway(found.away);
      setHomeScore(found.initialHomeScore);
      setAwayScore(found.initialAwayScore);
      setSelectedHomeScorer(found.home.scorers[0]);
      setSelectedAwayScorer(found.away.scorers[0]);
      setGoalLog([]);
    },
    [clearGoalTimers]
  );

  const handleResetMatch = useCallback(() => {
    const currentPreset =
      FIXTURE_PRESETS.find((f) => f.id === presetId) ?? FIXTURE_PRESETS[0];
    clearGoalTimers();
    setAutoSimulate(false);
    setGoalPhase('idle');
    setActiveGoal(null);
    setMatchMinute(currentPreset.minute);
    setHomeScore(currentPreset.initialHomeScore);
    setAwayScore(currentPreset.initialAwayScore);
    setGoalLog([]);
  }, [clearGoalTimers, presetId]);

  const handleUpdateTeam = useCallback(
    (side: TeamSide, patch: Partial<Pick<TeamInfo, 'code' | 'name' | 'color'>>) => {
      if (side === 'home') {
        setHome((prev) => ({ ...prev, ...patch }));
      } else {
        setAway((prev) => ({ ...prev, ...patch }));
      }
    },
    []
  );

  // Auto-Simulate Match Loop
  useEffect(() => {
    if (!autoSimulate) return;

    // Fire an immediate first goal shortly after enabling auto-match so user sees motion right away
    const firstGoalTimeout = window.setTimeout(() => {
      const side: TeamSide = Math.random() > 0.5 ? 'home' : 'away';
      const pool = side === 'home' ? home.scorers : away.scorers;
      const scorer = pool[Math.floor(Math.random() * pool.length)];
      triggerGoal(side, scorer);
    }, 900);

    const interval = window.setInterval(() => {
      const side: TeamSide = Math.random() > 0.5 ? 'home' : 'away';
      const pool = side === 'home' ? home.scorers : away.scorers;
      const scorer = pool[Math.floor(Math.random() * pool.length)];
      triggerGoal(side, scorer);
    }, 6400);

    return () => {
      window.clearTimeout(firstGoalTimeout);
      window.clearInterval(interval);
    };
  }, [autoSimulate, home.scorers, away.scorers, triggerGoal]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-slate-900">
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-[#F3F4F6]/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Cutout Live
          </a>

          {/* Zone 2: Clean single-line text nav links */}
          <nav
            aria-label="Workspace sections"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => setActiveTab('display')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'display'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              Display
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fixtures')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'fixtures'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              Fixtures
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              Goal Log
            </button>
            <button
              type="button"
              onClick={() => setMacroZoom((z) => !z)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                macroZoom
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              {macroZoom ? 'Full Phone' : 'Macro Zoom'}
            </button>
          </nav>

          {/* Zone 3: Single primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleDemoGoal}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              Demo Goal
            </button>
          </div>
        </div>
      </header>

      {/* Main 2-Column Interactive Hardware Studio */}
      <main
        id="top"
        className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8 lg:py-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Focal Column: Realistic Flagship Phone + Collapsed Camera Cutout */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <PhoneMockup
              home={home}
              away={away}
              homeScore={homeScore}
              awayScore={awayScore}
              matchMinute={matchMinute}
              competition={competition}
              venue={venue}
              cutoutStyle={cutoutStyle}
              glowIntensity={glowIntensity}
              screenContext={screenContext}
              wallpaperId={wallpaperId}
              macroZoom={macroZoom}
              activeGoal={activeGoal}
              goalPhase={goalPhase}
              onQuickGoal={(side) => triggerGoal(side)}
            />

            <p className="mt-4 text-xs text-slate-500 text-center">
              Tap left or right of the camera lens to score · Always collapsed (36px height)
            </p>
          </div>

          {/* Right Column: Match Goal Director & Cutout Customizer */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <ControlPanel
              activeTab={activeTab}
              onTabChange={setActiveTab}
              presetId={presetId}
              competition={competition}
              venue={venue}
              matchMinute={matchMinute}
              home={home}
              away={away}
              homeScore={homeScore}
              awayScore={awayScore}
              selectedHomeScorer={selectedHomeScorer}
              selectedAwayScorer={selectedAwayScorer}
              onSelectScorer={(side, scorer) => {
                if (side === 'home') {
                  setSelectedHomeScorer(scorer);
                } else {
                  setSelectedAwayScorer(scorer);
                }
              }}
              onTriggerGoal={(side) => triggerGoal(side)}
              autoSimulate={autoSimulate}
              onToggleAutoSimulate={() => setAutoSimulate((prev) => !prev)}
              onResetMatch={handleResetMatch}
              cutoutStyle={cutoutStyle}
              onChangeCutoutStyle={setCutoutStyle}
              glowIntensity={glowIntensity}
              onChangeGlowIntensity={setGlowIntensity}
              screenContext={screenContext}
              onChangeScreenContext={setScreenContext}
              wallpaperId={wallpaperId}
              onChangeWallpaper={setWallpaperId}
              macroZoom={macroZoom}
              onToggleMacroZoom={() => setMacroZoom((prev) => !prev)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
              onSelectPreset={handleSelectPreset}
              onUpdateTeam={handleUpdateTeam}
              goalLog={goalLog}
              onReplayGoal={handleReplayGoal}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
