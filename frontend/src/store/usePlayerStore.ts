import { create } from 'zustand';
import { Track, SeparationStatus } from '../types';
import { globalAudioEngine } from '../audio/AudioEngine';
import { api, resolveUrl } from '../services/api';

export type ScreenType = 
  | 'welcome' 
  | 'home' 
  | 'library' 
  | 'now_playing' 
  | 'karaoke' 
  | 'sing_studio' 
  | 'report' 
  | 'settings';

interface PlayerState {
  currentScreen: ScreenType;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  
  // Sing Mode & Vocal Separation
  isSingMode: boolean;
  vocalIntensity: number; // 0.0 to 1.0
  separationJobId: string | null;
  separationProgress: number;
  isSeparating: boolean;
  separationMessage: string;

  // Actions
  setScreen: (screen: ScreenType) => void;
  loadLibrary: () => Promise<void>;
  playTrack: (track: Track) => Promise<void>;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleSingMode: () => Promise<void>;
  setVocalIntensity: (intensity: number) => void;
  pollSeparation: (jobId: string, trackId: string) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Bind Audio Engine updates
  globalAudioEngine.onTimeUpdate((time, dur) => {
    set({ currentTime: time, duration: dur });
  });

  globalAudioEngine.onStateChange((playing) => {
    set({ isPlaying: playing });
  });

  globalAudioEngine.onEnd(() => {
    const { repeatMode, currentTrack, nextTrack } = get();
    if (repeatMode === 'one' && currentTrack) {
      globalAudioEngine.seek(0);
      globalAudioEngine.play();
    } else if (repeatMode === 'all') {
      nextTrack();
    } else {
      set({ isPlaying: false });
    }
  });

  return {
    currentScreen: 'home',
    tracks: [],
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    playbackRate: 1.0,
    isShuffle: false,
    repeatMode: 'off',
    
    isSingMode: false,
    vocalIntensity: 1.0,
    separationJobId: null,
    separationProgress: 0,
    isSeparating: false,
    separationMessage: '',

    setScreen: (screen) => set({ currentScreen: screen }),

    loadLibrary: async () => {
      try {
        const tracks = await api.getLibrary();
        set({ tracks });
        // Set first track if none selected
        if (!get().currentTrack && tracks.length > 0) {
          set({ currentTrack: tracks[0] });
        }
      } catch (err) {
        console.error('Failed to load library:', err);
      }
    },

    playTrack: async (track) => {
      set({ 
        currentTrack: track, 
        isSingMode: false, 
        vocalIntensity: 1.0, 
        currentTime: 0 
      });
      globalAudioEngine.setSingMode(false);
      
      const streamUrl = track.stream_url ? resolveUrl(track.stream_url) : resolveUrl(`/api/audio/stream/${track.id}`);
      const instUrl = track.has_stems ? resolveUrl(`/api/audio/stems/${track.id}/instrumental`) : undefined;

      await globalAudioEngine.loadTrack(streamUrl, instUrl, true);
      api.recordHistory(track.id, 100, 'normal').catch(() => {});
    },

    togglePlay: () => {
      const { isPlaying, currentTrack, tracks, playTrack } = get();
      if (!currentTrack && tracks.length > 0) {
        playTrack(tracks[0]);
        return;
      }
      if (isPlaying) {
        globalAudioEngine.pause();
      } else {
        globalAudioEngine.play();
      }
    },

    seek: (seconds) => {
      globalAudioEngine.seek(seconds);
      set({ currentTime: seconds });
    },

    setVolume: (vol) => {
      globalAudioEngine.setVolume(vol);
      set({ volume: vol });
    },

    setPlaybackRate: (rate) => {
      globalAudioEngine.setPlaybackRate(rate);
      set({ playbackRate: rate });
    },

    toggleShuffle: () => {
      set((state) => ({ isShuffle: !state.isShuffle }));
    },

    cycleRepeat: () => {
      set((state) => {
        const next = state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off';
        return { repeatMode: next };
      });
    },

    nextTrack: () => {
      const { tracks, currentTrack, isShuffle, playTrack } = get();
      if (tracks.length === 0) return;
      
      let nextIndex = 0;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } else if (currentTrack) {
        const curIdx = tracks.findIndex((t) => t.id === currentTrack.id);
        nextIndex = (curIdx + 1) % tracks.length;
      }
      playTrack(tracks[nextIndex]);
    },

    prevTrack: () => {
      const { tracks, currentTrack, currentTime, seek, playTrack } = get();
      if (currentTime > 3) {
        seek(0);
        return;
      }
      if (tracks.length === 0) return;
      
      let prevIndex = tracks.length - 1;
      if (currentTrack) {
        const curIdx = tracks.findIndex((t) => t.id === currentTrack.id);
        prevIndex = (curIdx - 1 + tracks.length) % tracks.length;
      }
      playTrack(tracks[prevIndex]);
    },

    toggleSingMode: async () => {
      const { currentTrack, isSingMode, tracks } = get();
      if (!currentTrack) return;

      const nextState = !isSingMode;

      // Check whether instrumental has already been generated
      if (currentTrack.has_stems || globalAudioEngine.getHasInstrumental()) {
        // Instant seamless switch at same timestamp!
        globalAudioEngine.setSingMode(nextState);
        set({ 
          isSingMode: nextState, 
          vocalIntensity: nextState ? 0.0 : 1.0 
        });
        if (nextState) {
          api.recordHistory(currentTrack.id, 100, 'sing_mode').catch(() => {});
        }
      } else {
        // Stems not generated yet: start AI vocal separation!
        set({ isSingMode: true, isSeparating: true, separationMessage: 'AI Vocal Separation started...' });
        try {
          const res = await api.startSeparation(currentTrack.id, 'balanced', 'htdemucs');
          set({ separationJobId: res.job_id });
          get().pollSeparation(res.job_id, currentTrack.id);
        } catch (e: any) {
          set({ isSeparating: false, separationMessage: `Separation failed: ${e.message}` });
        }
      }
    },

    setVocalIntensity: (intensity) => {
      globalAudioEngine.setVocalIntensity(intensity);
      set({ 
        vocalIntensity: intensity, 
        isSingMode: intensity < 0.99 
      });
    },

    pollSeparation: (jobId, trackId) => {
      const interval = setInterval(async () => {
        try {
          const status = await api.getSeparationStatus(jobId);
          set({ 
            separationProgress: status.progress,
            separationMessage: `Separating stems: ${Math.round(status.progress)}%` 
          });

          if (status.status === 'completed') {
            clearInterval(interval);
            const result = await api.getSeparationResult(jobId);
            
            // Attach generated instrumental to Deck B without pausing playback!
            if (result.instrumental_url) {
              globalAudioEngine.attachInstrumental(resolveUrl(result.instrumental_url));
              globalAudioEngine.setSingMode(true);
            }

            // Update track in store
            set((state) => ({
              isSeparating: false,
              isSingMode: true,
              vocalIntensity: 0.0,
              separationProgress: 100,
              separationMessage: 'Separation complete! Sing Mode active.',
              currentTrack: state.currentTrack ? { ...state.currentTrack, has_stems: true } : null,
              tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, has_stems: true } : t)),
            }));
          } else if (status.status === 'failed' || status.status === 'cancelled') {
            clearInterval(interval);
            set({ 
              isSeparating: false, 
              separationMessage: `Error: ${status.error_message || 'Separation failed'}` 
            });
          }
        } catch (e) {
          clearInterval(interval);
          set({ isSeparating: false, separationMessage: 'Polling connection error' });
        }
      }, 1000);
    },
  };
});
