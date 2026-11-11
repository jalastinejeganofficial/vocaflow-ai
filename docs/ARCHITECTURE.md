# VocaFlow AI - Technical System Architecture

## 1. High-Level Architecture Overview

VocaFlow AI is engineered around a **dual-deck synchronized audio architecture** paired with a **deep neural music source separation pipeline** and a **real-time singing evaluation engine**.

```
+-----------------------------------------------------------------------------------+
|                                 VOCALFLOW CLIENT                                  |
|                                                                                   |
|  [ Deck A: Original Audio ]  <-- Audio Clock Sync -->  [ Deck B: Instrumental ]  |
|            |                                                    |                 |
|      (Gain Node A: V)                                    (Gain Node B: 1-V)       |
|            \                                                    /                 |
|             +------------> [ Master Gain Node ] <--------------+                  |
|                                     |                                             |
|                              [ AnalyserNode ] (64-Band Canvas Visualizer)         |
|                                     |                                             |
|                             [ Audio Destination ]                                 |
|                                                                                   |
|  [ Microphone Input ] --> [ HPF 80Hz ] --> [ 3-Band EQ ] --> [ Compressor ]       |
|                              |                    |                |              |
|                          [ Reverb ]           [ Delay ]       [ Visualizer ]      |
+-----------------------------------------------------------------------------------+
                                      |
                     REST APIs / Range Streams (HTTP 206)
                                      v
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND                                    |
|                                                                                   |
|  [ Audio Ingestion & Metadata ]   [ SQLite WAL DB ]     [ Lyrics Sync Engine ]    |
|  - ffprobe stream inspection      - tracks              - LRC / SRT parser        |
|  - ID3 artwork extraction         - separation_jobs     - Word-level timing       |
|                                   - evaluations                                   |
|                                                                                   |
|  [ Source Separation Engine ]                         [ Singing Evaluation ]      |
|  - Demucs HTDemucs (PyTorch CPU/CUDA)                 - librosa.yin / pyin F0     |
|  - Fast Mid/Side Spectral Filter Fallback             - Octave-equivalent cents   |
|  - ThreadPoolExecutor Worker Queue                    - Onset timing deviation    |
|  - Instrumental Stem Caching                          - Note stability variance   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Audio Switching & Dual-Deck Synchronization

To achieve seamless, zero-gap switching between original song and instrumental accompaniment without restarting or stuttering:
1. **Clock Authority**: The Web Audio API context (`audioContext.currentTime`) acts as the sample-accurate master clock.
2. **Phase & Sample Rate Alignment**: Both Deck A (`original.mp3`) and Deck B (`instrumental.wav`) are sampled at 48,000 Hz stereo with identical frame counts.
3. **Micro-Crossfade Smoothing**: Gain switching uses `setTargetAtTime` with a time constant $\tau = 0.04\text{s}$ (40ms). This eliminates all audible clicks, pops, and phase cancellation transients.
4. **Vocal Intensity Mixing Law**:
   $$\text{Gain}_{\text{orig}} = \sin\left(\frac{V \cdot \pi}{2}\right), \quad \text{Gain}_{\text{inst}} = \cos\left(\frac{V \cdot \pi}{2}\right)$$
   where $V \in [0.0, 1.0]$. This equal-power panning formula maintains constant perceived acoustic energy whether vocals are 0% (instrumental), 50% (duet), or 100% (original).
5. **Timeline Resynchronization**: If drift exceeds 40ms, Deck B automatically seeks to Deck A's timestamp:
   ```typescript
   if (Math.abs(audioA.currentTime - audioB.currentTime) > 0.04) {
     audioB.currentTime = audioA.currentTime;
   }
   ```

---

## 3. AI Vocal Separation Pipeline

VocaFlow AI supports multi-tier separation:
- **Demucs HTDemucs (Balanced & High Quality)**:
  - Meta Research Hybrid Transformer Demucs (`htdemucs`).
  - Deep convolutional and transformer layers operating on both frequency domain (spectrograms) and time domain (waveforms).
  - Generates zero-drift stems (`vocals.wav` and `instrumental.wav`).
- **Fast Spectral Separator (Fast Mode & Low-Resource Fallback)**:
  - High-speed mid/side phase subtraction with frequency-selective vocal band extraction (120 Hz to 4.5 kHz).
  - Low-pass filter (<120 Hz) preserves bass instruments.
  - High-pass filter (>4.5 kHz) preserves stereo cymbals and ambient reverb.
  - Generates clean instrumental preview in ~2-3 seconds.
- **Instrumental Caching**:
  - Generated stems are stored in `local_storage/stems/{track_id}/`.
  - Repeated toggles to Sing Mode load from disk cache instantly (<10ms).

---

## 4. AI Singing Pitch & Timing Evaluation

The feedback algorithm compares the user's recorded vocal track against the isolated reference vocal stem:
1. **Pitch Tracking ($F_0$)**:
   - `librosa.yin` extracts fundamental pitch contours at 32ms hop sizes across a vocal search range of 65 Hz (C2) to 800 Hz (G5).
   - Voice Activity Detection (VAD) filters out background noise and breathing pauses.
2. **Pitch Accuracy (50% weight)**:
   - For every mutually voiced frame:
     $$\Delta_{\text{cents}} = \left|1200 \cdot \log_2\left(\frac{f_{\text{user}}}{f_{\text{ref}}}\right)\right|$$
   - Octave equivalence fold: singers singing an octave higher or lower are credited accurately.
3. **Timing & Rhythm (40% weight)**:
   - Spectral flux onset detection measures note start timing against reference vocal phrasing.
4. **Note Stability (10% weight)**:
   - Measures standard deviation of pitch on held notes to evaluate vibrato control vs vocal wobble.
5. **Feedback Generator**:
   - Synthesizes personalized coaching tips based on measured cents deviation and onset timings.

