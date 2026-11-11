# VocaFlow AI - Android Cross-Platform Build Guide

VocaFlow AI frontend is built with React 18, TypeScript, and modern Web APIs (Web Audio API, MediaStream, MediaRecorder, Canvas). It can be compiled into an Android APK / AAB using **Capacitor** or **React Native**.

---

## Method 1: Packaging with Capacitor (Fastest & Native Web Audio Support)

Capacitor embeds the modern Chrome/WebView engine with full hardware-accelerated Web Audio API, Low-Latency Audio, and Microphone access.

### 1. Prerequisites
- Node.js 18+ and npm
- Android Studio with Android SDK (API 33+)
- Java JDK 17

### 2. Add Capacitor to Frontend
In `vocaflow-ai/frontend/`:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "VocaFlow AI" "com.vocaflow.ai" --web-dir dist
```

### 3. Add Android Permissions
Open `android/app/src/main/AndroidManifest.xml` and add:
```xml
<!-- Microphone & Audio Recording -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- Local Storage & Audio Read -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

<!-- Internet & Background Playback -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### 4. Build and Sync
```bash
# Build React web application
npm run build

# Add Android native project
npx cap add android

# Sync web assets to Android project
npx cap sync android
```

### 5. Compile APK in Android Studio
```bash
npx cap open android
```
In Android Studio:
- Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
- Generated APK is located at: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Method 2: On-Device AI Separation (Android PyTorch Mobile / ONNX)
For high-end devices (Snapdragon 8 Gen 2/3 / Google Tensor):
- Export Demucs or MDX-Net to ONNX format:
  ```bash
  python -m demucs.export --format onnx --output htdemucs.onnx
  ```
- Use `onnxruntime-react-native` or native Android C++ PyTorch Mobile runtime to run inference locally on Qualcomm NPU.

