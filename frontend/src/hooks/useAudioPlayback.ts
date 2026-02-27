import { useRef, useCallback, useEffect } from 'react';
import { getNoteFrequency } from '../utils/fingeringMap';

interface AudioPlaybackHook {
  playNote: (pitch: string, durationMs: number, customSampleUrl?: string) => Promise<void>;
  stopAll: () => void;
  isReady: boolean;
}

export function useAudioPlayback(): AudioPlaybackHook {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<AudioNode[]>([]);

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const stopAll = useCallback(() => {
    activeNodesRef.current.forEach((node) => {
      try {
        if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
          node.stop();
        }
      } catch {
        // already stopped
      }
    });
    activeNodesRef.current = [];
  }, []);

  const synthesizeOcarina = useCallback((ctx: AudioContext, frequency: number, durationMs: number): Promise<void> => {
    return new Promise((resolve) => {
      const duration = durationMs / 1000;
      const now = ctx.currentTime;

      // Create a warm, flute-like tone using multiple oscillators
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      masterGain.gain.setValueAtTime(0.35, now + duration - 0.08);
      masterGain.gain.linearRampToValueAtTime(0, now + duration);

      // Fundamental
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, now);

      // Second harmonic (softer)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(frequency * 2, now);
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.15, now);

      // Third harmonic (very soft)
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(frequency * 3, now);
      const gain3 = ctx.createGain();
      gain3.gain.setValueAtTime(0.05, now);

      // Slight vibrato
      const vibrato = ctx.createOscillator();
      vibrato.type = 'sine';
      vibrato.frequency.setValueAtTime(5.5, now);
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.setValueAtTime(0, now);
      vibratoGain.gain.linearRampToValueAtTime(frequency * 0.008, now + 0.15);
      vibratoGain.gain.setValueAtTime(frequency * 0.008, now + duration - 0.05);
      vibratoGain.gain.linearRampToValueAtTime(0, now + duration);

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);

      osc2.connect(gain2);
      osc3.connect(gain3);
      gain2.connect(masterGain);
      gain3.connect(masterGain);
      osc1.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      vibrato.start(now);

      osc1.stop(now + duration + 0.01);
      osc2.stop(now + duration + 0.01);
      osc3.stop(now + duration + 0.01);
      vibrato.stop(now + duration + 0.01);

      activeNodesRef.current.push(osc1, osc2, osc3, vibrato);

      osc1.onended = () => {
        activeNodesRef.current = activeNodesRef.current.filter(n => n !== osc1);
        resolve();
      };
    });
  }, []);

  const playCustomSample = useCallback(async (ctx: AudioContext, url: string, durationMs: number): Promise<void> => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      return new Promise((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(ctx.currentTime);
        source.stop(ctx.currentTime + durationMs / 1000 + 0.05);

        activeNodesRef.current.push(source);
        source.onended = () => {
          activeNodesRef.current = activeNodesRef.current.filter(n => n !== source);
          resolve();
        };
      });
    } catch {
      // Fall back to synthesized
      const frequency = getNoteFrequency('C5');
      return synthesizeOcarina(ctx, frequency, durationMs);
    }
  }, [synthesizeOcarina]);

  const playNote = useCallback(async (pitch: string, durationMs: number, customSampleUrl?: string): Promise<void> => {
    const ctx = getAudioContext();
    const frequency = getNoteFrequency(pitch);

    if (customSampleUrl) {
      return playCustomSample(ctx, customSampleUrl, durationMs);
    }

    return synthesizeOcarina(ctx, frequency, durationMs);
  }, [getAudioContext, synthesizeOcarina, playCustomSample]);

  useEffect(() => {
    return () => {
      stopAll();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [stopAll]);

  return {
    playNote,
    stopAll,
    isReady: true,
  };
}
