import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Sparkles,
  TrendingUp,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Music,
  Share2,
} from 'lucide-react';
import { useSingingStore } from '../store/useSingingStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { PitchVisualizer } from '../components/PitchVisualizer';

export const ReportScreen: React.FC = () => {
  const { evaluationReport } = useSingingStore();
  const { currentTrack, setScreen } = usePlayerStore();

  useEffect(() => {
    if (evaluationReport && evaluationReport.overall_score >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00e599', '#8b5cf6', '#3b82f6', '#f59e0b'],
        });
      } catch (e) {}
    }
  }, [evaluationReport]);

  if (!evaluationReport) {
    return (
      <div style={{ maxWidth: 800, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <Award size={64} color="#64748b" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>No Performance Evaluated Yet</h2>
        <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 24 }}>
          Go to Karaoke Mode or Sing Studio, record your voice while singing with the instrumental, and tap "AI Vocal Evaluation".
        </p>
        <button
          onClick={() => setScreen('karaoke')}
          style={{
            padding: '12px 28px',
            borderRadius: 30,
            background: '#00e599',
            color: '#08090c',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Go to Karaoke Mode
        </button>
      </div>
    );
  }

  const {
    overall_score,
    pitch_score,
    timing_score,
    rhythm_score,
    stability_score,
    feedback,
    strengths,
    improvements,
    pitch_contour,
  } = evaluationReport;

  const scoreColor =
    overall_score >= 85 ? '#00e599' : overall_score >= 70 ? '#3b82f6' : '#f59e0b';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 120px' }}>
      {/* Hero Score Badge */}
      <div
        style={{
          background: 'linear-gradient(135deg, #131722 0%, #0d0f15 100%)',
          borderRadius: 24,
          padding: '40px 32px',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 32,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            borderRadius: 20,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '1px',
            marginBottom: 20,
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <Sparkles size={14} /> AI SINGING EVALUATION REPORT
        </div>

        {/* Circular Radial Score Badge */}
        <div
          style={{
            position: 'relative',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0, 229, 153, 0.1) 0%, transparent 70%)`,
            border: `4px solid ${scoreColor}`,
            boxShadow: `0 0 30px ${scoreColor}40`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
            {overall_score}
          </span>
          <span style={{ fontSize: 12, color: scoreColor, fontWeight: 800 }}>/ 100</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          {overall_score >= 85
            ? 'Superb Vocal Performance!'
            : overall_score >= 70
            ? 'Great Vocal Delivery!'
            : 'Good Effort – Keep Practicing!'}
        </h1>

        <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 600, lineHeight: 1.5 }}>
          Track: <strong style={{ color: '#fff' }}>{currentTrack?.title || 'Recorded Track'}</strong> • Evaluated by VocaFlow AI Pitch Engine
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
          <button
            onClick={() => setScreen('karaoke')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 30,
              background: '#00e599',
              color: '#08090c',
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} /> Sing Again
          </button>

          <button
            onClick={() => setScreen('sing_studio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: 30,
              background: 'rgba(255,255,255,0.06)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.15)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Adjust Vocal FX
          </button>
        </div>
      </div>

      {/* 4 Score Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#12151e', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>PITCH ACCURACY</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#00e599', margin: '4px 0' }}>{pitch_score}%</div>
          <p style={{ fontSize: 11, color: '#64748b' }}>Frequency alignment to melody notes</p>
        </div>

        <div style={{ background: '#12151e', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>TIMING ACCURACY</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#3b82f6', margin: '4px 0' }}>{timing_score}%</div>
          <p style={{ fontSize: 11, color: '#64748b' }}>Vocal phrase onset synchronization</p>
        </div>

        <div style={{ background: '#12151e', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>RHYTHMIC STABILITY</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#8b5cf6', margin: '4px 0' }}>{rhythm_score}%</div>
          <p style={{ fontSize: 11, color: '#64748b' }}>Beat consistency across bars</p>
        </div>

        <div style={{ background: '#12151e', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>NOTE STABILITY</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#f59e0b', margin: '4px 0' }}>{stability_score}%</div>
          <p style={{ fontSize: 11, color: '#64748b' }}>Pitch wobble vs controlled vibrato</p>
        </div>
      </div>

      {/* Interactive Pitch Contour Comparison Chart */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
          Melodic Pitch Tracking Chart
        </h2>
        <PitchVisualizer pitchData={pitch_contour} height={260} />
      </div>

      {/* AI Coaching Insights: Strengths & Improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Strengths */}
        <div style={{ background: '#12151e', padding: 24, borderRadius: 16, border: '1px solid rgba(0, 229, 153, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle size={20} color="#00e599" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#00e599' }}>Vocal Strengths</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {strengths.map((str, idx) => (
              <div key={idx} style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
                • {str}
              </div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div style={{ background: '#12151e', padding: 24, borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertCircle size={20} color="#f59e0b" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>Actionable Coaching Tips</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {improvements.map((imp, idx) => (
              <div key={idx} style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
                • {imp}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

