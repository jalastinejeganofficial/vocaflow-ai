# 🎤 VocaFlow AI
### AI-Powered Smart Karaoke & Intelligent Music Player

> **Tagline:** *Your Music. Your Voice. Your Stage.*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.141-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/AI-PyTorch_2.12-EE4C2C?logo=pytorch)](https://pytorch.org)
[![Demucs](https://img.shields.io/badge/AI_Separation-Demucs_HTDemucs-00e599)](#)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_TypeScript-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite_6.0-646CFF?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

---

## 🌟 1. Project Vision

**VocaFlow AI** transforms any ordinary song into an immersive, synchronized instrumental karaoke experience using state-of-the-art neural music source separation. 

When users want to sing along with their favorite songs, the original vocals mask their voice. VocaFlow AI solves this with a single click:
1. **Import Any Track:** MP3, WAV, FLAC, or M4A with metadata and cover artwork.
2. **Listen Normally:** Enjoy original studio playback with a 64-band audio visualizer.
3. **Sing Mode with AI:** Mutes the original singer and crossfades seamlessly to the instrumental accompaniment without restarting, pausing, or timeline mismatch.
4. **Synchronized Lyrics:** Read distance-optimized lyrics with syllable & active-line highlighting.
5. **Live Singing Studio:** Sing using your microphone with real-time studio reverb, delay, 3-band EQ, and zero-latency monitoring.
6. **AI Vocal Evaluation:** Compare your pitch and timing against the extracted vocal melody to receive a detailed performance score (0–100) and personalized vocal coaching tips.

---

## 🎧 2. Dual-Deck Audio Switching Architecture

Unlike naive players that pause audio and restart from the beginning, VocaFlow AI features a **Dual-Deck Web Audio Engine**:
- **Deck A (Original Audio)** and **Deck B (AI Instrumental)** are locked in sample-accurate time synchronization.
- **40ms Micro-Crossfade:** Smooth exponential volume ramp eliminates clicks, pops, and phase cancellation.
- **Adjustable Vocal Intensity (0% to 100%):**
  - `0%`: Pure instrumental karaoke.
  - `25%`: Subtle vocal guide.
  - `50%`: Balanced duet.
  - `75%`: Clear original lead.
  - `100%`: Original song.
  - Powered by equal-power sinusoidal panning law to preserve perceived loudness:
    $$\text{Gain}_{\text{orig}} = \sin\left(\frac{V \cdot \pi}{2}\right), \quad \text{Gain}_{\text{inst}} = \cos\left(\frac{V \cdot \pi}{2}\right)$$

---

## 📱 3. Eight Complete Application Screens

| Screen | Description |
|---|---|
| **Screen 1: Welcome / Onboarding** | Interactive introduction to VocaFlow AI with guided feature walkthrough. |
| **Screen 2: Home** | Personalized greeting, search bar, ready-to-sing tracks, and quick studio access. |
| **Screen 3: Music Library** | Upload MP3/WAV/FLAC, search, sort (date, title, artist, duration), and favorite tracks. |
| **Screen 4: Now Playing** | Album artwork with glowing aura, seek bar, visualizer, playback speed (0.75x–1.5x), and Sing Mode toggle. |
| **Screen 5: Karaoke Mode** *(Signature)* | Giant distance-readable synchronized lyrics, glowing line highlight, upcoming line preview, mic trigger, and record controls. |
| **Screen 6: Sing Studio** | Live microphone oscilloscope waveform, recording timer, studio reverb, echo, 3-band EQ, and headphone monitoring. |
| **Screen 7: Performance Report** | Overall score (0–100), Pitch accuracy chart, Timing score, Rhythm score, and AI coaching insights. |
| **Screen 8: Settings** | Separation quality (Fast, Balanced, High-Quality), model selector, cache cleaner, and offline mode. |

---

## 🚀 4. Quick Start & Execution

### Prerequisites
- Python 3.10+ (with FFmpeg installed in system PATH)
- Node.js 18+ and npm

### Step 1: Install Backend Dependencies
```bash
cd vocaflow-ai/backend
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies & Build
```bash
cd vocaflow-ai/frontend
npm install
npm run build
```

### Step 3: Run the Application
Start the FastAPI server (which automatically serves the frontend UI and REST API):
```bash
# Windows turnkey batch script:
vocaflow-ai\scripts\start_backend.bat

# Or command line:
cd vocaflow-ai/backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser at **`http://127.0.0.1:8000`** to experience VocaFlow AI!

---

## 🧪 5. Testing & Verification

### Run Automated Backend Unit Tests
```bash
$env:KMP_DUPLICATE_LIB_OK="TRUE"
pytest vocaflow-ai/backend/tests -v
```
All 8 automated tests verify:
- API health check
- Library querying
- Settings persistence
- Hertz to MIDI conversion
- Synthetic pitch evaluation and cents error calculations
- Standard LRC, SRT, and plain text lyrics parsing

### Run Full Pipeline End-to-End Test on `Rathinamo.mp3`
```bash
python vocaflow-ai/scripts/test_e2e.py
```
This tests:
1. Audio inspection and metadata extraction.
2. HTTP 206 partial content streaming.
3. Synchronized lyrics alignment.
4. AI source separation job execution.
5. Dual-deck instrumental and vocal stem verification.
6. Microphone audio capture and saving.
7. AI pitch and timing evaluation ($F_0$ extraction, cents error, stability).
8. Playback history recording and storage management.

---

## 📦 6. Project Structure

```
vocaflow-ai/
  frontend/
    src/
      audio/           # AudioEngine (Dual-Deck), EffectsEngine, MicrophoneCapture
      components/      # Visualizer, PitchVisualizer, LyricsDisplay, VocalSlider, PlayerBar
      screens/         # 8 production screens
      store/           # Zustand stores (usePlayerStore, useSingingStore)
      services/        # Type-safe API client
      types/           # TypeScript interfaces
      theme/           # Dark studio neon color scheme
    package.json
    vite.config.ts
  backend/
    app/
      api/             # FastAPI routers: audio, separation, lyrics, singing, library
      services/        # Business logic: Audio, Separation, Lyrics, Evaluation
      separation/      # DemucsEngine & Fast Spectral Separator
      lyrics/          # LRC & SRT timestamp parsers
      evaluation/      # librosa pitch contour & singing scoring engine
      storage/         # Local file storage and cache manager
      config.py        # Environment & paths
      database.py      # SQLite WAL database
      main.py          # FastAPI application & static mount
    tests/             # Pytest automated test suite
    requirements.txt
  local_storage/       # Audio, stems, recordings, lyrics, artworks, and vocaflow.db
  docs/                # ARCHITECTURE.md, API_SPEC.md, ANDROID_BUILD.md
  scripts/             # start_backend.bat, start_frontend.bat, test_e2e.py
  docker-compose.yml
  .env.example
  README.md
```

---

## ⚖️ 7. Legal & Content Requirements

- VocaFlow AI is engineered exclusively for user-imported audio that the user owns or is authorized to process.
- The software does not bypass DRM, rip protected streams, or redistribute copyrighted recordings.
- All AI separation and pitch estimation are executed locally on the user's computer.

