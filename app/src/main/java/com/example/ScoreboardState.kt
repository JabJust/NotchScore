package com.example

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class TeamSide { HOME, AWAY }
enum class CutoutStyle { UNIFIED, SPLIT }
enum class GlowIntensity { SUBTLE, VIBRANT, STADIUM }
enum class GoalPhase { IDLE, FLASH, SCORER }

data class TeamConfig(
    val code: String,
    val name: String,
    val colorHex: Long,
    val scorers: List<String>
)

data class FixturePreset(
    val id: String,
    val competition: String,
    val venue: String,
    val minute: Int,
    val home: TeamConfig,
    val away: TeamConfig,
    val initialHomeScore: Int,
    val initialAwayScore: Int
)

data class GoalRecord(
    val id: Long,
    val side: TeamSide,
    val teamCode: String,
    val teamColorHex: Long,
    val scorer: String,
    val minute: Int,
    val homeScore: Int,
    val awayScore: Int
)

data class ScoreboardUiState(
    val presetId: String = FixturePresets.all.first().id,
    val competition: String = FixturePresets.all.first().competition,
    val venue: String = FixturePresets.all.first().venue,
    val matchMinute: Int = FixturePresets.all.first().minute,
    val home: TeamConfig = FixturePresets.all.first().home,
    val away: TeamConfig = FixturePresets.all.first().away,
    val homeScore: Int = FixturePresets.all.first().initialHomeScore,
    val awayScore: Int = FixturePresets.all.first().initialAwayScore,
    val selectedHomeScorer: String = FixturePresets.all.first().home.scorers.first(),
    val selectedAwayScorer: String = FixturePresets.all.first().away.scorers.first(),
    val cutoutStyle: CutoutStyle = CutoutStyle.UNIFIED,
    val glowIntensity: GlowIntensity = GlowIntensity.VIBRANT,
    val activeGoal: GoalRecord? = null,
    val goalPhase: GoalPhase = GoalPhase.IDLE,
    val goalLog: List<GoalRecord> = emptyList(),
    val overlayActive: Boolean = false
)

object FixturePresets {
    val all = listOf(
        FixturePreset(
            id = "ars-mci",
            competition = "Premier League",
            venue = "Emirates Stadium",
            minute = 64,
            initialHomeScore = 1,
            initialAwayScore = 1,
            home = TeamConfig(
                code = "ARS",
                name = "Arsenal",
                colorHex = 0xFFEF0107,
                scorers = listOf("B. Saka", "M. Ødegaard", "K. Havertz", "G. Martinelli")
            ),
            away = TeamConfig(
                code = "MCI",
                name = "Man City",
                colorHex = 0xFF6CABDD,
                scorers = listOf("E. Haaland", "P. Foden", "K. De Bruyne", "B. Silva")
            )
        ),
        FixturePreset(
            id = "rma-fcb",
            competition = "La Liga",
            venue = "Santiago Bernabéu",
            minute = 71,
            initialHomeScore = 2,
            initialAwayScore = 1,
            home = TeamConfig(
                code = "RMA",
                name = "Real Madrid",
                colorHex = 0xFFF4C430,
                scorers = listOf("K. Mbappé", "Vinícius Jr", "J. Bellingham", "Rodrygo")
            ),
            away = TeamConfig(
                code = "FCB",
                name = "Barcelona",
                colorHex = 0xFFC81D4E,
                scorers = listOf("L. Yamal", "R. Lewandowski", "Raphinha", "Pedri")
            )
        ),
        FixturePreset(
            id = "liv-che",
            competition = "Premier League",
            venue = "Anfield",
            minute = 58,
            initialHomeScore = 1,
            initialAwayScore = 0,
            home = TeamConfig(
                code = "LIV",
                name = "Liverpool",
                colorHex = 0xFFD00027,
                scorers = listOf("M. Salah", "L. Díaz", "D. Jota", "C. Gakpo")
            ),
            away = TeamConfig(
                code = "CHE",
                name = "Chelsea",
                colorHex = 0xFF2563EB,
                scorers = listOf("C. Palmer", "N. Jackson", "N. Madueke", "P. Neto")
            )
        ),
        FixturePreset(
            id = "acm-int",
            competition = "Serie A",
            venue = "San Siro",
            minute = 78,
            initialHomeScore = 1,
            initialAwayScore = 1,
            home = TeamConfig(
                code = "ACM",
                name = "AC Milan",
                colorHex = 0xFFE11D2E,
                scorers = listOf("R. Leão", "C. Pulisic", "Á. Morata", "T. Reijnders")
            ),
            away = TeamConfig(
                code = "INT",
                name = "Inter Milan",
                colorHex = 0xFF2B62F0,
                scorers = listOf("L. Martínez", "M. Thuram", "N. Barella", "F. Dimarco")
            )
        )
    )
}

object ScoreboardRepository {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var phaseJob: Job? = null

    private val _state = MutableStateFlow(ScoreboardUiState())
    val state: StateFlow<ScoreboardUiState> = _state.asStateFlow()

    fun selectPreset(presetId: String) {
        val preset = FixturePresets.all.firstOrNull { it.id == presetId } ?: return
        phaseJob?.cancel()
        _state.update { current ->
            current.copy(
                presetId = preset.id,
                competition = preset.competition,
                venue = preset.venue,
                matchMinute = preset.minute,
                home = preset.home,
                away = preset.away,
                homeScore = preset.initialHomeScore,
                awayScore = preset.initialAwayScore,
                selectedHomeScorer = preset.home.scorers.first(),
                selectedAwayScorer = preset.away.scorers.first(),
                activeGoal = null,
                goalPhase = GoalPhase.IDLE,
                goalLog = emptyList()
            )
        }
    }

    fun selectScorer(side: TeamSide, scorer: String) {
        _state.update { current ->
            if (side == TeamSide.HOME) current.copy(selectedHomeScorer = scorer)
            else current.copy(selectedAwayScorer = scorer)
        }
    }

    fun setCutoutStyle(style: CutoutStyle) {
        _state.update { it.copy(cutoutStyle = style) }
    }

    fun setGlowIntensity(intensity: GlowIntensity) {
        _state.update { it.copy(glowIntensity = intensity) }
    }

    fun setOverlayActive(active: Boolean) {
        _state.update { it.copy(overlayActive = active) }
    }

    fun resetMatch() {
        val current = _state.value
        val preset = FixturePresets.all.firstOrNull { it.id == current.presetId }
            ?: FixturePresets.all.first()
        phaseJob?.cancel()
        _state.update {
            it.copy(
                matchMinute = preset.minute,
                homeScore = preset.initialHomeScore,
                awayScore = preset.initialAwayScore,
                activeGoal = null,
                goalPhase = GoalPhase.IDLE,
                goalLog = emptyList()
            )
        }
    }

    fun triggerGoal(side: TeamSide) {
        val current = _state.value
        val nextMinute = (current.matchMinute + 1).coerceAtMost(90)
        val nextHome = if (side == TeamSide.HOME) current.homeScore + 1 else current.homeScore
        val nextAway = if (side == TeamSide.AWAY) current.awayScore + 1 else current.awayScore
        val team = if (side == TeamSide.HOME) current.home else current.away
        val chosenScorer = (if (side == TeamSide.HOME) current.selectedHomeScorer else current.selectedAwayScorer)
            .trim()
            .ifEmpty { team.scorers.first() }

        val record = GoalRecord(
            id = System.currentTimeMillis(),
            side = side,
            teamCode = team.code,
            teamColorHex = team.colorHex,
            scorer = chosenScorer,
            minute = nextMinute,
            homeScore = nextHome,
            awayScore = nextAway
        )

        val nextIdx = (team.scorers.indexOf(chosenScorer) + 1) % team.scorers.size
        val nextDefaultScorer = team.scorers[nextIdx]

        _state.update {
            it.copy(
                matchMinute = nextMinute,
                homeScore = nextHome,
                awayScore = nextAway,
                selectedHomeScorer = if (side == TeamSide.HOME) nextDefaultScorer else it.selectedHomeScorer,
                selectedAwayScorer = if (side == TeamSide.AWAY) nextDefaultScorer else it.selectedAwayScorer,
                goalLog = listOf(record) + it.goalLog
            )
        }

        playGoalAnimation(record)
    }

    fun replayGoal(record: GoalRecord) {
        playGoalAnimation(record.copy(id = System.currentTimeMillis()))
    }

    private fun playGoalAnimation(record: GoalRecord) {
        phaseJob?.cancel()
        phaseJob = scope.launch {
            _state.update { it.copy(activeGoal = record, goalPhase = GoalPhase.FLASH) }
            delay(920L)
            _state.update { it.copy(goalPhase = GoalPhase.SCORER) }
            delay(3700L)
            _state.update { it.copy(goalPhase = GoalPhase.IDLE) }
        }
    }
}
