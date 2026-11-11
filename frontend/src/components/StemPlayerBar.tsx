import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Mic2,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useIsMobile } from '../hooks/useIsMobile';

export const StemPlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    repeatMode,
    isSingMode,
    vocalIntensity,
    isSeparating,
    separationProgress,
    isProcessingUpload,
    togglePlay,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    nextTrack,
    prevTrack,
    toggleSingMode,
    setScreen,
  } = usePlayerStore();

  const isMobile = useIsMobile();

  if (!currentTrack || isProcessingUpload) return null;

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveDuration = duration || currentTrack.duration || 0;
  const progressPercent = effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;

  // Mobile Compact Bottom Bar
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 60, // Sits directly above bottom nav bar
          left: 8,
          right: 8,
          height: 60,
          background: 'rgba(18, 21, 30, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          zIndex: 80,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Micro progress line at top of player pill */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 12,
            right: 12,
            height: 2,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: isSingMode ? 'linear-gradient(90deg, #00e599, #8b5cf6)' : '#00e599',
            }}
          />
        </div>

        {/* Track Info (Tap expands to Now Playing) */}
        <div
          onClick={() => setScreen('now_playing')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden', cursor: 'pointer' }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              overflow: 'hidden',
              flexShrink: 0,
              background: '#222634',
            }}
          >
            {currentTrack.artwork_url ? (
              <img src={currentTrack.artwork_url} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic2 size={18} color="#64748b" />
              </div>
            )}
          </div>

          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentTrack.title}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentTrack.artist}
            </div>
          </div>
        </div>

        {/* Action Controls: Sing Mode Pill + Play/Pause */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleSingMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 16,
              border: isSingMode ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.1)',
              background: isSingMode ? 'rgba(0, 229, 153, 0.2)' : 'rgba(255,255,255,0.05)',
              color: isSingMode ? '#00e599' : '#cbd5e1',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={12} color={isSingMode ? '#00e599' : '#a855f7'} />
            <span>{isSingMode ? 'SING' : 'ORIG'}</span>
          </button>

          <button
            onClick={togglePlay}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#00e599',
              border: 'none',
              color: '#08090c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isPlaying ? <Pause size={18} fill="#08090c" /> : <Play size={18} fill="#08090c" style={{ marginLeft: 2 }} />}
          </button>
        </div>
      </div>
    );
  }

  // Desktop Standard Full Player Bar
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 84,
        background: '#0d0f15',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* 1. Track Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, maxWidth: '30%' }}>
        <div
          onClick={() => setScreen('now_playing')}
          style={{
            position: 'relative',
            width: 52,
            height: 52,
            borderRadius: 8,
            overflow: 'hidden',
            cursor: 'pointer',
            flexShrink: 0,
            background: '#1a1d26',
          }}
        >
          {currentTrack.artwork_url ? (
            <img
              src={currentTrack.artwork_url}
              alt={currentTrack.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <Mic2 size={24} />
            </div>
          )}
        </div>

        <div style={{ overflow: 'hidden' }}>
          <div
            onClick={() => setScreen('now_playing')}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
            }}
          >
            {currentTrack.title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentTrack.artist}
          </div>
        </div>
      </div>

      {/* 2. Playback Controls & Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '42%', maxWidth: 600 }}>
        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 6 }}>
          <button
            onClick={toggleShuffle}
            style={{ background: 'none', border: 'none', color: isShuffle ? '#00e599' : '#64748b', cursor: 'pointer' }}
          >
            <Shuffle size={16} />
          </button>

          <button
            onClick={prevTrack}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#00e599',
              border: 'none',
              color: '#08090c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 14px rgba(0, 229, 153, 0.4)',
            }}
          >
            {isPlaying ? <Pause size={18} fill="#08090c" /> : <Play size={18} fill="#08090c" style={{ marginLeft: 2 }} />}
          </button>

          <button
            onClick={nextTrack}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
          >
            <SkipForward size={20} />
          </button>

          <button
            onClick={cycleRepeat}
            style={{ background: 'none', border: 'none', color: repeatMode !== 'off' ? '#00e599' : '#64748b', cursor: 'pointer' }}
          >
            {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Seek Bar */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', width: 34, textAlign: 'right', fontFamily: 'monospace' }}>
            {formatTime(currentTime)}
          </span>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              seek(pct * effectiveDuration);
            }}
            style={{
              flex: 1,
              height: 4,
              background: '#222634',
              borderRadius: 2,
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: isSingMode ? 'linear-gradient(90deg, #00e599, #8b5cf6)' : '#00e599',
                borderRadius: 2,
              }}
            />
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', width: 34, fontFamily: 'monospace' }}>
            {formatTime(effectiveDuration)}
          </span>
        </div>
      </div>

      {/* 3. Sing Mode Quick Toggle, Volume & Screen Expand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={toggleSingMode}
          title={isSingMode ? 'Sing Mode is ON (Original vocals muted)' : 'Turn ON Sing Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            borderRadius: 20,
            border: isSingMode ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.12)',
            background: isSingMode ? 'rgba(0, 229, 153, 0.15)' : 'rgba(255,255,255,0.04)',
            color: isSingMode ? '#00e599' : '#e2e8f0',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            boxShadow: isSingMode ? '0 0 15px rgba(0, 229, 153, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles size={14} color={isSingMode ? '#00e599' : '#a855f7'} />
          <span>{isSeparating ? `AI ${Math.round(separationProgress)}%` : isSingMode ? 'Sing Mode ON' : 'Sing Mode'}</span>
        </button>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: 70, accentColor: '#00e599' }}
          />
        </div>

        {/* Karaoke View Shortcut */}
        <button
          onClick={() => setScreen('karaoke')}
          title="Open Karaoke View"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: '#cbd5e1',
            padding: 8,
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
};
