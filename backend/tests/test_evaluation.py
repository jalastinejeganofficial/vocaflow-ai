import numpy as np
import soundfile as sf
import tempfile
from pathlib import Path
from app.evaluation.pitch_evaluator import hz_to_midi, evaluate_singing

def test_hz_to_midi():
    # A4 = 440 Hz -> MIDI 69
    assert hz_to_midi(440.0) == 69.0
    # A5 = 880 Hz -> MIDI 81
    assert hz_to_midi(880.0) == 81.0

def test_synthetic_singing_evaluation():
    # Create two synthetic tones: 440 Hz sine wave
    sr = 16000
    t = np.linspace(0, 3.0, int(sr * 3.0), endpoint=False)
    tone_ref = 0.5 * np.sin(2 * np.pi * 440.0 * t)
    # User sings slightly flat (435 Hz)
    tone_user = 0.5 * np.sin(2 * np.pi * 435.0 * t)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        ref_p = Path(tmpdir) / "ref.wav"
        user_p = Path(tmpdir) / "user.wav"
        
        sf.write(str(ref_p), tone_ref, sr)
        sf.write(str(user_p), tone_user, sr)
        
        report = evaluate_singing(user_p, ref_p)
        
        assert "overall_score" in report
        assert 0 <= report["overall_score"] <= 100
        assert "pitch_score" in report
        assert "timing_score" in report
        assert len(report["pitch_contour"]) > 0
        assert len(report["strengths"]) > 0

