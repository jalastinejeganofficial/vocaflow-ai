import React, { useEffect, useState } from 'react';
import {
  Settings,
  HardDrive,
  Cpu,
  Mic,
  Shield,
  Wifi,
  Trash2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { AppSettings } from '../types';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.warn('Load settings err:', err);
    }
  };

  const handleQualityChange = async (quality: 'fast' | 'balanced' | 'high') => {
    if (!settings) return;
    setSettings({ ...settings, separation_quality: quality });
    await api.updateSettings({ separation_quality: quality });
    setSaveStatus('Separation quality updated.');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear cached instrumental stems? They will be re-separated when needed.')) {
      setIsClearing(true);
      try {
        await api.clearCache();
        await loadSettings();
        setSaveStatus('Instrumental stem cache cleared.');
      } finally {
        setIsClearing(false);
        setTimeout(() => setSaveStatus(null), 2500);
      }
    }
  };

  const handleOfflineToggle = async () => {
    if (!settings) return;
    const next = !settings.offline_mode;
    setSettings({ ...settings, offline_mode: next });
    await api.updateSettings({ offline_mode: next });
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px 120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Settings</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
            Audio engine configuration, AI models, storage cache, and offline mode.
          </p>
        </div>

        {saveStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00e599', fontSize: 13, fontWeight: 700 }}>
            <Check size={16} />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* AI Separation Engine Quality */}
        <div style={{ background: '#12151e', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Cpu size={20} color="#00e599" />
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>AI Separation Processing Quality</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { id: 'fast', label: 'Fast (~3s)', desc: 'Instant spectral filter for instant karaoke playback' },
              { id: 'balanced', label: 'Balanced (Demucs)', desc: 'Hybrid Transformer Demucs deep neural network' },
              { id: 'high', label: 'High Quality (2 Shifts)', desc: 'Equivariant stabilization with multi-shift passes' },
            ].map((q) => {
              const isSelected = settings?.separation_quality === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => handleQualityChange(q.id as any)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: isSelected ? '2px solid #00e599' : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(0, 229, 153, 0.12)' : 'rgba(255,255,255,0.02)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#00e599' : '#fff', marginBottom: 4 }}>
                    {q.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{q.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Local Storage & Cache Management */}
        <div style={{ background: '#12151e', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HardDrive size={20} color="#3b82f6" />
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>Local Storage & Caching</h2>
            </div>
            <button
              onClick={handleClearCache}
              disabled={isClearing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: 12,
                fontWeight: 700,
                cursor: isClearing ? 'wait' : 'pointer',
              }}
            >
              <Trash2 size={14} />
              <span>{isClearing ? 'Clearing...' : 'Clear Instrumental Cache'}</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>AUDIO FILES</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
                {settings?.storage.audio_mb || 0} MB
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>SEPARATED STEMS</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#00e599', marginTop: 4 }}>
                {settings?.storage.stems_mb || 0} MB
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>RECORDINGS</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
                {settings?.storage.recordings_mb || 0} MB
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>TOTAL USAGE</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
                {settings?.storage.total_mb || 0} MB
              </div>
            </div>
          </div>
        </div>

        {/* Offline Mode & Network */}
        <div style={{ background: '#12151e', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wifi size={20} color="#8b5cf6" />
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Local-First Offline Playback</h2>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Operate 100% offline using locally cached audio, instrumentals, and on-device pitch evaluation.
                </p>
              </div>
            </div>

            <button
              onClick={handleOfflineToggle}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: settings?.offline_mode ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.1)',
                background: settings?.offline_mode ? 'rgba(0, 229, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                color: settings?.offline_mode ? '#00e599' : '#94a3b8',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {settings?.offline_mode ? 'OFFLINE READY' : 'ONLINE MODE'}
            </button>
          </div>
        </div>

        {/* Mobile Server Connection */}
        <div style={{ background: '#12151e', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Settings size={20} color="#00e599" />
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Mobile App Backend Host</h2>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
            When running on Android APK, specify your PC's IP address (e.g. <code>http://192.168.1.50:8000</code> or <code>http://10.0.2.2:8000</code> for emulator). Leave empty for default.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="e.g. http://192.168.1.50:8000"
              defaultValue={localStorage.getItem('vocaflow_api_host') || ''}
              id="serverHostInput"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                const val = (document.getElementById('serverHostInput') as HTMLInputElement)?.value.trim();
                if (val) {
                  localStorage.setItem('vocaflow_api_host', val);
                } else {
                  localStorage.removeItem('vocaflow_api_host');
                }
                setSaveStatus('Backend server host updated. Reloading...');
                setTimeout(() => window.location.reload(), 1000);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: '#00e599',
                color: '#08090d',
                fontWeight: 700,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* App Version & Legal Compliance Note */}
        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
            VocaFlow AI Engine v1.0.0 • Legal & Content Notice
          </div>
          VocaFlow AI is engineered for user-imported audio that the user owns or is authorized to process.
          All audio source separation and evaluation happen securely on your local system.
        </div>
      </div>
    </div>
  );
};

