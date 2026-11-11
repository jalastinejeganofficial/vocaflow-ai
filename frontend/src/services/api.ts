import { Track, LyricsData, SeparationStatus, EvaluationReport, AppSettings } from '../types';

export const getApiBase = (): string => {
  if (typeof window === 'undefined') return '/api';

  // Direct desktop application or localhost backend hosting
  if (
    (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') &&
    window.location.port !== '' &&
    window.location.port !== '5173' &&
    window.location.port !== '3000'
  ) {
    return '/api';
  }

  const custom = localStorage.getItem('vocaflow_api_host');
  if (custom) return `${custom.replace(/\/$/, '')}/api`;
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (envApiUrl) {
    return `${(envApiUrl as string).replace(/\/$/, '')}/api`;
  }
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:' || (window.location.hostname === 'localhost' && window.location.port === '')) {
    return 'http://10.0.2.2:8000/api';
  }
  return '/api';
};

export const resolveUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
  const base = getApiBase();
  const host = base.replace(/\/api$/, '');
  return `${host}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const api = {
  // Library & Audio
  getLibrary: async (search = '', filter = 'all', sort = 'created_at'): Promise<Track[]> => {
    const res = await fetch(`${getApiBase()}/library?search=${encodeURIComponent(search)}&filter_type=${filter}&sort_by=${sort}`);
    if (!res.ok) throw new Error('Failed to load music library');
    return res.json();
  },

  uploadAudio: async (file: File, autoSeparate = true): Promise<Track> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${getApiBase()}/audio/upload?auto_separate=${autoSeparate}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let detail = 'Audio upload failed';
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          detail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {}
      throw new Error(detail);
    }
    return res.json();
  },

  toggleFavorite: async (trackId: string): Promise<{ id: string; is_favorite: boolean }> => {
    const res = await fetch(`${getApiBase()}/library/${trackId}/favorite`, { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  // AI Vocal Separation
  startSeparation: async (trackId: string, quality = 'balanced', model = 'htdemucs'): Promise<{ job_id: string; track_id: string }> => {
    const res = await fetch(`${getApiBase()}/separation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId, quality, model }),
    });
    if (!res.ok) throw new Error('Failed to start AI separation');
    return res.json();
  },

  getSeparationStatus: async (jobId: string): Promise<SeparationStatus> => {
    const res = await fetch(`${getApiBase()}/separation/status/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch separation status');
    return res.json();
  },

  getSeparationResult: async (jobId: string): Promise<any> => {
    const res = await fetch(`${getApiBase()}/separation/result/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch separation result');
    return res.json();
  },

  cancelSeparation: async (jobId: string): Promise<{ job_id: string; cancelled: boolean }> => {
    const res = await fetch(`${getApiBase()}/separation/${jobId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to cancel separation');
    return res.json();
  },

  // Lyrics
  getLyrics: async (trackId: string): Promise<LyricsData> => {
    const res = await fetch(`${getApiBase()}/lyrics/${trackId}`);
    if (!res.ok) throw new Error('Failed to fetch lyrics');
    return res.json();
  },

  importLyrics: async (trackId: string, rawContent: string, format = 'lrc'): Promise<LyricsData> => {
    const res = await fetch(`${getApiBase()}/lyrics/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId, raw_content: rawContent, format }),
    });
    if (!res.ok) throw new Error('Failed to import lyrics');
    return res.json();
  },

  // Recordings & AI Singing Evaluation
  saveRecording: async (trackId: string, duration: number, effects: any, audioBlob: Blob): Promise<any> => {
    const formData = new FormData();
    formData.append('track_id', trackId);
    formData.append('duration', duration.toString());
    formData.append('effects', JSON.stringify(effects));
    formData.append('audio_file', audioBlob, 'vocal_recording.webm');

    const res = await fetch(`${getApiBase()}/recording/save`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to save vocal recording');
    return res.json();
  },

  evaluateSinging: async (recordingId: string, trackId: string): Promise<EvaluationReport> => {
    const res = await fetch(`${getApiBase()}/singing/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recording_id: recordingId, track_id: trackId }),
    });
    if (!res.ok) throw new Error('AI singing evaluation failed');
    return res.json();
  },

  getLatestEvaluation: async (trackId: string): Promise<EvaluationReport> => {
    const res = await fetch(`${getApiBase()}/singing/latest/${trackId}`);
    if (!res.ok) throw new Error('No previous evaluation found');
    return res.json();
  },

  // Playback History
  recordHistory: async (trackId: string, completion = 100, mode = 'normal') => {
    await fetch(`${getApiBase()}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId, completion_percentage: completion, mode }),
    });
  },

  getHistory: async (): Promise<any[]> => {
    const res = await fetch(`${getApiBase()}/history`);
    if (!res.ok) return [];
    return res.json();
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch(`${getApiBase()}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settings: Partial<AppSettings>): Promise<any> => {
    const res = await fetch(`${getApiBase()}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  clearCache: async (): Promise<any> => {
    const res = await fetch(`${getApiBase()}/settings/clear-cache`, { method: 'POST' });
    return res.json();
  },
};

