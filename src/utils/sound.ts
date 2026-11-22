let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a refined two-tone hardware chime + tactile low thump when a goal triggers.
 */
export function playGoalChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Subtle tactile low-end haptic pulse
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(140, now);
  subOsc.frequency.exponentialRampToValueAtTime(52, now + 0.16);
  subGain.gain.setValueAtTime(0.18, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  subOsc.start(now);
  subOsc.stop(now + 0.2);

  // 2. Crisp ascending harmonic chime (E5 -> B5)
  const notes = [
    { freq: 659.25, delay: 0.02, duration: 0.36, gain: 0.08 },
    { freq: 987.77, delay: 0.13, duration: 0.55, gain: 0.09 },
  ];

  notes.forEach(({ freq, delay, duration, gain }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + delay);
    g.gain.setValueAtTime(0.0001, now + delay);
    g.gain.linearRampToValueAtTime(gain, now + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, now + delay + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + duration + 0.02);
  });
}
