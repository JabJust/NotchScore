package com.example

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.SweepGradient
import android.graphics.Typeface
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.view.animation.LinearInterpolator

/**
 * Lightweight, hardware-accelerated custom View that renders the strictly collapsed
 * 36dp camera cutout scoreboard directly over the device's physical camera cutout.
 */
class CutoutOverlayView(context: Context) : View(context) {

    private var uiState: ScoreboardUiState = ScoreboardRepository.state.value
    private var beamAngle = 0f
    private var leftHalfDp = 104f
    private var rightHalfDp = 104f

    private val density = resources.displayMetrics.density
    private val pillHeightPx = 36f * density
    private val topOffsetPx = 10f * density
    private val rectF = RectF()
    private val innerRectF = RectF()
    private val barRectF = RectF()
    private val sweepMatrix = Matrix()

    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#06070A")
        style = Paint.Style.FILL
    }

    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 2f * density
    }

    private val glowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val tintPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val barPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
        textSize = 12f * density
    }

    private val scorePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
        textSize = 15f * density
    }

    private val minutePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
        textSize = 10.5f * density
    }

    private val beamAnimator = ValueAnimator.ofFloat(0f, 360f).apply {
        duration = 1700L
        repeatCount = ValueAnimator.INFINITE
        interpolator = LinearInterpolator()
        addUpdateListener { anim ->
            beamAngle = anim.animatedValue as Float
            invalidate()
        }
    }

    private var widthAnimator: ValueAnimator? = null

    init {
        setLayerType(LAYER_TYPE_SOFTWARE, null)
    }

    fun updateState(newState: ScoreboardUiState) {
        val oldPhase = uiState.goalPhase
        uiState = newState

        val isCelebrating = newState.goalPhase != GoalPhase.IDLE && newState.activeGoal != null
        val isHomeGoal = isCelebrating && newState.activeGoal?.side == TeamSide.HOME
        val isAwayGoal = isCelebrating && newState.activeGoal?.side == TeamSide.AWAY

        val targetLeft = when {
            newState.goalPhase == GoalPhase.SCORER && isHomeGoal -> 168f
            newState.goalPhase == GoalPhase.FLASH && isHomeGoal -> 122f
            isAwayGoal -> 90f
            else -> 104f
        }

        val targetRight = when {
            newState.goalPhase == GoalPhase.SCORER && isAwayGoal -> 168f
            newState.goalPhase == GoalPhase.FLASH && isAwayGoal -> 122f
            isHomeGoal -> 90f
            else -> 104f
        }

        if (isCelebrating && !beamAnimator.isRunning) {
            beamAnimator.start()
        } else if (!isCelebrating && beamAnimator.isRunning) {
            beamAnimator.cancel()
        }

        if (oldPhase != newState.goalPhase || targetLeft != leftHalfDp || targetRight != rightHalfDp) {
            val startL = leftHalfDp
            val startR = rightHalfDp
            widthAnimator?.cancel()
            widthAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
                duration = 320L
                interpolator = DecelerateInterpolator(2.2f)
                addUpdateListener { anim ->
                    val f = anim.animatedValue as Float
                    leftHalfDp = startL + (targetLeft - startL) * f
                    rightHalfDp = startR + (targetRight - startR) * f
                    invalidate()
                }
                start()
            }
        } else {
            invalidate()
        }
    }

    override fun onDetachedFromWindow() {
        beamAnimator.cancel()
        widthAnimator?.cancel()
        super.onDetachedFromWindow()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val cx = width / 2f
        val top = topOffsetPx
        val bottom = top + pillHeightPx
        val radius = pillHeightPx / 2f

        val leftPx = (cx - leftHalfDp * density).coerceAtLeast(12f * density)
        val rightPx = (cx + rightHalfDp * density).coerceAtMost(width - 12f * density)

        val state = uiState
        val activeGoal = state.activeGoal
        val isCelebrating = state.goalPhase != GoalPhase.IDLE && activeGoal != null
        val glowColor = activeGoal?.teamColorHex?.toInt() ?: Color.WHITE
        val homeColor = state.home.colorHex.toInt()
        val awayColor = state.away.colorHex.toInt()

        rectF.set(leftPx, top, rightPx, bottom)

        // 1. Outer team-color luminous glow halo during goal
        if (isCelebrating) {
            val blurRadius = when (state.glowIntensity) {
                GlowIntensity.SUBTLE -> 12f * density
                GlowIntensity.VIBRANT -> 20f * density
                GlowIntensity.STADIUM -> 28f * density
            }
            glowPaint.color = withAlpha(glowColor, 185)
            glowPaint.maskFilter = BlurMaskFilter(blurRadius, BlurMaskFilter.Blur.OUTER)
            canvas.drawRoundRect(rectF, radius, radius, glowPaint)
            glowPaint.maskFilter = null
        }

        // 2. Pitch-black OLED collapsed capsule
        canvas.drawRoundRect(rectF, radius, radius, bgPaint)

        // 3. Subtle team color ambient end washes inside the capsule
        canvas.save()
        innerRectF.set(leftPx, top, rightPx, bottom)
        val leftWash = LinearGradient(
            leftPx, 0f, cx, 0f,
            withAlpha(homeColor, if (isCelebrating && activeGoal?.side == TeamSide.HOME) 92 else 42),
            Color.TRANSPARENT,
            Shader.TileMode.CLAMP
        )
        tintPaint.shader = leftWash
        canvas.drawRoundRect(innerRectF, radius, radius, tintPaint)

        val rightWash = LinearGradient(
            rightPx, 0f, cx, 0f,
            withAlpha(awayColor, if (isCelebrating && activeGoal?.side == TeamSide.AWAY) 92 else 42),
            Color.TRANSPARENT,
            Shader.TileMode.CLAMP
        )
        tintPaint.shader = rightWash
        canvas.drawRoundRect(innerRectF, radius, radius, tintPaint)
        tintPaint.shader = null
        canvas.restore()

        // 4. Perimeter border (rotating luminous team-color beam on goal)
        if (isCelebrating) {
            val sweep = SweepGradient(
                cx,
                (top + bottom) / 2f,
                intArrayOf(
                    Color.TRANSPARENT,
                    glowColor,
                    Color.WHITE,
                    glowColor,
                    Color.TRANSPARENT
                ),
                floatArrayOf(0f, 0.22f, 0.32f, 0.45f, 0.72f)
            )
            sweepMatrix.setRotate(beamAngle, cx, (top + bottom) / 2f)
            sweep.setLocalMatrix(sweepMatrix)
            borderPaint.shader = sweep
            borderPaint.color = glowColor
        } else {
            borderPaint.shader = null
            borderPaint.color = Color.argb(32, 255, 255, 255)
        }
        canvas.drawRoundRect(rectF, radius, radius, borderPaint)

        // 5. Left Wing: Color bar + Home code/GOAL/Scorer + Home Score (left of center camera)
        val camExclusion = 17f * density
        val cy = (top + bottom) / 2f
        val barH = if (isCelebrating && activeGoal?.side == TeamSide.HOME) 19f * density else 14f * density
        barPaint.color = homeColor
        barRectF.set(leftPx + 9f * density, cy - barH / 2f, leftPx + 12.5f * density, cy + barH / 2f)
        canvas.drawRoundRect(barRectF, 2f * density, 2f * density, barPaint)

        val homeDim = isCelebrating && activeGoal?.side == TeamSide.AWAY
        scorePaint.alpha = if (homeDim) 120 else 255
        textPaint.alpha = if (homeDim) 120 else 255

        val homeScoreText = state.homeScore.toString()
        val homeScoreX = cx - camExclusion - scorePaint.measureText(homeScoreText) - 8f * density
        canvas.drawText(homeScoreText, homeScoreX, cy + 5f * density, scorePaint)

        val leftLabelX = leftPx + 19f * density
        if (isCelebrating && activeGoal?.side == TeamSide.HOME && state.goalPhase == GoalPhase.FLASH) {
            canvas.drawText("GOAL!", leftLabelX, cy + 4.5f * density, textPaint)
        } else if (isCelebrating && activeGoal?.side == TeamSide.HOME && state.goalPhase == GoalPhase.SCORER) {
            val label = "${activeGoal.scorer} ${activeGoal.minute}'"
            canvas.drawText(label.take(15), leftLabelX, cy + 4.5f * density, textPaint)
        } else {
            canvas.drawText(state.home.code, leftLabelX, cy + 4.5f * density, textPaint)
        }

        // 6. Right Wing: Away Score + Away code/GOAL/Scorer + Color bar (right of center camera)
        val awayBarH = if (isCelebrating && activeGoal?.side == TeamSide.AWAY) 19f * density else 14f * density
        barPaint.color = awayColor
        barRectF.set(rightPx - 12.5f * density, cy - awayBarH / 2f, rightPx - 9f * density, cy + awayBarH / 2f)
        canvas.drawRoundRect(barRectF, 2f * density, 2f * density, barPaint)

        val awayDim = isCelebrating && activeGoal?.side == TeamSide.HOME
        scorePaint.alpha = if (awayDim) 120 else 255
        textPaint.alpha = if (awayDim) 120 else 255

        val awayScoreText = state.awayScore.toString()
        val awayScoreX = cx + camExclusion + 8f * density
        canvas.drawText(awayScoreText, awayScoreX, cy + 5f * density, scorePaint)

        val awayText = when {
            isCelebrating && activeGoal?.side == TeamSide.AWAY && state.goalPhase == GoalPhase.FLASH -> "GOAL!"
            isCelebrating && activeGoal?.side == TeamSide.AWAY && state.goalPhase == GoalPhase.SCORER ->
                "${activeGoal.scorer} ${activeGoal.minute}'".take(15)
            else -> state.away.code
        }
        val awayTextW = textPaint.measureText(awayText)
        canvas.drawText(awayText, rightPx - 19f * density - awayTextW, cy + 4.5f * density, textPaint)

        // Reset alpha for minutePaint reference
        minutePaint.alpha = 255
    }

    private fun withAlpha(color: Int, alpha: Int): Int {
        return Color.argb(alpha.coerceIn(0, 255), Color.red(color), Color.green(color), Color.blue(color))
    }
}
