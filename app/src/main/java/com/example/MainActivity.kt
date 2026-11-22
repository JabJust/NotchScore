package com.example

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.attributes = window.attributes.apply {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes = window.attributes.apply {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }

        setContent {
            MyApplicationTheme {
                CutoutLiveScreen(
                    onToggleOverlay = { enable -> toggleSystemOverlay(enable) }
                )
            }
        }
    }

    private fun toggleSystemOverlay(enable: Boolean) {
        if (!enable) {
            stopService(Intent(this, CutoutOverlayService::class.java))
            ScoreboardRepository.setOverlayActive(false)
            return
        }
        if (!Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
        } else {
            startService(Intent(this, CutoutOverlayService::class.java))
        }
    }
}

@Composable
private fun CollapsedCameraCutoutBar(
    state: ScoreboardUiState,
    onQuickGoal: (TeamSide) -> Unit,
    modifier: Modifier = Modifier
) {
    val activeGoal = state.activeGoal
    val isCelebrating = state.goalPhase != GoalPhase.IDLE && activeGoal != null
    val isHomeGoal = isCelebrating && activeGoal?.side == TeamSide.HOME
    val isAwayGoal = isCelebrating && activeGoal?.side == TeamSide.AWAY

    val targetWidth = when {
        state.goalPhase == GoalPhase.SCORER -> 286.dp
        state.goalPhase == GoalPhase.FLASH -> 244.dp
        else -> 216.dp
    }

    val animatedWidth by animateDpAsState(
        targetValue = targetWidth,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMedium
        ),
        label = "cutoutWidth"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "glowSweep")
    val sweepAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1650, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "sweepAngle"
    )

    val homeColor = Color(state.home.colorHex)
    val awayColor = Color(state.away.colorHex)
    val glowColor = if (activeGoal != null) Color(activeGoal.teamColorHex) else Color.White

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(top = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .width(animatedWidth)
                .height(36.dp),
            contentAlignment = Alignment.Center
        ) {
            // Luminous team-color glow + OLED pitch-black collapsed capsule
            Canvas(modifier = Modifier.fillMaxSize()) {
                val corner = CornerRadius(size.height / 2f, size.height / 2f)

                if (isCelebrating) {
                    val glowAlpha = when (state.glowIntensity) {
                        GlowIntensity.SUBTLE -> 0.25f
                        GlowIntensity.VIBRANT -> 0.42f
                        GlowIntensity.STADIUM -> 0.62f
                    }
                    drawRoundRect(
                        color = glowColor.copy(alpha = glowAlpha),
                        topLeft = Offset(-6.dp.toPx(), -5.dp.toPx()),
                        size = Size(size.width + 12.dp.toPx(), size.height + 10.dp.toPx()),
                        cornerRadius = CornerRadius(size.height, size.height)
                    )
                }

                // Pitch-black capsule base
                drawRoundRect(
                    color = Color(0xFF06070A),
                    cornerRadius = corner
                )

                // Dual-side team ambient washes
                drawRoundRect(
                    brush = Brush.horizontalGradient(
                        colors = listOf(
                            homeColor.copy(alpha = if (isHomeGoal) 0.34f else 0.14f),
                            Color.Transparent
                        ),
                        startX = 0f,
                        endX = size.width * 0.46f
                    ),
                    cornerRadius = corner
                )
                drawRoundRect(
                    brush = Brush.horizontalGradient(
                        colors = listOf(
                            Color.Transparent,
                            awayColor.copy(alpha = if (isAwayGoal) 0.34f else 0.14f)
                        ),
                        startX = size.width * 0.54f,
                        endX = size.width
                    ),
                    cornerRadius = corner
                )

                // Rotating perimeter team-color glow border on goal
                if (isCelebrating) {
                    rotate(degrees = sweepAngle, pivot = center) {
                        drawRoundRect(
                            brush = Brush.sweepGradient(
                                colors = listOf(
                                    Color.Transparent,
                                    glowColor,
                                    Color.White,
                                    glowColor,
                                    Color.Transparent
                                ),
                                center = center
                            ),
                            cornerRadius = corner,
                            style = Stroke(width = 1.8.dp.toPx())
                        )
                    }
                } else {
                    drawRoundRect(
                        color = Color.White.copy(alpha = 0.10f),
                        cornerRadius = corner,
                        style = Stroke(width = 1.dp.toPx())
                    )
                }
            }

            // Strictly collapsed single-line row flanking the physical camera lens
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Left side (Home)
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onQuickGoal(TeamSide.HOME) }
                        .padding(end = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .width(3.5.dp)
                                .height(if (isHomeGoal) 19.dp else 14.dp)
                                .clip(CircleShape)
                                .background(homeColor)
                        )
                        val homeLabel = when {
                            isHomeGoal && state.goalPhase == GoalPhase.FLASH -> "GOAL!"
                            isHomeGoal && state.goalPhase == GoalPhase.SCORER && activeGoal != null ->
                                "${activeGoal.scorer} ${activeGoal.minute}'"
                            else -> state.home.code
                        }
                        Text(
                            text = homeLabel,
                            color = Color.White.copy(alpha = if (isAwayGoal) 0.45f else 0.96f),
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    AnimatedContent(
                        targetState = state.homeScore,
                        transitionSpec = {
                            (slideInVertically { it } + fadeIn()) togetherWith
                                (slideOutVertically { -it } + fadeOut())
                        },
                        label = "homeScore"
                    ) { score ->
                        Text(
                            text = score.toString(),
                            color = Color.White.copy(alpha = if (isAwayGoal) 0.45f else 1f),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Center Camera Lens Anchor
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF0A0F1A)),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(9.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF020409))
                    )
                }

                // Right side (Away)
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onQuickGoal(TeamSide.AWAY) }
                        .padding(start = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    AnimatedContent(
                        targetState = state.awayScore,
                        transitionSpec = {
                            (slideInVertically { it } + fadeIn()) togetherWith
                                (slideOutVertically { -it } + fadeOut())
                        },
                        label = "awayScore"
                    ) { score ->
                        Text(
                            text = score.toString(),
                            color = Color.White.copy(alpha = if (isHomeGoal) 0.45f else 1f),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp, Alignment.End),
                        modifier = Modifier.weight(1f)
                    ) {
                        val awayLabel = when {
                            isAwayGoal && state.goalPhase == GoalPhase.FLASH -> "GOAL!"
                            isAwayGoal && state.goalPhase == GoalPhase.SCORER && activeGoal != null ->
                                "${activeGoal.scorer} ${activeGoal.minute}'"
                            else -> state.away.code
                        }
                        Text(
                            text = awayLabel,
                            color = Color.White.copy(alpha = if (isHomeGoal) 0.45f else 0.96f),
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Box(
                            modifier = Modifier
                                .width(3.5.dp)
                                .height(if (isAwayGoal) 19.dp else 14.dp)
                                .clip(CircleShape)
                                .background(awayColor)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CutoutLiveScreen(
    onToggleOverlay: (Boolean) -> Unit
) {
    val state by ScoreboardRepository.state.collectAsState()
    val context = LocalContext.current
    val hasOverlayPerm = Settings.canDrawOverlays(context)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF3F4F6))
    ) {
        // Pinned collapsed camera cutout scoreboard at exact top edge of display
        CollapsedCameraCutoutBar(
            state = state,
            onQuickGoal = { side -> ScoreboardRepository.triggerGoal(side) },
            modifier = Modifier.align(Alignment.TopCenter)
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 64.dp),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Cutout Live",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0F172A)
                    )
                    Text(
                        text = "${state.competition} · ${state.venue} · ${state.matchMinute}'",
                        fontSize = 13.sp,
                        color = Color(0xFF64748B)
                    )
                }
            }

            // System-wide overlay control card
            item {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color.White,
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "System Camera Overlay",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF0F172A)
                            )
                            Text(
                                text = if (hasOverlayPerm) {
                                    "Float collapsed scoreboard over any app"
                                } else {
                                    "Grant Draw Over Other Apps permission"
                                },
                                fontSize = 12.sp,
                                color = Color(0xFF64748B)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Button(
                            onClick = { onToggleOverlay(!state.overlayActive) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (state.overlayActive) Color(0xFFDC2626) else Color(0xFF0F172A),
                                contentColor = Color.White
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = if (state.overlayActive) "Stop" else "Enable",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // Instant Goal Triggers (Home & Away)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    TeamTriggerCard(
                        side = TeamSide.HOME,
                        team = state.home,
                        score = state.homeScore,
                        selectedScorer = state.selectedHomeScorer,
                        onSelectScorer = { ScoreboardRepository.selectScorer(TeamSide.HOME, it) },
                        onGoal = { ScoreboardRepository.triggerGoal(TeamSide.HOME) },
                        modifier = Modifier.weight(1f)
                    )
                    TeamTriggerCard(
                        side = TeamSide.AWAY,
                        team = state.away,
                        score = state.awayScore,
                        selectedScorer = state.selectedAwayScorer,
                        onSelectScorer = { ScoreboardRepository.selectScorer(TeamSide.AWAY, it) },
                        onGoal = { ScoreboardRepository.triggerGoal(TeamSide.AWAY) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Derby Presets
            item {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color.White,
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Match Presets",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF0F172A)
                            )
                            OutlinedButton(
                                onClick = { ScoreboardRepository.resetMatch() },
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Reset", fontSize = 12.sp)
                            }
                        }

                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FixturePresets.all.forEach { preset ->
                                val selected = preset.id == state.presetId
                                Button(
                                    onClick = { ScoreboardRepository.selectPreset(preset.id) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (selected) Color(0xFF0F172A) else Color(0xFFF1F5F9),
                                        contentColor = if (selected) Color.White else Color(0xFF0F172A)
                                    ),
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                                ) {
                                    Text(
                                        text = "${preset.home.code} vs ${preset.away.code}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        HorizontalDivider(color = Color(0xFFF1F5F9))

                        Text(
                            text = "Glow Intensity",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF475569)
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            GlowIntensity.entries.forEach { level ->
                                val active = state.glowIntensity == level
                                Button(
                                    onClick = { ScoreboardRepository.setGlowIntensity(level) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (active) Color(0xFF0F172A) else Color(0xFFF1F5F9),
                                        contentColor = if (active) Color.White else Color(0xFF0F172A)
                                    ),
                                    shape = RoundedCornerShape(10.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = level.name.lowercase().replaceFirstChar { it.uppercase() },
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Recent Goals with Replay
            if (state.goalLog.isNotEmpty()) {
                item {
                    Text(
                        text = "Goal Log",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF0F172A)
                    )
                }
                items(state.goalLog, key = { it.id }) { goal ->
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color.White,
                        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .width(4.dp)
                                        .height(24.dp)
                                        .clip(CircleShape)
                                        .background(Color(goal.teamColorHex))
                                )
                                Column {
                                    Text(
                                        text = goal.scorer,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF0F172A)
                                    )
                                    Text(
                                        text = "${goal.minute}' · ${goal.teamCode} · ${goal.homeScore}–${goal.awayScore}",
                                        fontSize = 12.sp,
                                        color = Color(0xFF64748B)
                                    )
                                }
                            }
                            OutlinedButton(
                                onClick = { ScoreboardRepository.replayGoal(goal) },
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Replay", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TeamTriggerCard(
    side: TeamSide,
    team: TeamConfig,
    score: Int,
    selectedScorer: String,
    onSelectScorer: (String) -> Unit,
    onGoal: () -> Unit,
    modifier: Modifier = Modifier
) {
    val teamColor = Color(team.colorHex)
    val isLight = (0.299f * teamColor.red + 0.587f * teamColor.green + 0.114f * teamColor.blue) > 0.62f

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .width(4.dp)
                            .height(18.dp)
                            .clip(CircleShape)
                            .background(teamColor)
                    )
                    Column {
                        Text(
                            text = team.code,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF0F172A)
                        )
                        Text(
                            text = if (side == TeamSide.HOME) "Left" else "Right",
                            fontSize = 11.sp,
                            color = Color(0xFF64748B)
                        )
                    }
                }
                Text(
                    text = score.toString(),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0F172A)
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                team.scorers.take(3).forEach { player ->
                    val active = selectedScorer == player
                    Text(
                        text = player,
                        fontSize = 12.sp,
                        fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
                        color = if (active) Color(0xFF0F172A) else Color(0xFF64748B),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (active) Color(0xFFF1F5F9) else Color.Transparent)
                            .clickable { onSelectScorer(player) }
                            .padding(horizontal = 8.dp, vertical = 5.dp)
                    )
                }
            }

            Button(
                onClick = onGoal,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = teamColor,
                    contentColor = if (isLight) Color(0xFF0F172A) else Color.White
                ),
                shape = RoundedCornerShape(12.dp),
                contentPadding = PaddingValues(vertical = 10.dp)
            ) {
                Text(
                    text = "Goal ${team.code}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
