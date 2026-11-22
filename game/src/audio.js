// audio.js — WebAudio-synthesised sound effects. No audio files, no network:
// every sound is built from oscillators and noise at play time.
export function createAudio() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur + 0.02);
  }
  function noise(dur, vol, filterFreq) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filterFreq || 1200;
    const g = ac.createGain();
    g.gain.value = vol || 0.1;
    src.connect(f); f.connect(g); g.connect(ac.destination);
    src.start();
  }
  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    footstep(sneak) { if (!muted) noise(0.05, sneak ? 0.03 : 0.06, 500); },
    pickup() { tone(880, 0.12, 'sine', 0.14); setTimeout(() => tone(1318, 0.18, 'sine', 0.14), 90); },
    coin() { tone(2400, 0.08, 'square', 0.05); setTimeout(() => tone(1900, 0.1, 'square', 0.05), 70); },
    smoke() { noise(0.5, 0.12, 900); },
    spotted() { tone(220, 0.35, 'sawtooth', 0.12, 440); },
    alarmTick() { tone(1100, 0.09, 'square', 0.06); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.14), i * 130)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.32, 'triangle', 0.13), i * 150)); },
  };
}
