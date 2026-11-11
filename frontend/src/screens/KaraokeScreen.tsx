import React, { useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Disc,
  CircleDot,
  Sparkles,
  ArrowLeft,
  Sliders,
  Award,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useSingingStore } from '../store/useSingingStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { LyricsDisplay } from '../components/LyricsDisplay';
import { VocalSlider } from '../components/VocalSlider';
import { api } from '../services/api';
import { LyricLine } from '../types';

export const KaraokeScreen: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    isSingMode,
    vocalIntensity,
    seek,
    toggleSingMode,
    setVocalIntensity,
    setScreen,
  } = usePlayerStore();

  const {
    isMicActive,
    isRecording,
    recordingDuration,
    toggleMic,
    startRecording,
    stopRecording,
  } = useSingingStore();

  const isMobile = useIsMobile();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [showVocalSlider, setShowVocalSlider] = useState(false);

  useEffect(() => {
    if (!currentTrack) return;
    api.getLyrics(currentTrack.id)
      .then((data) => {
        setLyrics(data.lines || []);
      })
      .catch((err) => {
        console.warn('Lyrics fetch warning:', err);
      });
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!isSingMode) {
      toggleSingMode();
    }
  }, []);

  const handleRecordToggle = async () => {
    if (!currentTrack) return;
    if (isRecording) {
      await stopRecording(currentTrack.id);
      setScreen('sing_studio');
    } else {
      await startRecording();
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 84px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse at 50% 20%, #171b2a 0%, #08090c 80%)',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '12px 14px' : '16px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 20,
        }}
      >
        <button
          onClick={() => setScreen('now_playing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#cbd5e1',
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: isMobile ? 12 : 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} /> Exit
        </button>

        {/* Center Track Title */}
        <div style={{ textAlign: 'center', maxWidth: isMobile ? '50%' : '60%', overflow: 'hidden' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#00e599' }}>
            <Sparkles size={11} />
            <span>AI KARAOKE</span>
          </div>
          <h2 style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentTrack?.title || 'No Song'}
          </h2>
        </div>

        {/* Vocal Slider Toggle */}
        <button
          onClick={() => setShowVocalSlider(!showVocalSlider)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: showVocalSlider ? 'rgba(0,229,153,0.2)' : 'rgba(255,255,255,0.06)',
            border: showVocalSlider ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.1)',
            color: showVocalSlider ? '#00e599' : '#fff',
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Sliders size={13} />
          <span>{Math.round(vocalIntensity * 100)}%</span>
        </button>
      </div>

      {/* Floating Vocal Slider Dropdown */}
      {showVocalSlider && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            right: 12,
            left: isMobile ? 12 : 'auto',
            width: isMobile ? 'auto' : 320,
            zIndex: 40,
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          }}
        >
          <VocalSlider
            value={vocalIntensity}
            onChange={(v) => setVocalIntensity(v)}
          />
        </div>
      )}

      {/* Center Main Stage: Giant Distance-Readable Synchronized Lyrics */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <LyricsDisplay
          lines={lyrics}
          currentTime={currentTime}
          fontSize={isMobile ? 'large' : 'xlarge'}
          onLineClick={(time) => seek(time)}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? 10 : 20,
          padding: isMobile ? '10px 14px' : '16px 24px',
          background: 'rgba(13, 15, 21, 0.90)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 20,
        }}
      >
        {/* Mic Toggle Button */}
        <button
          onClick={toggleMic}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: isMobile ? '8px 14px' : '12px 20px',
            borderRadius: 30,
            border: isMicActive ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.12)',
            background: isMicActive ? 'rgba(0, 229, 153, 0.15)' : 'rgba(255,255,255,0.04)',
            color: isMicActive ? '#00e599' : '#94a3b8',
            fontSize: isMobile ? 12 : 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isMicActive ? <Mic size={16} color="#00e599" /> : <MicOff size={16} />}
          <span>{isMicActive ? 'Mic On' : 'Mic Off'}</span>
        </button>

        {/* Record Performance Button */}
        <button
          onClick={handleRecordToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: isMobile ? '10px 20px' : '12px 28px',
            borderRadius: 30,
            border: 'none',
            background: isRecording ? '#ef4444' : '#00e599',
            color: isRecording ? '#ffffff' : '#08090c',
            fontSize: isMobile ? 13 : 15,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.5)' : '0 0 25px rgba(0, 229, 153, 0.4)',
          }}
        >
          {isRecording ? <CircleDot size={16} /> : <Disc size={16} fill="#08090c" />}
          <span>{isRecording ? `${formatTimer(recordingDuration)}` : 'Record'}</span>
        </button>

        {/* AI Evaluation Button */}
        <button
          onClick={() => setScreen('report')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: isMobile ? '8px 14px' : '12px 20px',
            borderRadius: 30,
            border: '1px solid rgba(245, 158, 11, 0.4)',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            fontSize: isMobile ? 12 : 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Award size={16} />
          <span>Score</span>
        </button>
      </div>
    </div>
  );
};
