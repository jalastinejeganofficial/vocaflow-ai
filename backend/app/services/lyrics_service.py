import json
import uuid
from typing import Optional, Dict, Any, List
from app.database import get_db
from app.lyrics.lrc_parser import parse_lyrics

DEFAULT_RATHINAMO_LRC = """[ti:Rathinamo]
[ar:Saurav Srisan]
[al:Rathinamo (Indie)]
[by:VocaFlow AI]
[00:00.00]VocaFlow AI - Synchronized Smart Karaoke
[00:15.00]Rathinamo en jeevanil
[00:20.50]Kalandhavale en kangalil
[00:25.80]Un parvaiyal vizhundhenadi
[00:31.20]En thanimayil thunayanai
[00:36.50]Kaatrai pola nee vandhadhum
[00:41.80]Nenjil aasaigal poothadhum
[00:47.10]Nizhalaga un pinnae naan
[00:52.40]Uyiraga en kooda nee
[00:58.00]Rathinamo oh Rathinamo
[01:03.50]En kaadhalin pon deepamo
[01:08.80]Rathinamo en Rathinamo
[01:14.20]En vaazhvin oru sandhoshymo
[01:21.00]♫ (Instrumental Solo) ♫
[01:38.00]Kangal moodi paarthaalum
[01:43.20]Un mugame mun nikkum
[01:48.50]Pesaamal nee sendraalum
[01:53.80]Mounam kooda kavidhai aagum
[01:59.20]Kai viral korthu povaaya
[02:04.60]En kaalam ellaam vaazhvaaya
[02:10.00]Oru nodiyum piriyamal
[02:15.30]En uyirodu kalappaaya
[02:20.80]Rathinamo oh Rathinamo
[02:26.20]En kaadhalin pon deepamo
[02:31.50]Rathinamo en Rathinamo
[02:36.80]En vaazhvin oru sandhoshymo
[02:45.00]♫ (Outro Melodic Flow) ♫
[03:00.00]VocaFlow AI Karaoke Master
"""

class LyricsService:
    @staticmethod
    def save_lyrics(track_id: str, raw_content: str, fmt: str = "lrc") -> Dict[str, Any]:
        parsed = parse_lyrics(raw_content, fmt)
        parsed_json_str = json.dumps(parsed)
        lyric_id = str(uuid.uuid4())[:8]
        
        with get_db() as db:
            db.execute("""
                INSERT INTO lyrics (id, track_id, format, raw_content, parsed_json)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(track_id) DO UPDATE SET
                    format = excluded.format,
                    raw_content = excluded.raw_content,
                    parsed_json = excluded.parsed_json,
                    created_at = CURRENT_TIMESTAMP
            """, (lyric_id, track_id, fmt, raw_content, parsed_json_str))
            db.commit()
            
        return {
            "track_id": track_id,
            "format": fmt,
            "raw_content": raw_content,
            "lines": parsed
        }

    @staticmethod
    def get_lyrics(track_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as db:
            row = db.execute("SELECT * FROM lyrics WHERE track_id = ?", (track_id,)).fetchone()
            if row:
                return {
                    "track_id": track_id,
                    "format": row["format"],
                    "raw_content": row["raw_content"],
                    "lines": json.loads(row["parsed_json"]),
                    "created_at": str(row["created_at"])
                }
                
            # Check track title to see if it is Rathinamo
            track_row = db.execute("SELECT title FROM tracks WHERE id = ?", (track_id,)).fetchone()
            if track_row and "rathinamo" in track_row["title"].lower():
                # Auto-initialize default lyrics for Rathinamo
                return LyricsService.save_lyrics(track_id, DEFAULT_RATHINAMO_LRC, "lrc")
                
            return None

