import uuid
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from app.config import settings
from app.database import get_db
from app.storage.file_storage import FileStorage
from app.separation.demucs_engine import DemucsEngine

executor = ThreadPoolExecutor(max_workers=settings.SEPARATION_WORKERS)
active_jobs: Dict[str, dict] = {}

class SeparationService:
    @classmethod
    def start_job(cls, track_id: str, quality: str = "balanced", model: str = "htdemucs") -> str:
        """Starts a background separation job or returns existing stem reference."""
        # 1. Check if track already has generated stems
        with get_db() as db:
            row = db.execute("SELECT * FROM tracks WHERE id = ?", (track_id,)).fetchone()
            if not row:
                raise ValueError(f"Track with id '{track_id}' not found.")
                
            vocal_p = FileStorage.get_vocal_path(track_id)
            inst_p = FileStorage.get_instrumental_path(track_id)
            
            if vocal_p.exists() and inst_p.exists():
                # Already cached and ready!
                job_id = f"cached-{uuid.uuid4().hex[:6]}"
                db.execute("""
                    INSERT INTO separation_jobs (
                        id, track_id, status, progress, quality, model, vocal_path, instrumental_path, started_at, completed_at
                    ) VALUES (?, ?, 'completed', 100.0, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (job_id, track_id, quality, model, str(vocal_p), str(inst_p)))
                db.execute("UPDATE tracks SET has_stems = 1, vocal_path = ?, instrumental_path = ? WHERE id = ?", 
                           (str(vocal_p), str(inst_p), track_id))
                db.commit()
                return job_id

        # 2. Create new separation job
        job_id = str(uuid.uuid4())[:8]
        with get_db() as db:
            db.execute("""
                INSERT INTO separation_jobs (
                    id, track_id, status, progress, quality, model, started_at
                ) VALUES (?, ?, 'queued', 0.0, ?, ?, CURRENT_TIMESTAMP)
            """, (job_id, track_id, quality, model))
            db.commit()
            
        active_jobs[job_id] = {"cancel": False}
        
        # Submit to thread pool
        executor.submit(cls._run_separation_worker, job_id, track_id, quality, model)
        return job_id

    @classmethod
    def _run_separation_worker(cls, job_id: str, track_id: str, quality: str, model: str):
        """Worker thread executing vocal separation."""
        try:
            with get_db() as db:
                db.execute("UPDATE separation_jobs SET status = 'processing', progress = 5.0 WHERE id = ?", (job_id,))
                track_row = db.execute("SELECT original_path FROM tracks WHERE id = ?", (track_id,)).fetchone()
                db.commit()
                
            if not track_row:
                raise ValueError(f"Track {track_id} not found")
                
            input_audio = Path(track_row["original_path"])
            output_dir = FileStorage.get_track_stems_dir(track_id)
            
            engine = DemucsEngine(model_name=model)
            
            def on_progress(pct: float, message: str):
                with get_db() as db:
                    db.execute("UPDATE separation_jobs SET progress = ? WHERE id = ?", (round(pct, 1), job_id))
                    db.commit()
                    
            def cancel_check() -> bool:
                return active_jobs.get(job_id, {}).get("cancel", False)
                
            stems = engine.separate(
                input_audio_path=input_audio,
                output_dir=output_dir,
                quality=quality,
                progress_callback=on_progress,
                cancel_check=cancel_check
            )
            
            vocal_path_str = str(stems["vocal"])
            inst_path_str = str(stems["instrumental"])
            
            with get_db() as db:
                db.execute("""
                    UPDATE separation_jobs 
                    SET status = 'completed', progress = 100.0, vocal_path = ?, instrumental_path = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (vocal_path_str, inst_path_str, job_id))
                
                db.execute("""
                    UPDATE tracks 
                    SET has_stems = 1, vocal_path = ?, instrumental_path = ?, status = 'ready'
                    WHERE id = ?
                """, (vocal_path_str, inst_path_str, track_id))
                db.commit()
                
        except Exception as e:
            print(f"Separation worker failed for job {job_id}: {e}")
            with get_db() as db:
                db.execute("""
                    UPDATE separation_jobs 
                    SET status = 'failed', error_message = ?
                    WHERE id = ?
                """, (str(e), job_id))
                db.commit()
        finally:
            active_jobs.pop(job_id, None)

    @staticmethod
    def get_status(job_id: str) -> Optional[dict]:
        with get_db() as db:
            row = db.execute("SELECT * FROM separation_jobs WHERE id = ?", (job_id,)).fetchone()
            if not row:
                return None
            return dict(row)

    @staticmethod
    def cancel_job(job_id: str) -> bool:
        if job_id in active_jobs:
            active_jobs[job_id]["cancel"] = True
            with get_db() as db:
                db.execute("UPDATE separation_jobs SET status = 'cancelled' WHERE id = ?", (job_id,))
                db.commit()
            return True
        return False

