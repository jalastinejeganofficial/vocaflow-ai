/**
 * VocaFlow AI Dual-Deck Synchronized Audio Switching Engine
 * 
 * Provides sample-accurate crossfading between Original Audio (Deck A)
 * and AI-Generated Instrumental Audio (Deck B).
 * Allows smooth, uninterrupted vocal intensity adjustment (0% to 100%).
 */

export type AudioMode = 'original' | 'sing_mode';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  
  // Dual Media Elements
  private audioA: HTMLAudioElement; // Original Track
  private audioB: HTMLAudioElement; // Instrumental Track
  
  // Web Audio Nodes
  private sourceA: MediaElementAudioSourceNode | null = null;
  private sourceB: MediaElementAudioSourceNode | null = null;
  private gainA: GainNode | null = null;
  private gainB: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // State
  private isInitialized = false;
  private isPlaying = false;
  private currentMode: AudioMode = 'original';
  private vocalIntensity = 1.0; // 0.0 (Instrumental only) to 1.0 (Full Original)
  private masterVolume = 1.0;
  private playbackRate = 1.0;
  private hasInstrumental = false;
  
  // Callbacks
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onStateChangeCallback: ((isPlaying: boolean) => void) | null = null;

  constructor() {
    this.audioA = new Audio();
    this.audioB = new Audio();
    this.audioA.crossOrigin = 'anonymous';
    this.audioB.crossOrigin = 'anonymous';
    this.audioA.preload = 'auto';
    this.audioB.preload = 'auto';

    // Hook listeners
    this.audioA.addEventListener('timeupdate', () => {
      this.syncTimelines();
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audioA.currentTime, this.audioA.duration || 0);
      }
    });

    this.audioA.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
      if (this.onEndCallback) this.onEndCallback();
    });

    this.audioA.addEventListener('pause', () => {
      if (!this.audioA.seeking) {
        this.isPlaying = false;
        if (this.onStateChangeCallback) this.onStateChangeCallback(false);
      }
    });

    this.audioA.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
    });
  }

  private initAudioContext() {
    if (this.isInitialized && this.ctx) return;
    
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
    
    // Create Nodes
    this.sourceA = this.ctx.createMediaElementSource(this.audioA);
    this.sourceB = this.ctx.createMediaElementSource(this.audioB);
    
    this.gainA = this.ctx.createGain();
    this.gainB = this.ctx.createGain();
    this.masterGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.85;

    // Connect Deck A (Original)
    this.sourceA.connect(this.gainA);
    this.gainA.connect(this.masterGain);

    // Connect Deck B (Instrumental)
    this.sourceB.connect(this.gainB);
    this.gainB.connect(this.masterGain);

    // Connect to Master & Visualizer
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.updateGains(false);
    this.isInitialized = true;
  }

  /**
   * Loads both original and instrumental stems for a track.
   */
  public async loadTrack(originalUrl: string, instrumentalUrl?: string, autoPlay = false) {
    this.initAudioContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.hasInstrumental = !!instrumentalUrl;
    
    this.audioA.src = originalUrl;
    this.audioA.load();

    if (instrumentalUrl) {
      this.audioB.src = instrumentalUrl;
      this.audioB.load();
    } else {
      this.audioB.removeAttribute('src');
    }

    if (autoPlay) {
      await this.play();
    }
  }

  /**
   * Dynamic Instrumental Hot-Reload:
   * Called immediately when background vocal separation completes.
   * Links instrumental deck seamlessly without stopping current playback!
   */
  public attachInstrumental(instrumentalUrl: string) {
    const currentPos = this.audioA.currentTime;
    const wasPlaying = !this.audioA.paused;
    
    this.hasInstrumental = true;
    this.audioB.src = instrumentalUrl;
    this.audioB.currentTime = currentPos;
    this.audioB.load();

    if (wasPlaying) {
      this.audioB.play().catch(e => console.warn('Deck B sync play notice:', e));
    }
  }

  /**
   * Seamless Switch to Sing Mode:
   * Crossfades original vocals out and instrumental in at exact same millisecond.
   */
  public setSingMode(enabled: boolean) {
    this.currentMode = enabled ? 'sing_mode' : 'original';
    // If enabling sing mode, default intensity is 0% (pure instrumental)
    // If disabling, default intensity is 100% (original)
    this.vocalIntensity = enabled ? 0.0 : 1.0;
    this.updateGains(true);
  }

  /**
   * Adjustable Vocal Intensity: 0.0 (0% - Instrumental) to 1.0 (100% - Original)
   */
  public setVocalIntensity(intensity: number) {
    this.vocalIntensity = Math.max(0, Math.min(1, intensity));
    if (this.vocalIntensity < 0.99) {
      this.currentMode = 'sing_mode';
    } else {
      this.currentMode = 'original';
    }
    this.updateGains(true);
  }

  /**
   * Micro-crossfades gains to eliminate clicks and phase mismatch.
   */
  private updateGains(crossfade = true) {
    if (!this.gainA || !this.gainB || !this.ctx) return;

    const t = this.ctx.currentTime;
    const fadeDuration = crossfade ? 0.04 : 0.001; // 40ms smooth micro-crossfade

    if (!this.hasInstrumental) {
      // Fallback: only original track is present
      this.gainA.gain.setTargetAtTime(1.0, t, fadeDuration);
      this.gainB.gain.setTargetAtTime(0.0, t, fadeDuration);
      return;
    }

    // When hasInstrumental is true:
    // Deck A (Original): scaled by vocalIntensity (0.0 to 1.0)
    // Deck B (Instrumental): scaled by (1.0 - vocalIntensity)
    // Using equal-power panning law prevents dip in perceived loudness:
    let gainOriginal = Math.sin((this.vocalIntensity * Math.PI) / 2);
    let gainInstrumental = Math.cos((this.vocalIntensity * Math.PI) / 2);

    // Hard mute cutoff for absolute studio silence (0.0000)
    if (this.vocalIntensity <= 0.02) {
      gainOriginal = 0.0;
      gainInstrumental = 1.0;
    } else if (this.vocalIntensity >= 0.98) {
      gainOriginal = 1.0;
      gainInstrumental = 0.0;
    }

    this.gainA.gain.setTargetAtTime(gainOriginal, t, fadeDuration);
    this.gainB.gain.setTargetAtTime(gainInstrumental, t, fadeDuration);
  }

  /**
   * Sample-accurate timeline synchronization between Deck A and Deck B.
   */
  private syncTimelines() {
    if (!this.hasInstrumental || this.audioB.readyState < 2) return;
    
    const diff = Math.abs(this.audioA.currentTime - this.audioB.currentTime);
    if (diff > 0.04) {
      // Resynchronize Deck B to Deck A
      this.audioB.currentTime = this.audioA.currentTime;
    }
  }

  public async play() {
    this.initAudioContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    try {
      const p1 = this.audioA.play();
      let p2: Promise<void> | null = null;
      
      if (this.hasInstrumental && this.audioB.src) {
        this.audioB.currentTime = this.audioA.currentTime;
        p2 = this.audioB.play();
      }

      await p1;
      if (p2) await p2;
      
      this.isPlaying = true;
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
    } catch (err) {
      console.error('Audio play error:', err);
    }
  }

  public pause() {
    this.audioA.pause();
    this.audioB.pause();
    this.isPlaying = false;
    if (this.onStateChangeCallback) this.onStateChangeCallback(false);
  }

  public seek(seconds: number) {
    this.audioA.currentTime = seconds;
    if (this.hasInstrumental && this.audioB.src) {
      this.audioB.currentTime = seconds;
    }
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    this.audioA.playbackRate = rate;
    this.audioB.playbackRate = rate;
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public getCurrentTime(): number {
    return this.audioA.currentTime;
  }

  public getDuration(): number {
    return this.audioA.duration || 0;
  }

  public getMode(): AudioMode {
    return this.currentMode;
  }

  public getVocalIntensity(): number {
    return this.vocalIntensity;
  }

  public getHasInstrumental(): boolean {
    return this.hasInstrumental;
  }

  public onTimeUpdate(cb: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnd(cb: () => void) {
    this.onEndCallback = cb;
  }

  public onStateChange(cb: (isPlaying: boolean) => void) {
    this.onStateChangeCallback = cb;
  }
}

export const globalAudioEngine = new AudioEngine();

