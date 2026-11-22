import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Repeat,
} from 'lucide-react';
import {
  CutoutStyle,
  FIXTURE_PRESETS,
  GlowIntensity,
  GoalEvent,
  PhoneScreenContext,
  TEAM_COLOR_SWATCHES,
  TeamInfo,
  TeamSide,
  WallpaperId,
  hexToRgba,
  isLightColor,
} from '../data/fixtures';

export type StudioTab = 'display' | 'fixtures' | 'timeline';

interface ControlPanelProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  presetId: string;
  competition: string;
  venue: string;
  matchMinute: number;
  home: TeamInfo;
  away: TeamInfo;
  homeScore: number;
  awayScore: number;
  selectedHomeScorer: string;
  selectedAwayScorer: string;
  onSelectScorer: (side: TeamSide, scorer: string) => void;
  onTriggerGoal: (side: TeamSide) => void;
  autoSimulate: boolean;
  onToggleAutoSimulate: () => void;
  onResetMatch: () => void;
  cutoutStyle: CutoutStyle;
  onChangeCutoutStyle: (style: CutoutStyle) => void;
  glowIntensity: GlowIntensity;
  onChangeGlowIntensity: (intensity: GlowIntensity) => void;
  screenContext: PhoneScreenContext;
  onChangeScreenContext: (ctx: PhoneScreenContext) => void;
  wallpaperId: WallpaperId;
  onChangeWallpaper: (id: WallpaperId) => void;
  macroZoom: boolean;
  onToggleMacroZoom: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectPreset: (presetId: string) => void;
  onUpdateTeam: (side: TeamSide, patch: Partial<Pick<TeamInfo, 'code' | 'name' | 'color'>>) => void;
  goalLog: GoalEvent[];
  onReplayGoal: (event: GoalEvent) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  activeTab,
  onTabChange,
  presetId,
  competition,
  venue,
  matchMinute,
  home,
  away,
  homeScore,
  awayScore,
  selectedHomeScorer,
  selectedAwayScorer,
  onSelectScorer,
  onTriggerGoal,
  autoSimulate,
  onToggleAutoSimulate,
  onResetMatch,
  cutoutStyle,
  onChangeCutoutStyle,
  glowIntensity,
  onChangeGlowIntensity,
  screenContext,
  onChangeScreenContext,
  wallpaperId,
  onChangeWallpaper,
  macroZoom,
  onToggleMacroZoom,
  soundEnabled,
  onToggleSound,
  onSelectPreset,
  onUpdateTeam,
  goalLog,
  onReplayGoal,
}) => {
  const renderTeamGoalControl = (
    side: TeamSide,
    team: TeamInfo,
    score: number,
    selectedScorer: string
  ) => {
    const lightAccent = isLightColor(team.color);

    return (
      <div className="flex flex-col justify-between rounded-2xl bg-slate-50/90 border border-slate-200/80 p-4">
        {/* Team Header Row */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="h-5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: team.color }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-slate-900 truncate">
                  {team.name}
                </p>
                <p className="text-xs text-slate-500">
                  {side === 'home' ? 'Left of camera' : 'Right of camera'} · {team.code}
                </p>
              </div>
            </div>
            <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums shrink-0">
              {score}
            </span>
          </div>

          {/* Scorer Selector */}
          <div className="mt-3.5">
            <label
              htmlFor={`scorer-input-${side}`}
              className="block text-xs font-medium text-slate-500 mb-1.5"
            >
              Goal scorer
            </label>
            <input
              id={`scorer-input-${side}`}
              type="text"
              value={selectedScorer}
              onChange={(e) => onSelectScorer(side, e.target.value)}
              maxLength={24}
              placeholder="Player name"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
            />
            {/* Quick Squad Pickers */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {team.scorers.slice(0, 4).map((player) => {
                const isSelected = selectedScorer === player;
                return (
                  <button
                    key={player}
                    type="button"
                    onClick={() => onSelectScorer(side, player)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {player}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary Goal Trigger Button */}
        <button
          type="button"
          onClick={() => onTriggerGoal(side)}
          className="mt-4 w-full min-h-[44px] px-4 py-2.5 rounded-xl font-display text-sm font-semibold transition-all duration-150 active:scale-[0.98] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          style={{
            backgroundColor: team.color,
            color: lightAccent ? '#0F172A' : '#FFFFFF',
            boxShadow: `0 6px 18px -6px ${hexToRgba(team.color, 0.55)}`,
          }}
        >
          Score {team.code} Goal
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Primary Interactive Card: Live Match Goal Triggers */}
      <section className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {/* Match Context Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              Collapsed Camera Cutout Scoreboard
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              <span>{competition}</span>
              <span aria-hidden="true"> · </span>
              <span>{venue}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono font-medium text-slate-700 tabular-nums">
                {matchMinute}&apos;
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleAutoSimulate}
              className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                autoSimulate
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {autoSimulate ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Stop Auto</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Auto Match</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onResetMatch}
              aria-label="Reset match score and timeline"
              title="Reset match"
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two Side-by-Side Goal Triggers */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderTeamGoalControl('home', home, homeScore, selectedHomeScorer)}
          {renderTeamGoalControl('away', away, awayScore, selectedAwayScorer)}
        </div>
      </section>

      {/* Secondary Studio Configuration Card with Segmented Tabs */}
      <section className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {/* Segmented Tab Controls */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div
            role="tablist"
            aria-label="Cutout configuration sections"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100"
          >
            {(
              [
                { id: 'display', label: 'Cutout & Display' },
                { id: 'fixtures', label: 'Fixtures & Colors' },
                { id: 'timeline', label: `Goal Log (${goalLog.length})` },
              ] as { id: StudioTab; label: string }[]
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Cutout Hardware & Visual Display Controls */}
        {activeTab === 'display' && (
          <div className="mt-5 space-y-5">
            {/* Cutout Geometry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Camera cutout style</p>
                <p className="text-xs text-slate-500">
                  Both modes remain strictly collapsed at 36px height
                </p>
              </div>
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 shrink-0 self-start sm:self-auto">
                {(
                  [
                    { id: 'unified', label: 'Unified Pill' },
                    { id: 'split', label: 'Punch-Hole Wings' },
                  ] as { id: CutoutStyle; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeCutoutStyle(opt.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      cutoutStyle === opt.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-slate-100" />

            {/* Glow Intensity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Goal glow intensity</p>
                <p className="text-xs text-slate-500">
                  Luminous team-color border sweep and outer halo
                </p>
              </div>
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 shrink-0 self-start sm:self-auto">
                {(
                  [
                    { id: 'subtle', label: 'Subtle' },
                    { id: 'vibrant', label: 'Vibrant' },
                    { id: 'stadium', label: 'Stadium' },
                  ] as { id: GlowIntensity; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeGlowIntensity(opt.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      glowIntensity === opt.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-slate-100" />

            {/* Phone Screen Context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Phone screen background</p>
                <p className="text-xs text-slate-500">
                  Preview cutout contrast over dark wallpapers or light apps
                </p>
              </div>
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 shrink-0 self-start sm:self-auto">
                {(
                  [
                    { id: 'lockscreen', label: 'Lock' },
                    { id: 'homescreen', label: 'Home' },
                    { id: 'article', label: 'Light App' },
                  ] as { id: PhoneScreenContext; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeScreenContext(opt.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      screenContext === opt.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-slate-100" />

            {/* Bottom Utility Row: Wallpaper, Macro Zoom, Sound */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100">
                {(
                  [
                    { id: 'stadium', label: 'Stadium Dusk' },
                    { id: 'obsidian', label: 'Obsidian Silk' },
                  ] as { id: WallpaperId; label: string }[]
                ).map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => {
                      onChangeWallpaper(wp.id);
                      if (screenContext === 'article') {
                        onChangeScreenContext('lockscreen');
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      wallpaperId === wp.id && screenContext !== 'article'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {wp.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleMacroZoom}
                  className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    macroZoom
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {macroZoom ? (
                    <>
                      <ZoomOut className="w-3.5 h-3.5" />
                      <span>1× Full Phone</span>
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>1.5× Cutout Zoom</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onToggleSound}
                  className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    soundEnabled
                      ? 'bg-white text-slate-900 border-slate-300'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700'
                  }`}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Chime On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Muted</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Match Presets & Custom Team Colors */}
        {activeTab === 'fixtures' && (
          <div className="mt-5 space-y-6">
            {/* Curated Fixtures */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2.5">
                Quick derby presets
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FIXTURE_PRESETS.map((fixture) => {
                  const selected = fixture.id === presetId;
                  return (
                    <button
                      key={fixture.id}
                      type="button"
                      onClick={() => onSelectPreset(fixture.id)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: fixture.home.color }}
                        />
                        <span className="font-display text-xs font-semibold whitespace-nowrap">
                          {fixture.home.code}
                        </span>
                        <span
                          className={`text-[11px] ${
                            selected ? 'text-white/50' : 'text-slate-400'
                          }`}
                        >
                          v
                        </span>
                        <span className="font-display text-xs font-semibold whitespace-nowrap">
                          {fixture.away.code}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: fixture.away.color }}
                        />
                      </div>
                      <span
                        className={`text-[11px] truncate ml-2 ${
                          selected ? 'text-white/70' : 'text-slate-500'
                        }`}
                      >
                        {fixture.competition}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-[1px] bg-slate-100" />

            {/* Custom Team Code & Color Editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {(
                [
                  { side: 'home' as TeamSide, label: 'Left team (Home)', team: home },
                  { side: 'away' as TeamSide, label: 'Right team (Away)', team: away },
                ]
              ).map(({ side, label, team }) => (
                <div key={side} className="space-y-3">
                  <p className="text-xs font-semibold text-slate-600">{label}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      aria-label={`${label} 3-letter code`}
                      value={team.code}
                      onChange={(e) =>
                        onUpdateTeam(side, {
                          code: e.target.value.toUpperCase().slice(0, 4),
                        })
                      }
                      maxLength={4}
                      className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs font-bold uppercase text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                    <label className="relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-slate-300">
                      <input
                        type="color"
                        aria-label={`${label} custom color`}
                        value={team.color}
                        onChange={(e) => onUpdateTeam(side, { color: e.target.value })}
                        className="w-4 h-4 rounded border-0 bg-transparent p-0 cursor-pointer"
                      />
                      <span className="font-mono text-[11px] text-slate-600 uppercase">
                        {team.color}
                      </span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TEAM_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        aria-label={`Set ${label} color to ${swatch.name}`}
                        title={swatch.name}
                        onClick={() => onUpdateTeam(side, { color: swatch.hex })}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          team.color.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'ring-2 ring-offset-2 ring-slate-900 scale-105'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Goal Event Log with Replay */}
        {activeTab === 'timeline' && (
          <div className="mt-5">
            {goalLog.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-slate-700">No goals recorded yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Score a goal above or tap either side of the camera cutout to preview the
                  collapsed celebration glow.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto pr-1">
                {goalLog.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-6 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: event.teamColor }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {event.scorer}
                        </p>
                        <p className="text-xs text-slate-500">
                          <span className="font-mono tabular-nums">{event.minute}&apos;</span>
                          <span aria-hidden="true"> · </span>
                          <span>{event.teamCode}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">
                            {event.homeScore}–{event.awayScore}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onReplayGoal(event)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Replay</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
