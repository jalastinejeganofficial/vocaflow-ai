import React, { useEffect } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { useIsMobile } from './hooks/useIsMobile';
import { Navbar } from './components/Navbar';
import { StemPlayerBar } from './components/StemPlayerBar';
import { UploadProcessingPanel } from './components/UploadProcessingPanel';

import { WelcomeScreen } from './screens/WelcomeScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { NowPlayingScreen } from './screens/NowPlayingScreen';
import { KaraokeScreen } from './screens/KaraokeScreen';
import { SingStudioScreen } from './screens/SingStudioScreen';
import { ReportScreen } from './screens/ReportScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export const App: React.FC = () => {
  const { currentScreen, loadLibrary, uploadJobs } = usePlayerStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'home':
        return <HomeScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'now_playing':
        return <NowPlayingScreen />;
      case 'karaoke':
        return <KaraokeScreen />;
      case 'sing_studio':
        return <SingStudioScreen />;
      case 'report':
        return <ReportScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100vw',
        height: '100vh',
        background: '#08090c',
        overflow: 'hidden',
      }}
    >
      {/* Navigation (Sidebar on Desktop, Top Bar + Bottom Bar on Mobile) */}
      <Navbar />

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          position: 'relative',
          paddingTop: isMobile ? 56 : 0,
          paddingBottom: isMobile ? 130 : 90,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {uploadJobs.length > 0 && (
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '14px 16px 0' : '24px 24px 0' }}>
            <UploadProcessingPanel />
          </div>
        )}
        {renderScreen()}
      </main>

      {/* Persistent Stem Player Bar */}
      <StemPlayerBar />
    </div>
  );
};
export default App;
