// =====================================================
//  sfx.js — ЗВУКИ. Пиксельные «пики» генерируются кодом, без файлов.
//  По умолчанию звук выключен; включается в ⚙️ Настройках.
// =====================================================

let audioCtx = null;

function audio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Одна нота: частота «от → до», длительность, форма волны, громкость, задержка
function tone(from, to, dur, type = 'square', vol = 0.06, delay = 0) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Короткий шум (для «вжух» и стука)
function noise(dur, vol = 0.05, delay = 0, lowpass = 1200) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(lowpass, t);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
}

const SOUNDS = {
  coin:    () => { tone(988, 988, 0.07); tone(1319, 1319, 0.16, 'square', 0.06, 0.07); },
  ding:    () => { tone(1047, 1047, 0.25, 'sine', 0.08); tone(1568, 1568, 0.35, 'sine', 0.05, 0.12); },
  build:   () => { [0, 0.14, 0.28].forEach(d => { noise(0.08, 0.09, d, 600); tone(140, 90, 0.08, 'square', 0.05, d); }); },
  meow:    () => { tone(600, 900, 0.12, 'sine', 0.07); tone(900, 520, 0.22, 'sine', 0.07, 0.12); },
  whoosh:  () => { noise(0.35, 0.06, 0, 2500); tone(300, 700, 0.3, 'sine', 0.03); },
  upgrade: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.09, 'square', 0.05, i * 0.07)); },
  appear:  () => { [392, 523, 659].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.07, i * 0.08)); },
  sad:     () => { tone(500, 300, 0.35, 'triangle', 0.06); }
};

// Сыграть звук, если он включён
function sfx(name) {
  if (!state.settings || !state.settings.sound) return;
  try { SOUNDS[name] && SOUNDS[name](); } catch (e) { /* без звука — не страшно */ }
}

function toggleSound() {
  state.settings.sound = !state.settings.sound;
  if (state.settings.sound) sfx('coin');   // сразу слышно, что включилось
  saveGame();
}
