import sqlite3
import json
from contextlib import contextmanager
from datetime import datetime
from typing import Generator
from app.config import settings

def init_db():
    """Initialize database tables with WAL mode for high concurrency."""
    with sqlite3.connect(settings.DATABASE_PATH) as conn:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
        cursor = conn.cursor()
        
        # Tracks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tracks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT DEFAULT 'Unknown Artist',
                album TEXT DEFAULT 'Unknown Album',
                duration REAL DEFAULT 0.0,
                original_path TEXT NOT NULL,
                artwork_path TEXT,
                format TEXT,
                sample_rate INTEGER DEFAULT 48000,
                channels INTEGER DEFAULT 2,
                has_stems INTEGER DEFAULT 0,
                vocal_path TEXT,
                instrumental_path TEXT,
                drums_path TEXT,
                bass_path TEXT,
                other_path TEXT,
                status TEXT DEFAULT 'ready',
                play_count INTEGER DEFAULT 0,
                is_favorite INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Separation jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS separation_jobs (
                id TEXT PRIMARY KEY,
                track_id TEXT NOT NULL,
                status TEXT DEFAULT 'queued',
                progress REAL DEFAULT 0.0,
                quality TEXT DEFAULT 'balanced',
                model TEXT DEFAULT 'htdemucs',
                error_message TEXT,
                vocal_path TEXT,
                instrumental_path TEXT,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY(track_id) REFERENCES tracks(id)
            )
        """)
        
        # Lyrics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lyrics (
                id TEXT PRIMARY KEY,
                track_id TEXT NOT NULL UNIQUE,
                format TEXT DEFAULT 'lrc',
                raw_content TEXT,
                parsed_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(track_id) REFERENCES tracks(id)
            )
        """)
        
        # Recordings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS recordings (
                id TEXT PRIMARY KEY,
                track_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                duration REAL DEFAULT 0.0,
                effects_used TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(track_id) REFERENCES tracks(id)
            )
        """)
        
        # Singing Evaluations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS evaluations (
                id TEXT PRIMARY KEY,
                recording_id TEXT NOT NULL,
                track_id TEXT NOT NULL,
                overall_score INTEGER DEFAULT 0,
                pitch_score INTEGER DEFAULT 0,
                timing_score INTEGER DEFAULT 0,
                rhythm_score INTEGER DEFAULT 0,
                stability_score INTEGER DEFAULT 0,
                feedback TEXT,
                pitch_data_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(recording_id) REFERENCES recordings(id),
                FOREIGN KEY(track_id) REFERENCES tracks(id)
            )
        """)
        
        # Playback history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                track_id TEXT NOT NULL,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completion_percentage REAL DEFAULT 0.0,
                mode TEXT DEFAULT 'normal',
                FOREIGN KEY(track_id) REFERENCES tracks(id)
            )
        """)
        
        # Settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        
        conn.commit()

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    init_db()  # Ensure tables exist
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
