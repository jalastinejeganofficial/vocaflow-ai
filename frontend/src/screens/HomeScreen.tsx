import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  Mic,
  Music,
  Heart,
  Clock,
  Search,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { Track } from '../types';

export const HomeScreen: React.FC = () => {
  const { tracks, currentTrack, isPlaying, playTrack, togglePlay, setScreen, toggleSingMode } = usePlayerStore();
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

  const filteredTracks = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
  );

  const readyToSingTracks = tracks.filter((t) => t.has_stems);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 16px 140px' : '32px 24px 120px' }}>
      {/* Top Greeting & Search */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Welcome to VocaFlow
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
            Original music player with AI Sing Mode.
          </p>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#141722',
            padding: '10px 16px',
            borderRadius: 24,
            width: isMobile ? '100%' : 280,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search tracks, artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: 13,
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Featured Quick Hero Card (Continue Listening / Quick Studio) */}
      {currentTrack && (
        <div
          style={{
            background: 'linear-gradient(135deg, #181d2c 0%, #11141e 100%)',
            borderRadius: 20,
            padding: isMobile ? 16 : 24,
            marginBottom: 28,
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: isMobile ? 60 : 80,
                height: isMobile ? 60 : 80,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#222634',
                flexShrink: 0,
              }}
            >
              {currentTrack.artwork_url ? (
                <img
                  src={currentTrack.artwork_url}
                  alt={currentTrack.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Music size={28} color="#64748b" />
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#00e599', letterSpacing: '1px' }}>
                CURRENT SESSION
              </div>
              <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, margin: '2px 0' }}>{currentTrack.title}</h2>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                {currentTrack.artist} • {formatDuration(currentTrack.duration)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, width: isMobile ? '100%' : 'auto' }}>
            <button
              onClick={togglePlay}
              style={{
                flex: isMobile ? 1 : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 24,
                background: '#00e599',
                color: '#08090c',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Play size={16} fill="#08090c" /> {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              onClick={() => {
                if (!isPlaying) togglePlay();
                setScreen('karaoke');
              }}
              style={{
                flex: isMobile ? 1 : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 24,
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#c084fc',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={16} /> Sing Mode
            </button>
          </div>
        </div>
      )}

      {/* Grid: Ready to Sing (Separated Tracks) */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#00e599" />
            <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800 }}>Ready-to-Sing Tracks</h2>
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>AI Stems Ready</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {readyToSingTracks.length > 0 ? (
            readyToSingTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track)}
                style={{
                  background: '#12151e',
                  borderRadius: 14,
                  padding: 12,
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: isMobile ? 100 : 130,
                    borderRadius: 10,
                    overflow: 'hidden',
                    marginBottom: 8,
                    background: '#1a1d28',
                    position: 'relative',
                  }}
                >
                  {track.artwork_url ? (
                    <img src={track.artwork_url} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Music size={32} color="#64748b" />
                    </div>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(0, 229, 153, 0.9)',
                      color: '#08090c',
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 8,
                    }}
                  >
                    READY
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.artist}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px 0', color: '#64748b', fontSize: 13, gridColumn: '1 / -1' }}>
              Select a song below to enable Sing Mode.
            </div>
          )}
        </div>
      </div>

      {/* Your Music Library Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800 }}>All Tracks</h2>
          <button
            onClick={() => setScreen('library')}
            style={{ background: 'none', border: 'none', color: '#00e599', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            View All →
          </button>
        </div>

        <div style={{ background: '#12151e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {filteredTracks.map((t, idx) => {
            const isCurrent = currentTrack?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => playTrack(t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  background: isCurrent ? 'rgba(0, 229, 153, 0.06)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#1a1d28', flexShrink: 0 }}>
                    {t.artwork_url ? (
                      <img src={t.artwork_url} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={16} color="#64748b" />
                      </div>
                    )}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? '#00e599' : '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.artist}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {t.has_stems ? (
                    <span style={{ fontSize: 9, color: '#00e599', fontWeight: 800, padding: '2px 6px', background: 'rgba(0,229,153,0.1)', borderRadius: 10 }}>KARAOKE</span>
                  ) : null}
                  <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                    {formatDuration(t.duration)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
