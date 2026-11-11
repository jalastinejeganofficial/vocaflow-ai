import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Sparkles,
  Mic,
  FileText,
  Gauge,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { VocalSlider } from '../components/VocalSlider';

export const NowPlayingScreen: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    isShuffle,
    repeatMode,
    isSingMode,
    vocalIntensity,
    isSeparating,
    separationProgress,
    separationMessage,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
    toggleShuffle,
    cycleRepeat,
    nextTrack,
    prevTrack,
    toggleSingMode,
    setVocalIntensity,
    setScreen,
  } = usePlayerStore();

  const isMobile = useIsMobile();

  if (!currentTrack) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
        No track currently playing. Select a song from your library.
      </div>
    );
  }

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveDuration = duration || currentTrack.duration || 0;
  const progressPercent = effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const speeds = [0.75, 1.0, 1.25, 1.5];

  const artworkSize = isMobile ? Math.min(220, window.innerWidth * 0.55) : 280;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '16px 16px 140px' : '24px 20px 120px' }}>
      {/* Top Bar with Mode Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isPlaying ? '#00e599' : '#64748b',
              boxShadow: isPlaying ? '0 0 10px #00e599' : 'none',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isSingMode ? 'AI SING MODE' : 'ORIGINAL STUDIO MASTER'}
          </span>
        </div>

        {/* Karaoke Shortcut */}
        <button
          onClick={() => setScreen('karaoke')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <FileText size={13} color="#00e599" />
          <span>Karaoke View</span>
        </button>
      </div>

      {/* Main Center Area: Artwork & Visualizer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <div
          style={{
            position: 'relative',
            width: artworkSize,
            height: artworkSize,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: isSingMode
              ? '0 0 40px rgba(0, 229, 153, 0.25), 0 0 25px rgba(139, 92, 246, 0.2)'
              : '0 20px 40px rgba(0, 0, 0, 0.6)',
            marginBottom: 16,
            border: isSingMode ? '2px solid rgba(0, 229, 153, 0.4)' : '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.3s ease',
          }}
        >
          {currentTrack.artwork_url ? (
            <img
              src={currentTrack.artwork_url}
              alt={currentTrack.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#1c202e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={48} color="#64748b" />
            </div>
          )}

          {isSingMode && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                right: 8,
                background: 'rgba(8, 9, 12, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: 10,
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid rgba(0, 229, 153, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#00e599' }}>
                <Sparkles size={11} />
                <span>Sing Mode</span>
              </div>
              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                {Math.round(vocalIntensity * 100)}% Vocals
              </span>
            </div>
          )}
        </div>

        {/* Title and Artist */}
        <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, textAlign: 'center', marginBottom: 4, padding: '0 10px' }}>
          {currentTrack.title}
        </h1>
        <div style={{ fontSize: isMobile ? 13 : 15, color: '#94a3b8', textAlign: 'center', marginBottom: 14 }}>
          {currentTrack.artist} • <span style={{ color: '#64748b' }}>{currentTrack.album}</span>
        </div>

        {/* Live Audio Visualizer */}
        <div style={{ width: '100%', maxWidth: 500, marginBottom: 16 }}>
          <AudioVisualizer height={isMobile ? 48 : 64} />
        </div>
      </div>

      {/* Prominent Sing Mode Button & AI Progress Bar */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <button
          onClick={toggleSingMode}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: isMobile ? '12px 24px' : '14px 32px',
            borderRadius: 30,
            border: isSingMode ? '2px solid #00e599' : '1px solid rgba(139, 92, 246, 0.4)',
            background: isSingMode
              ? 'linear-gradient(135deg, rgba(0, 229, 153, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: isMobile ? 14 : 16,
            cursor: 'pointer',
            boxShadow: isSingMode ? '0 0 25px rgba(0, 229, 153, 0.35)' : 'none',
          }}
        >
          <Sparkles size={18} color={isSingMode ? '#00e599' : '#c084fc'} />
          <span>{isSingMode ? 'Sing Mode ON (Vocals Muted)' : 'Activate AI Sing Mode'}</span>
        </button>

        {isSeparating && (
          <div style={{ marginTop: 10, maxWidth: 360, margin: '10px auto 0' }}>
            <div style={{ fontSize: 11, color: '#00e599', fontWeight: 600, marginBottom: 4 }}>
              {separationMessage}
            </div>
            <div style={{ width: '100%', height: 4, background: '#1c202e', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${separationProgress}%`,
                  height: '100%',
                  background: '#00e599',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Vocal Intensity Slider */}
      <div style={{ marginBottom: 24 }}>
        <VocalSlider
          value={vocalIntensity}
          onChange={(val) => setVocalIntensity(val)}
        />
      </div>

      {/* Progress & Seek Bar */}
      <div style={{ marginBottom: 20 }}>
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            seek(pct * effectiveDuration);
          }}
          style={{
            height: 6,
            background: '#1c202e',
            borderRadius: 3,
            cursor: 'pointer',
            position: 'relative',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: isSingMode ? 'linear-gradient(90deg, #00e599, #8b5cf6)' : '#00e599',
              borderRadius: 3,
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(effectiveDuration)}</span>
        </div>
      </div>

      {/* Transport Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 18 : 28, marginBottom: 24 }}>
        <button
          onClick={toggleShuffle}
          style={{ background: 'none', border: 'none', color: isShuffle ? '#00e599' : '#64748b', cursor: 'pointer', padding: 8 }}
        >
          <Shuffle size={isMobile ? 18 : 20} />
        </button>

        <button
          onClick={prevTrack}
          style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 8 }}
        >
          <SkipBack size={isMobile ? 22 : 26} />
        </button>

        <button
          onClick={togglePlay}
          style={{
            width: isMobile ? 52 : 58,
            height: isMobile ? 52 : 58,
            borderRadius: '50%',
            background: '#00e599',
            border: 'none',
            color: '#08090c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 25px rgba(0, 229, 153, 0.4)',
          }}
        >
          {isPlaying ? <Pause size={isMobile ? 22 : 26} fill="#08090c" /> : <Play size={isMobile ? 22 : 26} fill="#08090c" style={{ marginLeft: 3 }} />}
        </button>

        <button
          onClick={nextTrack}
          style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 8 }}
        >
          <SkipForward size={isMobile ? 22 : 26} />
        </button>

        <button
          onClick={cycleRepeat}
          style={{ background: 'none', border: 'none', color: repeatMode !== 'off' ? '#00e599' : '#64748b', cursor: 'pointer', padding: 8 }}
        >
          {repeatMode === 'one' ? <Repeat1 size={isMobile ? 18 : 20} /> : <Repeat size={isMobile ? 18 : 20} />}
        </button>
      </div>

      {/* Auxiliary Controls (Speed, Volume) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '0 8px' : '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Gauge size={14} color="#94a3b8" />
          <div style={{ display: 'flex', gap: 4 }}>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackRate(s)}
                style={{
                  padding: '3px 6px',
                  borderRadius: 6,
                  border: playbackRate === s ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.06)',
                  background: playbackRate === s ? 'rgba(0, 229, 153, 0.15)' : 'transparent',
                  color: playbackRate === s ? '#00e599' : '#94a3b8',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Volume2 size={15} color="#94a3b8" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: isMobile ? 60 : 90, accentColor: '#00e599' }}
          />
        </div>
      </div>
    </div>
  );
};
