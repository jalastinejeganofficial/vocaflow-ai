import { VoiceEffects } from '../types';

export class EffectsEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  
  // Audio Nodes
  private highpassFilter: BiquadFilterNode | null = null;
  private eqLow: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqHigh: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWet: GainNode | null = null;
  private vocalGain: GainNode | null = null;
  private monitorGain: GainNode | null = null;
  private micAnalyser: AnalyserNode | null = null;

  public async startMicrophone(): Promise<MediaStream> {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.setupNodes();
    return this.micStream;
  }

  private setupNodes() {
    if (!this.ctx || !this.micStream) return;

    this.micSource = this.ctx.createMediaStreamSource(this.micStream);
    
    // 1. High-pass filter (cuts rumble below 80Hz)
    this.highpassFilter = this.ctx.createBiquadFilter();
    this.highpassFilter.type = 'highpass';
    this.highpassFilter.frequency.value = 80;

    // 2. 3-Band Parametric EQ
    this.eqLow = this.ctx.createBiquadFilter();
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 250;
    this.eqLow.gain.value = 0;

    this.eqMid = this.ctx.createBiquadFilter();
    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 2000;
    this.eqMid.Q.value = 1.0;
    this.eqMid.gain.value = 0;

    this.eqHigh = this.ctx.createBiquadFilter();
    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 6000;
    this.eqHigh.gain.value = 0;

    // 3. Compressor (Studio Vocal Leveling)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // 4. Delay / Echo effect
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.2;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.3;
    this.delayWet = this.ctx.createGain();
    this.delayWet.gain.value = 0.0;

    // Delay loop
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);

    // 5. Studio Reverb (algorithmic impulse response)
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.generateReverbImpulse(1.8, 2.0);
    this.reverbWet = this.ctx.createGain();
    this.reverbWet.gain.value = 0.2;

    // 6. Master Vocal Volume & Monitoring
    this.vocalGain = this.ctx.createGain();
    this.vocalGain.gain.value = 1.0;

    this.monitorGain = this.ctx.createGain();
    this.monitorGain.gain.value = 0.0; // Disabled by default to prevent feedback

    // 7. Analyser for oscilloscope waveform
    this.micAnalyser = this.ctx.createAnalyser();
    this.micAnalyser.fftSize = 256;

    // Chain processing
    this.micSource
      .connect(this.highpassFilter)
      .connect(this.eqLow)
      .connect(this.eqMid)
      .connect(this.eqHigh)
      .connect(this.compressor)
      .connect(this.vocalGain);

    // Send to effects
    this.vocalGain.connect(this.delayNode);
    this.vocalGain.connect(this.reverbConvolver);

    // Mix dry + effects
    this.vocalGain.connect(this.micAnalyser);
    this.delayWet.connect(this.micAnalyser);
    this.reverbConvolver.connect(this.reverbWet);
    this.reverbWet.connect(this.micAnalyser);

    // Monitoring to speakers/headphones
    this.micAnalyser.connect(this.monitorGain);
    this.monitorGain.connect(this.ctx.destination);
  }

  private generateReverbImpulse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not ready");
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i;
      const factor = Math.pow(1 - n / length, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  public applyEffects(effects: VoiceEffects) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (this.reverbWet) {
      this.reverbWet.gain.setTargetAtTime(effects.reverb * 0.7, t, 0.05);
    }
    if (this.delayWet && this.delayNode && this.delayFeedback) {
      this.delayWet.gain.setTargetAtTime(effects.echoWet * 0.6, t, 0.05);
      this.delayNode.delayTime.setTargetAtTime(effects.echoDelay, t, 0.05);
      this.delayFeedback.gain.setTargetAtTime(effects.echoFeedback, t, 0.05);
    }
    if (this.eqLow) {
      this.eqLow.gain.setTargetAtTime(effects.eqLow, t, 0.05);
    }
    if (this.eqMid) {
      this.eqMid.gain.setTargetAtTime(effects.eqMid, t, 0.05);
    }
    if (this.eqHigh) {
      this.eqHigh.gain.setTargetAtTime(effects.eqHigh, t, 0.05);
    }
    if (this.vocalGain) {
      this.vocalGain.gain.setTargetAtTime(effects.vocalVolume, t, 0.05);
    }
    if (this.monitorGain) {
      this.monitorGain.gain.setTargetAtTime(effects.monitor ? 0.9 : 0.0, t, 0.05);
    }
  }

  public getMicWaveformData(): Uint8Array {
    if (!this.micAnalyser) return new Uint8Array(128);
    const data = new Uint8Array(this.micAnalyser.frequencyBinCount);
    this.micAnalyser.getByteTimeDomainData(data);
    return data;
  }

  public stopMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.monitorGain) {
      this.monitorGain.gain.value = 0.0;
    }
  }
}

export const globalEffectsEngine = new EffectsEngine();

