import React from 'react';
import { Sparkles, Music, Mic, Award, ArrowRight, Play } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export const WelcomeScreen: React.FC = () => {
  const { setScreen, tracks, playTrack } = usePlayerStore();

  const handleQuickStart = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0]);
    }
    setScreen('home');
  };

  const steps = [
    {
      icon: <Music size={24} color="#00e599" />,
      title: '1. Play Any Song',
      desc: 'Import your favorite legally owned MP3, WAV, or FLAC audio tracks with rich album art and metadata.',
    },
    {
      icon: <Sparkles size={24} color="#a855f7" />,
      title: '2. Instant Sing Mode',
      desc: 'One-click AI source separation instantly mutes the original singer and maintains a smooth, synchronized instrumental.',
    },
    {
      icon: <Mic size={24} color="#3b82f6" />,
      title: '3. Sing Live in Studio',
      desc: 'Sing into your microphone with real-time studio reverb, delay, 3-band EQ, and zero-latency monitoring.',
    },
    {
      icon: <Award size={24} color="#f59e0b" />,
      title: '4. AI Singing Feedback',
      desc: 'Receive instant pitch accuracy, rhythm, and stability scoring out of 100 with personalized vocal coaching advice.',
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 120px' }}>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 229, 153, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
          borderRadius: 24,
          padding: '48px 36px',
          border: '1px solid rgba(0, 229, 153, 0.2)',
          textAlign: 'center',
          marginBottom: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 20,
            background: 'rgba(0, 229, 153, 0.15)',
            color: '#00e599',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '1px',
            marginBottom: 20,
            border: '1px solid rgba(0, 229, 153, 0.3)',
          }}
        >
          <Sparkles size={14} /> AI-POWERED SMART KARAOKE & MUSIC PLAYER
        </div>

        <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
          Your Music. Your Voice. <span style={{ color: '#00e599' }}>Your Stage.</span>
        </h1>

        <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 650, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Transform any standard audio song into a pristine karaoke experience using deep neural AI vocal separation,
          synchronized lyrics, and intelligent singing evaluation.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button
            onClick={handleQuickStart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 28px',
              borderRadius: 30,
              background: '#00e599',
              color: '#08090c',
              border: 'none',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(0, 229, 153, 0.4)',
            }}
          >
            <Play size={18} fill="#08090c" /> Start Listening Now
          </button>

          <button
            onClick={() => setScreen('karaoke')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 24px',
              borderRadius: 30,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Explore Karaoke Mode <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Feature Steps */}
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>
        How VocaFlow AI Works
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {steps.map((st, i) => (
          <div
            key={i}
            style={{
              background: '#12151e',
              borderRadius: 16,
              padding: '24px 20px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              {st.icon}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#f8fafc' }}>
              {st.title}
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
              {st.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

