// Tiny WebAudio helper — happy/error/eat/win sounds, no assets needed.
let ctx: AudioContext | null = null;

const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
};

const tone = (freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15, when = 0) => {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
};

export const sounds = {
  resume: () => getCtx()?.resume(),
  eat: () => {
    tone(660, 0.08, "triangle", 0.18);
    tone(990, 0.1, "triangle", 0.14, 0.05);
  },
  correct: () => {
    tone(523, 0.1, "triangle", 0.18);
    tone(659, 0.1, "triangle", 0.18, 0.08);
    tone(784, 0.18, "triangle", 0.18, 0.16);
  },
  wrong: () => {
    tone(220, 0.18, "sawtooth", 0.12);
    tone(180, 0.22, "sawtooth", 0.1, 0.1);
  },
  win: () => {
    tone(523, 0.12, "triangle", 0.2);
    tone(659, 0.12, "triangle", 0.2, 0.1);
    tone(784, 0.12, "triangle", 0.2, 0.2);
    tone(1046, 0.3, "triangle", 0.22, 0.32);
  },
  tap: () => tone(880, 0.05, "square", 0.08),
};
