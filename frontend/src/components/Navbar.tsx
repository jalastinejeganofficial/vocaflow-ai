import React, { useState } from 'react';
import {
  Home,
  Music,
  PlayCircle,
  Mic,
  Award,
  Settings,
  Sparkles,
  Info,
  Menu,
  X,
} from 'lucide-react';
import { usePlayerStore, ScreenType } from '../store/usePlayerStore';
import { useIsMobile } from '../hooks/useIsMobile';

export const Navbar: React.FC = () => {
  const { currentScreen, setScreen, isSingMode } = usePlayerStore();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ScreenType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'library', label: 'Library', icon: <Music size={20} /> },
    { id: 'now_playing', label: 'Player', icon: <PlayCircle size={20} /> },
    { id: 'karaoke', label: 'Karaoke', icon: <Sparkles size={20} />, badge: isSingMode ? 'LIVE' : undefined },
    { id: 'sing_studio', label: 'Studio', icon: <Mic size={20} /> },
    { id: 'report', label: 'Score', icon: <Award size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const mobileBottomItems: { id: ScreenType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'library', label: 'Library', icon: <Music size={20} /> },
    { id: 'karaoke', label: 'Karaoke', icon: <Sparkles size={22} />, badge: isSingMode ? 'ON' : undefined },
    { id: 'sing_studio', label: 'Studio', icon: <Mic size={20} /> },
    { id: 'now_playing', label: 'Playing', icon: <PlayCircle size={20} /> },
  ];

  if (isMobile) {
    return (
      <>
        {/* Mobile Top App Bar */}
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            background: 'rgba(9, 10, 15, 0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 90,
          }}
        >
          <div
            onClick={() => setScreen('home')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #00e599 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mic size={16} color="#08090c" strokeWidth={2.5} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              Voca<span style={{ color: '#00e599' }}>Flow</span> <span style={{ fontSize: 11, color: '#8b5cf6' }}>AI</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSingMode && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 12,
                  background: 'rgba(0, 229, 153, 0.15)',
                  color: '#00e599',
                  border: '1px solid #00e599',
                }}
              >
                SING MODE
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: 6,
                cursor: 'pointer',
              }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        {/* Mobile Slide-down Drawer for all tabs */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: 56,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(8, 9, 12, 0.98)',
              backdropFilter: 'blur(20px)',
              padding: '24px 20px',
              zIndex: 95,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setScreen(item.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 12,
                    border: isActive ? '1px solid #00e599' : '1px solid rgba(255,255,255,0.06)',
                    background: isActive ? 'rgba(0, 229, 153, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: isActive ? '#00e599' : '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span style={{ fontSize: 10, background: '#00e599', color: '#000', padding: '2px 6px', borderRadius: 10, fontWeight: 800 }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile Bottom Navigation Bar */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'rgba(9, 10, 15, 0.96)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 85,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {mobileBottomItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#00e599' : '#94a3b8',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  position: 'relative',
                  flex: 1,
                }}
              >
                <div style={{ position: 'relative' }}>
                  {item.icon}
                  {item.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -10,
                        fontSize: 8,
                        fontWeight: 900,
                        background: '#00e599',
                        color: '#08090c',
                        padding: '1px 4px',
                        borderRadius: 6,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 500 }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </>
    );
  }

  // Desktop Left Sidebar
  return (
    <nav
      style={{
        width: 240,
        height: '100vh',
        background: '#090a0f',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        onClick={() => setScreen('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 8px',
          marginBottom: 32,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #00e599 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 229, 153, 0.4)',
          }}
        >
          <Mic size={22} color="#08090c" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Voca<span style={{ color: '#00e599' }}>Flow</span> <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 700 }}>AI</span>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.5px' }}>
            SMART KARAOKE STUDIO
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: 10,
                border: isActive ? '1px solid rgba(0, 229, 153, 0.25)' : '1px solid transparent',
                background: isActive ? 'rgba(0, 229, 153, 0.1)' : 'transparent',
                color: isActive ? '#00e599' : '#94a3b8',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: isActive ? '#00e599' : '#64748b' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: '#00e599',
                    color: '#08090c',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: 11, color: '#64748b' }}>
        <div>Dual-Deck Audio Sync</div>
        <div style={{ color: '#00e599', marginTop: 2 }}>Demucs HTDemucs Ready</div>
      </div>
    </nav>
  );
};
