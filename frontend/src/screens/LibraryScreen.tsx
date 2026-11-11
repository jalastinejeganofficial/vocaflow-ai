import React, { useState } from 'react';
import {
  Upload,
  Search,
  Filter,
  Play,
  Sparkles,
  Heart,
  Trash2,
  FileAudio,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { api } from '../services/api';

export const LibraryScreen: React.FC = () => {
  const { tracks, currentTrack, playTrack, loadLibrary } = usePlayerStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ready' | 'favorites'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const isMobile = useIsMobile();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await api.uploadAudio(files[i]);
      }
      await loadLibrary();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleToggleFav = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.toggleFavorite(trackId);
    await loadLibrary();
  };

  const handleDelete = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this track from your library?')) {
      await fetch(`/api/library/${trackId}`, { method: 'DELETE' });
      await loadLibrary();
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayTracks = tracks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filterType === 'ready') return t.has_stems;
    if (filterType === 'favorites') return t.is_favorite;
    return true;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '16px 16px 140px' : '32px 24px 120px' }}>
      {/* Header & Upload Action */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800 }}>Music Library</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
            {tracks.length} track{tracks.length === 1 ? '' : 's'} available
          </p>
        </div>

        {/* Upload Button */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 20,
            background: '#00e599',
            color: '#08090c',
            fontWeight: 700,
            fontSize: 13,
            cursor: isUploading ? 'wait' : 'pointer',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <Upload size={16} />
          <span>{isUploading ? 'Importing Audio...' : 'Import Audio File'}</span>
          <input
            type="file"
            accept=".mp3,.wav,.flac,.m4a"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Filter Chips & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {(['all', 'ready', 'favorites'] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: filterType === ft ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.08)',
                background: filterType === ft ? 'rgba(0, 229, 153, 0.15)' : 'rgba(255,255,255,0.03)',
                color: filterType === ft ? '#00e599' : '#94a3b8',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {ft === 'all' ? 'All Tracks' : ft === 'ready' ? 'Ready to Sing' : 'Favorites'}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#141722',
            padding: '8px 14px',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Search library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      {/* Tracks Container (Responsive Card List on Mobile, Table on Desktop) */}
      <div style={{ background: '#12151e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {displayTracks.map((t, idx) => {
          const isCurrent = currentTrack?.id === t.id;
          return (
            <div
              key={t.id}
              onClick={() => playTrack(t)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                cursor: 'pointer',
                background: isCurrent ? 'rgba(0, 229, 153, 0.07)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#1e2230', flexShrink: 0 }}>
                  {t.artwork_url ? (
                    <img src={t.artwork_url} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileAudio size={20} color="#64748b" />
                    </div>
                  )}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? '#00e599' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.artist} • <span style={{ fontFamily: 'monospace' }}>{formatDuration(t.duration)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {t.has_stems && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 10,
                      background: 'rgba(0,229,153,0.15)',
                      color: '#00e599',
                      border: '1px solid rgba(0,229,153,0.3)',
                    }}
                  >
                    KARAOKE
                  </span>
                )}

                <button
                  onClick={(e) => handleToggleFav(t.id, e)}
                  style={{ background: 'none', border: 'none', color: t.is_favorite ? '#ec4899' : '#64748b', cursor: 'pointer', padding: 6 }}
                >
                  <Heart size={16} fill={t.is_favorite ? '#ec4899' : 'none'} />
                </button>

                <button
                  onClick={(e) => handleDelete(t.id, e)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
