import React from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface Props {
  value: number; // 0.0 to 1.0
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const VocalSlider: React.FC<Props> = ({ value, onChange, disabled = false }) => {
  const percentage = Math.round(value * 100);

  const presets = [
    { label: '0% Inst', val: 0.0, desc: 'Karaoke Instrumental' },
    { label: '25% Guide', val: 0.25, desc: 'Subtle Vocal Guide' },
    { label: '50% Duet', val: 0.50, desc: 'Balanced Vocals' },
    { label: '75%', val: 0.75, desc: 'Clear Lead' },
    { label: '100% Orig', val: 1.0, desc: 'Original Song' },
  ];

  return (
    <div style={{ width: '100%', background: '#12151e', padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mic size={18} color="#00e599" />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.5px' }}>
            AI VOCAL INTENSITY
          </span>
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: 20,
            background: percentage === 0 ? 'rgba(0, 229, 153, 0.2)' : percentage === 100 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
            color: percentage === 0 ? '#00e599' : percentage === 100 ? '#60a5fa' : '#c084fc',
            border: `1px solid ${percentage === 0 ? '#00e599' : percentage === 100 ? '#3b82f6' : '#8b5cf6'}`,
          }}
        >
          {percentage}% {percentage === 0 ? '(Instrumental Only)' : percentage === 100 ? '(Original)' : '(Mixed)'}
        </span>
      </div>

      {/* Main Slider */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', margin: '14px 0' }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#00e599' }}
        />
      </div>

      {/* Quick Presets Pills */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginTop: 10 }}>
        {presets.map((p) => {
          const isSelected = Math.abs(value - p.val) < 0.05;
          return (
            <button
              key={p.val}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.val)}
              title={p.desc}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: 8,
                border: isSelected ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.06)',
                background: isSelected ? 'rgba(0, 229, 153, 0.15)' : 'rgba(255,255,255,0.03)',
                color: isSelected ? '#00e599' : '#94a3b8',
                fontSize: 11,
                fontWeight: isSelected ? 700 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

