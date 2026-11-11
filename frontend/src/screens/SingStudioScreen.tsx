import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Headphones,
  Sliders,
  Play,
  Pause,
  Award,
  Sparkles,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useSingingStore } from '../store/useSingingStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { globalEffectsEngine } from '../audio/EffectsEngine';

export const SingStudioScreen: React.FC = () => {
  const {
    isMicActive,
    isRecording,
    recordingDuration,
    effects,
    lastRecordingBlob,
    isEvaluating,
    toggleMic,
    startRecording,
    stopRecording,
    updateEffects,
    evaluateLatestRecording,
  } = useSingingStore();

  const { currentTrack, setScreen } = usePlayerStore();
  const isMobile = useIsMobile();
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [recordingAudioEl, setRecordingAudioEl] = useState<HTMLAudioElement | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (lastRecordingBlob) {
      const url = URL.createObjectURL(lastRecordingBlob);
      setRecordedAudioUrl(url);
      const audio = new Audio(url);
      audio.onended = () => setIsPlayingRecording(false);
      setRecordingAudioEl(audio);
      return () => URL.revokeObjectURL(url);
    }
  }, [lastRecordingBlob]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      const data = globalEffectsEngine.getMicWaveformData();
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isRecording ? '#ef4444' : '#00e599';
      ctx.shadowBlur = 10;
      ctx.shadowColor = isRecording ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 229, 153, 0.6)';

      ctx.beginPath();
      const sliceWidth = w / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRecording]);

  const handleRecordToggle = async () => {
    if (!currentTrack) {
      alert('Please select a song from the library first.');
      return;
    }
    if (isRecording) {
      await stopRecording(currentTrack.id);
    } else {
      await startRecording();
    }
  };

  const handlePlayRecording = () => {
    if (!recordingAudioEl) return;
    if (isPlayingRecording) {
      recordingAudioEl.pause();
      setIsPlayingRecording(false);
    } else {
      recordingAudioEl.play();
      setIsPlayingRecording(true);
    }
  };

  const handleEvaluate = async () => {
    if (!currentTrack) return;
    try {
      await evaluateLatestRecording(currentTrack.id);
      setScreen('report');
    } catch (e: any) {
      alert(e.message || 'AI evaluation failed');
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '16px 16px 140px' : '32px 24px 120px' }}>
      {/* Header */}
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
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800 }}>Live Singing Studio</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
            Microphone input, studio effects, monitoring, and AI evaluation.
          </p>
        </div>

        <button
          onClick={toggleMic}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 24,
            border: isMicActive ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.12)',
            background: isMicActive ? 'rgba(0, 229, 153, 0.15)' : 'rgba(255,255,255,0.04)',
            color: isMicActive ? '#00e599' : '#ffffff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          {isMicActive ? <Mic size={16} color="#00e599" /> : <MicOff size={16} />}
          <span>{isMicActive ? 'Mic Active' : 'Activate Mic'}</span>
        </button>
      </div>

      {/* Live Waveform Oscilloscope Monitor */}
      <div
        style={{
          background: '#0e1118',
          borderRadius: 20,
          padding: isMobile ? 16 : 24,
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 24,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isRecording ? '#ef4444' : isMicActive ? '#00e599' : '#64748b',
                boxShadow: isRecording ? '0 0 10px #ef4444' : isMicActive ? '0 0 10px #00e599' : 'none',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>
              {isRecording ? 'RECORDING' : isMicActive ? 'MIC ON' : 'STANDBY'}
            </span>
          </div>

          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: isRecording ? '#ef4444' : '#00e599' }}>
            {formatTimer(recordingDuration)}
          </div>
        </div>

        {/* Canvas Oscilloscope */}
        <div style={{ width: '100%', height: isMobile ? 90 : 120, background: '#08090d', borderRadius: 12, overflow: 'hidden' }}>
          <canvas ref={canvasRef} width={800} height={120} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Recording Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 }}>
          <button
            onClick={handleRecordToggle}
            style={{
              flex: isMobile ? '1 1 100%' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 30,
              border: 'none',
              background: isRecording ? '#ef4444' : '#00e599',
              color: isRecording ? '#fff' : '#08090c',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 0 20px rgba(0, 229, 153, 0.3)',
            }}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording Voice'}
          </button>

          {lastRecordingBlob && (
            <>
              <button
                onClick={handlePlayRecording}
                style={{
                  flex: isMobile ? 1 : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  borderRadius: 30,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isPlayingRecording ? <Pause size={15} /> : <Play size={15} fill="#fff" />}
                <span>{isPlayingRecording ? 'Pause' : 'Replay'}</span>
              </button>

              <button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                style={{
                  flex: isMobile ? 1 : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  borderRadius: 30,
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#08090c',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isEvaluating ? 'wait' : 'pointer',
                }}
              >
                <Award size={16} />
                <span>{isEvaluating ? 'Evaluating...' : 'AI Evaluation'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Studio Audio Effects Rack */}
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sliders size={18} color="#00e599" />
        <span>Vocal Effects Rack</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* Reverb Card */}
        <div style={{ background: '#12151e', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Studio Reverb</span>
            <span style={{ fontSize: 12, color: '#00e599', fontFamily: 'monospace' }}>
              {Math.round(effects.reverb * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={effects.reverb}
            onChange={(e) => updateEffects({ reverb: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#00e599' }}
          />
        </div>

        {/* Echo / Delay Card */}
        <div style={{ background: '#12151e', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Echo / Delay</span>
            <span style={{ fontSize: 12, color: '#8b5cf6', fontFamily: 'monospace' }}>
              {Math.round(effects.echoWet * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={effects.echoWet}
            onChange={(e) => updateEffects({ echoWet: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#8b5cf6' }}
          />
        </div>

        {/* 3-Band Parametric EQ */}
        <div style={{ background: '#12151e', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>3-Band Studio EQ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Bass (250Hz)</span>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={effects.eqLow}
                onChange={(e) => updateEffects({ eqLow: parseInt(e.target.value) })}
                style={{ width: 110, accentColor: '#00e599' }}
              />
              <span style={{ fontSize: 10, width: 30, textAlign: 'right', fontFamily: 'monospace' }}>
                {effects.eqLow}dB
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Mid (2kHz)</span>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={effects.eqMid}
                onChange={(e) => updateEffects({ eqMid: parseInt(e.target.value) })}
                style={{ width: 110, accentColor: '#8b5cf6' }}
              />
              <span style={{ fontSize: 10, width: 30, textAlign: 'right', fontFamily: 'monospace' }}>
                {effects.eqMid}dB
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Treble (6kHz)</span>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={effects.eqHigh}
                onChange={(e) => updateEffects({ eqHigh: parseInt(e.target.value) })}
                style={{ width: 110, accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: 10, width: 30, textAlign: 'right', fontFamily: 'monospace' }}>
                {effects.eqHigh}dB
              </span>
            </div>
          </div>
        </div>

        {/* Monitoring & Feedback Guard */}
        <div style={{ background: '#12151e', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Headphones size={16} color="#00e599" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Monitoring</span>
            </div>
            <button
              onClick={() => updateEffects({ monitor: !effects.monitor })}
              style={{
                padding: '4px 12px',
                borderRadius: 16,
                border: effects.monitor ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.1)',
                background: effects.monitor ? 'rgba(0, 229, 153, 0.2)' : 'rgba(255,255,255,0.04)',
                color: effects.monitor ? '#00e599' : '#94a3b8',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {effects.monitor ? 'ON' : 'OFF'}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 10, color: '#fbbf24', lineHeight: 1.3 }}>
              Use headphones with monitoring to avoid feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
