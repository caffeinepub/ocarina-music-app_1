import { useCallback, useRef } from "react";

const NOTE_FREQUENCIES: Record<string, number> = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  "F#3": 185.0,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  "F#5": 739.99,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
  F6: 1396.91,
  "F#6": 1479.98,
  G6: 1567.98,
};

type WebAudioWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

export function useOcarinaSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const W = window as WebAudioWindow;
      const Ctor = W.AudioContext || W.webkitAudioContext;
      if (!Ctor) throw new Error("Web Audio API not supported");
      audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playNote = useCallback(
    async (note: string, sampleUrl?: string) => {
      const ctx = getCtx();
      const freq = NOTE_FREQUENCIES[note] ?? 523.25;
      const now = ctx.currentTime;

      // Try custom sample first
      if (sampleUrl) {
        try {
          const res = await fetch(sampleUrl);
          const ab = await res.arrayBuffer();
          const buf = await ctx.decodeAudioData(ab);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(now);
          return;
        } catch {
          // fall through to synthesis
        }
      }

      // Master gain + ADSR envelope
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.36, now + 0.03); // attack 30ms
      masterGain.gain.linearRampToValueAtTime(0.28, now + 0.12); // decay
      masterGain.gain.setValueAtTime(0.28, now + 0.5); // sustain
      masterGain.gain.linearRampToValueAtTime(0, now + 0.8); // release

      // Soft low-pass to emulate clay body resonance
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = freq * 5.5;
      lowpass.Q.value = 0.6;

      masterGain.connect(lowpass);
      lowpass.connect(ctx.destination);

      // Osc 1 — fundamental (triangle = softer than saw)
      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.value = freq;
      osc1.connect(masterGain);

      // Osc 2 — 2nd harmonic (adds body)
      const g2 = ctx.createGain();
      g2.gain.value = 0.13;
      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = freq * 2;
      osc2.connect(g2);
      g2.connect(masterGain);

      // Osc 3 — 3rd harmonic (faint, adds shimmer)
      const g3 = ctx.createGain();
      g3.gain.value = 0.04;
      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.value = freq * 3;
      osc3.connect(g3);
      g3.connect(masterGain);

      // Breath noise layered through bandpass (breathy flute character)
      const nSize = Math.floor(ctx.sampleRate * 0.9);
      const nBuf = ctx.createBuffer(1, nSize, ctx.sampleRate);
      const nData = nBuf.getChannelData(0);
      for (let i = 0; i < nSize; i++) nData[i] = Math.random() * 2 - 1;

      const nSrc = ctx.createBufferSource();
      nSrc.buffer = nBuf;

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq * 1.4;
      bp.Q.value = 4.0;

      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0, now);
      ng.gain.linearRampToValueAtTime(0.055, now + 0.06);
      ng.gain.linearRampToValueAtTime(0.03, now + 0.5);
      ng.gain.linearRampToValueAtTime(0, now + 0.8);

      nSrc.connect(bp);
      bp.connect(ng);
      ng.connect(masterGain);

      const dur = 0.9;
      osc1.start(now);
      osc1.stop(now + dur);
      osc2.start(now);
      osc2.stop(now + dur);
      osc3.start(now);
      osc3.stop(now + dur);
      nSrc.start(now);
      nSrc.stop(now + dur);
    },
    [getCtx],
  );

  return { playNote };
}
