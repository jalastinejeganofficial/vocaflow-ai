import React from 'react';
import { Sparkles, Clock, CheckCircle2, XCircle, Play, Loader2, X, Music } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { PendingUploadJob } from '../types';

const formatSeconds = (secs: number | null | undefined): string => {
  if (secs === null || secs === undefined || !Number.isFinite(secs) || secs < 0) return '--:--';
  const total = Math.floor(secs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const UploadProcessingPanel: React.FC = () => {
  const { uploadJobs, tracks, playTrack, cancelUploadJob, dismissUploadJob } = usePlayerStore();

  if (uploadJobs.length === 0) return null;

  return (
    <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        @keyframes vocaSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes vocaPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      `}</style>

      {uploadJobs.map((job: PendingUploadJob) => {
        const isDone = job.status === 'completed';
        const isFailed = job.status === 'failed' || job.status === 'cancelled';
        const isRunning = !isDone && !isFailed;
        const matchedTrack = isDone ? tracks.find((t) => t.id === job.trackId) : undefined;

        return (
          <div
            key={job.localId}
            style={{
              background: isDone
                ? 'linear-gradient(135deg, rgba(0, 229, 153, 0.14) 0%, rgba(18, 21, 30, 0.98) 100%)'
                : isFailed
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(18, 21, 30, 0.98) 100%)'
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(16, 20, 32, 0.98) 100%)',
              border: isDone
                ? '1px solid rgba(0, 229, 153, 0.45)'
                : isFailed
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: 18,
              padding: '20px 22px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden' }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: isDone
                      ? 'rgba(0, 229, 153, 0.2)'
                      : isFailed
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={24} color="#00e599" />
                  ) : isFailed ? (
                    <XCircle size={24} color="#ef4444" />
                  ) : (
                    <Loader2 size={24} color="#c084fc" style={{ animation: 'vocaSpin 1.1s linear infinite' }} />
                  )}
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.8px',
                      color: isDone ? '#00e599' : isFailed ? '#f87171' : '#c084fc',
                      marginBottom: 3,
                    }}
                  >
                    <Sparkles size={11} />
                    {isDone
                      ? 'AI VOCAL REMOVER COMPLETE • SONG ADDED TO LIBRARY'
                      : isFailed
                      ? 'AI PROCESSING FAILED'
                      : 'AI VOCAL REMOVER PROCESSING'}
                  </div>

                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {job.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {job.artist}
                    {job.duration > 0 && ` • Song Length: ${formatSeconds(job.duration)}`}
                  </div>
                </div>
              </div>

              {/* Action / Close Button */}
              {isRunning ? (
                <button
                  onClick={() => cancelUploadJob(job.localId)}
                  title="Cancel upload & AI processing"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <X size={13} /> Cancel
                </button>
              ) : (
                <button
                  onClick={() => dismissUploadJob(job.localId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Active Processing View: Progress Bar + Elapsed/Remaining Time */}
            {isRunning && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', animation: 'vocaPulse 1.6s ease-in-out infinite' }}>
                    {job.message}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#00e599', fontFamily: 'monospace' }}>
                    {Math.round(job.progress)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 6,
                    overflow: 'hidden',
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(4, Math.min(100, job.progress))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #8b5cf6 0%, #00e599 100%)',
                      borderRadius: 6,
                      transition: 'width 0.35s ease',
                    }}
                  />
                </div>

                {/* Live Time Readouts */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'rgba(8, 9, 12, 0.55)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} color="#00e599" />
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Time Elapsed:</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                        {formatSeconds(job.elapsedSeconds)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Est. Remaining:</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#c084fc', fontFamily: 'monospace' }}>
                        {job.estimatedRemainingSeconds !== null && job.estimatedRemainingSeconds > 0
                          ? `~${formatSeconds(job.estimatedRemainingSeconds)}`
                          : 'Calculating...'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Song will unlock for playback once ready
                  </div>
                </div>
              </>
            )}

            {/* Ready View: Click to Play */}
            {isDone && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  paddingTop: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#cbd5e1' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={14} color="#00e599" />
                    Processed in <strong style={{ color: '#00e599', fontFamily: 'monospace' }}>{formatSeconds(job.elapsedSeconds)}</strong>
                  </span>
                  <span>•</span>
                  <span>Vocals & Instrumental 100% Ready</span>
                </div>

                {matchedTrack && (
                  <button
                    onClick={() => playTrack(matchedTrack)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 20px',
                      borderRadius: 24,
                      background: '#00e599',
                      color: '#08090c',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      boxShadow: '0 0 18px rgba(0, 229, 153, 0.35)',
                    }}
                  >
                    <Play size={15} fill="#08090c" /> Click to Play Song
                  </button>
                )}
              </div>
            )}

            {/* Failed View */}
            {isFailed && (
              <div style={{ fontSize: 12, color: '#fca5a5', paddingTop: 4 }}>
                {job.errorMessage || job.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
