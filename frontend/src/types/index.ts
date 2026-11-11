export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  original_path: string;
  artwork_path?: string;
  artwork_url?: string;
  stream_url?: string;
  instrumental_url?: string;
  vocal_url?: string;
  format: string;
  sample_rate: number;
  channels: number;
  has_stems: boolean;
  status: string;
  play_count: number;
  is_favorite: boolean;
  created_at?: string;
}

export interface LyricWord {
  word: string;
  start: number;
  end: number;
}

export interface LyricLine {
  time: number;
  text: string;
  words?: LyricWord[];
}

export interface LyricsData {
  track_id: string;
  format: string;
  raw_content: string;
  lines: LyricLine[];
}

export interface SeparationStatus {
  job_id: string;
  track_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  quality: string;
  model: string;
  error_message?: string;
}

export interface VoiceEffects {
  reverb: number; // 0 to 1
  echoDelay: number; // 0.05 to 0.5s
  echoFeedback: number; // 0 to 0.8
  echoWet: number; // 0 to 1
  eqLow: number; // -12 to +12 dB
  eqMid: number; // -12 to +12 dB
  eqHigh: number; // -12 to +12 dB
  noiseGate: number; // -60 to -20 dB
  vocalVolume: number; // 0 to 2
  monitor: boolean;
}

export interface PitchDataPoint {
  time: number;
  user_pitch?: number;
  ref_pitch?: number;
}

export interface EvaluationReport {
  id: string;
  recording_id: string;
  track_id: string;
  overall_score: number;
  pitch_score: number;
  timing_score: number;
  rhythm_score: number;
  stability_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  pitch_contour: PitchDataPoint[];
  created_at: string;
}

export interface AppSettings {
  storage: {
    audio_mb: number;
    stems_mb: number;
    recordings_mb: number;
    total_mb: number;
  };
  separation_quality: 'fast' | 'balanced' | 'high';
  separation_model: string;
  offline_mode: boolean;
  audio_latency: string;
  version: string;
}

