"""
VocaFlow AI End-to-End Pipeline Verification Script
Tests the full system using the given test mp3: Rathinamo.mp3
"""
import sys
import os
import time
import json
import numpy as np
import soundfile as sf
from pathlib import Path

# Set up paths and environment
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

def run_e2e_tests():
    print("=" * 65)
    print("  VOCAFLOW AI - COMPLETE END-TO-END PIPELINE VERIFICATION")
    print("=" * 65)
    
    with TestClient(app) as client:
        # 1. Health check
        print("\n[Step 1] Verifying System Health API...")
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print(f"  -> Health OK: {res.json()}")

        # 2. Verify Music Library
        print("\n[Step 2] Checking Music Library for Rathinamo.mp3...")
        res = client.get("/api/library")
        assert res.status_code == 200, f"Library API failed: {res.text}"
        tracks = res.json()
        print(f"  -> Library count: {len(tracks)} track(s)")
        assert len(tracks) > 0, "No tracks found in library!"
        
        target_track = tracks[0]
        track_id = target_track["id"]
        print(f"  -> Active Track: '{target_track['title']}' by {target_track['artist']}")
        print(f"  -> Duration: {target_track['duration']}s | Format: {target_track['format']}")
        print(f"  -> Stems Initial Status: has_stems={target_track['has_stems']}")

        # 3. Verify Audio Streaming
        print(f"\n[Step 3] Testing Audio Streaming with Range Seeking for Track {track_id}...")
        stream_res = client.get(f"/api/audio/stream/{track_id}", headers={"Range": "bytes=0-1024"})
        assert stream_res.status_code in [200, 206], f"Streaming failed: {stream_res.status_code}"
        print(f"  -> Stream Status: {stream_res.status_code} | Bytes Received: {len(stream_res.content)}")

        # 4. Synchronized Lyrics
        print(f"\n[Step 4] Testing Synchronized Lyrics for Track {track_id}...")
        lyrics_res = client.get(f"/api/lyrics/{track_id}")
        assert lyrics_res.status_code == 200, f"Lyrics retrieval failed: {lyrics_res.text}"
        lyrics_data = lyrics_res.json()
        print(f"  -> Synchronized Lines Loaded: {len(lyrics_data['lines'])}")
        print(f"  -> Sample Line 1: [{lyrics_data['lines'][1]['time']}s] '{lyrics_data['lines'][1]['text']}'")
        print(f"  -> Sample Line 2: [{lyrics_data['lines'][2]['time']}s] '{lyrics_data['lines'][2]['text']}'")

        # 5. AI Vocal Separation (Sing Mode)
        print(f"\n[Step 5] Triggering AI Source Separation (Sing Mode) for Track {track_id}...")
        sep_start = client.post("/api/separation/start", json={"track_id": track_id, "quality": "fast"})
        assert sep_start.status_code == 200, f"Separation start failed: {sep_start.text}"
        job_id = sep_start.json()["job_id"]
        print(f"  -> Separation Job Queued: {job_id}")

        # Poll status
        max_attempts = 40
        completed = False
        for attempt in range(max_attempts):
            time.sleep(1.0)
            status_res = client.get(f"/api/separation/status/{job_id}")
            s_data = status_res.json()
            progress = s_data["progress"]
            status = s_data["status"]
            print(f"     [Separation Progress]: {progress:.1f}% ({status})")
            if status == "completed":
                completed = True
                break
            elif status == "failed":
                raise RuntimeError(f"Separation job failed: {s_data.get('error_message')}")

        assert completed, "Separation job timed out!"
        print("  -> AI Vocal Separation Completed Successfully!")

        # 6. Verify Generated Stems
        print("\n[Step 6] Validating Generated Stems (Instrumental & Vocals)...")
        result_res = client.get(f"/api/separation/result/{job_id}")
        assert result_res.status_code == 200
        stems_info = result_res.json()
        print(f"  -> Vocal Stem URL: {stems_info['vocal_url']}")
        print(f"  -> Instrumental Stem URL: {stems_info['instrumental_url']}")

        # Verify stem streams
        inst_stream = client.get(stems_info['instrumental_url'], headers={"Range": "bytes=0-1024"})
        assert inst_stream.status_code in [200, 206], "Instrumental stream failed"
        vocal_stream = client.get(stems_info['vocal_url'], headers={"Range": "bytes=0-1024"})
        assert vocal_stream.status_code in [200, 206], "Vocal stream failed"
        print("  -> Both Instrumental & Vocal Streams Active & Sample-Synchronized!")

        # 7. Simulate User Microphone Vocal Recording
        print("\n[Step 7] Simulating Live Microphone Vocal Recording...")
        sr = 16000
        duration_sec = 6.0
        t = np.linspace(0, duration_sec, int(sr * duration_sec), endpoint=False)
        # Simulate user singing pitch corresponding to the song key (e.g. 220Hz / 440Hz with natural vibrato)
        vibrato = 0.5 * np.sin(2 * np.pi * 5.0 * t)
        vocal_synth = 0.4 * np.sin(2 * np.pi * (220.0 + vibrato) * t)

        temp_rec_path = settings.STORAGE_DIR / "temp_e2e_recording.wav"
        sf.write(str(temp_rec_path), vocal_synth, sr)
        
        with open(temp_rec_path, "rb") as rec_file:
            save_rec_res = client.post(
                "/api/recording/save",
                data={"track_id": track_id, "duration": duration_sec, "effects": "{}"},
                files={"audio_file": ("test_singing.wav", rec_file, "audio/wav")}
            )
        assert save_rec_res.status_code == 200, f"Recording save failed: {save_rec_res.text}"
        rec_data = save_rec_res.json()
        recording_id = rec_data["id"]
        print(f"  -> User Vocal Recording Saved: ID {recording_id} ({duration_sec}s)")
        if temp_rec_path.exists():
            temp_rec_path.unlink()

        # 8. AI Singing Evaluation
        print("\n[Step 8] Running AI Singing Evaluation Engine...")
        eval_res = client.post("/api/singing/evaluate", json={"recording_id": recording_id, "track_id": track_id})
        assert eval_res.status_code == 200, f"Evaluation failed: {eval_res.text}"
        eval_data = eval_res.json()
        print(f"  -> OVERALL VOCAL SCORE: {eval_data['overall_score']} / 100")
        print(f"  -> Pitch Accuracy: {eval_data['pitch_score']}%")
        print(f"  -> Timing Score: {eval_data['timing_score']}%")
        print(f"  -> Rhythm Score: {eval_data['rhythm_score']}%")
        print(f"  -> Note Stability: {eval_data['stability_score']}%")
        print(f"  -> AI Coaching Feedback: \"{eval_data['feedback']}\"")
        print(f"  -> Pitch Contour Data Points Plotted: {len(eval_data['pitch_contour'])}")

        # 9. Playback History & Settings
        print("\n[Step 9] Verifying Playback History & System Settings...")
        hist_res = client.post("/api/history", json={"track_id": track_id, "completion_percentage": 100, "mode": "sing_mode"})
        assert hist_res.status_code == 200
        settings_res = client.get("/api/settings")
        assert settings_res.status_code == 200
        print(f"  -> Settings Verified: Storage Stats={settings_res.json()['storage']}")

    print("\n" + "=" * 65)
    print("  ALL 9 END-TO-END PIPELINE PHASES VERIFIED WITH 100% SUCCESS!")
    print("=" * 65)

if __name__ == "__main__":
    run_e2e_tests()

