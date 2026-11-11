import React from 'react';
import { PitchDataPoint } from '../types';

interface Props {
  pitchData: PitchDataPoint[];
  height?: number;
}

export const PitchVisualizer: React.FC<Props> = ({ pitchData, height = 240 }) => {
  if (!pitchData || pitchData.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        No pitch contour data available.
      </div>
    );
  }

  // Find min and max pitches to scale Y axis
  const validUserPitches = pitchData.map(p => p.user_pitch).filter((p): p is number => typeof p === 'number' && p > 0);
  const validRefPitches = pitchData.map(p => p.ref_pitch).filter((p): p is number => typeof p === 'number' && p > 0);
  
  const allPitches = [...validUserPitches, ...validRefPitches];
  const minPitch = allPitches.length > 0 ? Math.max(40, Math.min(...allPitches) - 2) : 55;
  const maxPitch = allPitches.length > 0 ? Math.min(84, Math.max(...allPitches) + 2) : 75;
  const pitchRange = Math.max(10, maxPitch - minPitch);

  const width = 800;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const totalPoints = pitchData.length;

  const getX = (idx: number) => paddingX + (idx / Math.max(1, totalPoints - 1)) * chartW;
  const getY = (midi: number) => paddingY + chartH - ((midi - minPitch) / pitchRange) * chartH;

  // Build SVG path for Reference Pitch
  let refPath = '';
  pitchData.forEach((pt, idx) => {
    if (pt.ref_pitch) {
      const x = getX(idx);
      const y = getY(pt.ref_pitch);
      refPath += `${refPath === '' ? 'M' : ' L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  });

  // Build SVG path for User Pitch
  let userPath = '';
  pitchData.forEach((pt, idx) => {
    if (pt.user_pitch) {
      const x = getX(idx);
      const y = getY(pt.user_pitch);
      userPath += `${userPath === '' ? 'M' : ' L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  });

  return (
    <div style={{ width: '100%', background: '#0e1118', borderRadius: 12, padding: '16px 8px', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end', marginBottom: 8, paddingRight: 16, fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 4, background: '#f59e0b', borderRadius: 2 }} />
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>Reference Vocal Pitch</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: '#00e599', borderRadius: '50%', boxShadow: '0 0 6px #00e599' }} />
          <span style={{ color: '#00e599', fontWeight: 600 }}>Your Vocal Performance</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height, display: 'block' }}>
        {/* Background Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
          const y = paddingY + chartH * frac;
          const noteMidi = Math.round(maxPitch - frac * pitchRange);
          return (
            <g key={i}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x={paddingX - 8} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                M{noteMidi}
              </text>
            </g>
          );
        })}

        {/* Reference Vocal Melody Line */}
        {refPath && (
          <path
            d={refPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        )}

        {/* User Vocal Sung Line */}
        {userPath && (
          <path
            d={userPath}
            fill="none"
            stroke="#00e599"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* User Vocal Data Points */}
        {pitchData.map((pt, idx) => {
          if (!pt.user_pitch) return null;
          const x = getX(idx);
          const y = getY(pt.user_pitch);
          
          // Check deviation from reference
          const diff = pt.ref_pitch ? Math.abs(pt.user_pitch - pt.ref_pitch) : 0;
          const isAccurate = diff <= 0.6; // Within half-semitone

          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={isAccurate ? 4.5 : 5.5}
              fill={isAccurate ? '#00e599' : '#ec4899'}
              stroke="#08090c"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    </div>
  );
};

