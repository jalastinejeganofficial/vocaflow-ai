import React, { useEffect, useRef, useState } from 'react';
import { LyricLine } from '../types';

interface Props {
  lines: LyricLine[];
  currentTime: number;
  fontSize?: 'medium' | 'large' | 'xlarge';
  onLineClick?: (time: number) => void;
}

export const LyricsDisplay: React.FC<Props> = ({
  lines,
  currentTime,
  fontSize = 'large',
  onLineClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1.0);

  // Find active line index
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (currentTime >= lines[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth auto-scroll to keep active line centered
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeEl = activeLineRef.current;

      const containerHeight = container.clientHeight;
      const activeTop = activeEl.offsetTop;
      const activeHeight = activeEl.clientHeight;

      container.scrollTo({
        top: activeTop - containerHeight / 2 + activeHeight / 2,
        behavior: 'smooth',
      });
    }
  }, [activeIndex]);

  const baseFontSize = fontSize === 'medium' ? 18 : fontSize === 'large' ? 24 : 32;

  if (!lines || lines.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <p style={{ fontSize: 18, marginBottom: 8 }}>No lyrics synchronized for this track yet.</p>
        <p style={{ fontSize: 14 }}>Import an LRC or SRT file to enable synchronized karaoke sing-along.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Font Size Zoom Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '8px 16px', zIndex: 10 }}>
        <button
          onClick={() => setScale(s => Math.max(0.8, s - 0.1))}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}
        >
          A-
        </button>
        <button
          onClick={() => setScale(s => Math.min(1.4, s + 0.1))}
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}
        >
          A+
        </button>
      </div>

      {/* Lyrics Scroll Container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '120px 24px 200px',
          textAlign: 'center',
          scrollBehavior: 'smooth',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        {lines.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;
          const isNext = idx === activeIndex + 1;

          return (
            <div
              key={idx}
              ref={isActive ? activeLineRef : null}
              onClick={() => onLineClick && onLineClick(line.time)}
              style={{
                padding: '12px 16px',
                margin: '8px 0',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: `${baseFontSize * scale}px`,
                fontWeight: isActive ? 800 : isNext ? 600 : 500,
                color: isActive ? '#00e599' : isPassed ? '#475569' : isNext ? '#cbd5e1' : '#64748b',
                textShadow: isActive ? '0 0 20px rgba(0, 229, 153, 0.6), 0 0 40px rgba(0, 229, 153, 0.2)' : 'none',
                transform: isActive ? 'scale(1.08)' : 'scale(1.0)',
                background: isActive ? 'rgba(0, 229, 153, 0.08)' : 'transparent',
                lineHeight: 1.4,
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

