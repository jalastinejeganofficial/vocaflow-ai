import { create } from 'zustand';
import { VoiceEffects, EvaluationReport } from '../types';
import { globalEffectsEngine } from '../audio/EffectsEngine';
import { globalMicCapture } from '../audio/MicrophoneCapture';
import { api } from '../services/api';

interface SingingState {
  isMicActive: boolean;
  isRecording: boolean;
  recordingDuration: number;
  lastRecordingBlob: Blob | null;
  lastRecordingId: string | null;
  isEvaluating: boolean;
  evaluationReport: EvaluationReport | null;
  
  effects: VoiceEffects;
  
  // Actions
  toggleMic: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: (trackId: string) => Promise<void>;
  updateEffects: (partial: Partial<VoiceEffects>) => void;
  evaluateLatestRecording: (trackId: string) => Promise<void>;
  setEvaluationReport: (report: EvaluationReport | null) => void;
}

export const useSingingStore = create<SingingState>((set, get) => ({
  isMicActive: false,
  isRecording: false,
  recordingDuration: 0,
  lastRecordingBlob: null,
  lastRecordingId: null,
  isEvaluating: false,
  evaluationReport: null,

  effects: {
    reverb: 0.35,
    echoDelay: 0.22,
    echoFeedback: 0.3,
    echoWet: 0.15,
    eqLow: 2,
    eqMid: 1,
    eqHigh: 3,
    noiseGate: -40,
    vocalVolume: 1.2,
    monitor: false,
  },

  toggleMic: async () => {
    const { isMicActive } = get();
    if (isMicActive) {
      globalEffectsEngine.stopMicrophone();
      set({ isMicActive: false });
    } else {
      try {
        const stream = await globalEffectsEngine.startMicrophone();
        globalEffectsEngine.applyEffects(get().effects);
        set({ isMicActive: true });
      } catch (err) {
        alert('Could not access microphone. Please allow microphone permissions.');
      }
    }
  },

  startRecording: async () => {
    let { isMicActive, toggleMic } = get();
    if (!isMicActive) {
      await toggleMic();
    }
    const stream = (globalEffectsEngine as any).micStream;
    if (!stream) return;

    globalMicCapture.startRecording(stream);
    set({ isRecording: true, recordingDuration: 0 });

    const timer = setInterval(() => {
      if (!get().isRecording) {
        clearInterval(timer);
        return;
      }
      set({ recordingDuration: globalMicCapture.getElapsedDuration() });
    }, 200);
  },

  stopRecording: async (trackId: string) => {
    try {
      const { blob, duration } = await globalMicCapture.stopRecording();
      set({ isRecording: false, lastRecordingBlob: blob, recordingDuration: duration });

      // Save recording to backend
      const res = await api.saveRecording(trackId, duration, get().effects, blob);
      set({ lastRecordingId: res.id });
    } catch (e) {
      console.error('Stop recording error:', e);
      set({ isRecording: false });
    }
  },

  updateEffects: (partial) => {
    set((state) => {
      const updated = { ...state.effects, ...partial };
      globalEffectsEngine.applyEffects(updated);
      return { effects: updated };
    });
  },

  evaluateLatestRecording: async (trackId: string) => {
    const { lastRecordingId } = get();
    if (!lastRecordingId) {
      throw new Error("No recording available to evaluate. Record your singing first!");
    }

    set({ isEvaluating: true });
    try {
      const report = await api.evaluateSinging(lastRecordingId, trackId);
      set({ evaluationReport: report, isEvaluating: false });
    } catch (e: any) {
      set({ isEvaluating: false });
      throw e;
    }
  },

  setEvaluationReport: (report) => set({ evaluationReport: report }),
}));

