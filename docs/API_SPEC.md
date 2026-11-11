# VocaFlow AI - REST API Specification

Base URL: `http://127.0.0.1:8000/api`

## 1. Audio & Library Management

### `POST /api/audio/upload`
Upload an audio file (MP3, WAV, FLAC, M4A).
- **Body**: `multipart/form-data` with `file: UploadFile`
- **Response**:
```json
{
  "id": "e43f7008",
  "title": "Rathinamo",
  "artist": "Saurav Srisan",
  "album": "Rathinamo (Indie)",
  "duration": 189.96,
  "format": "mp3",
  "has_stems": false,
  "artwork_path": "local_storage/artworks/e43f7008.jpg"
}
```

### `GET /api/audio/stream/{track_id}`
Stream audio file with HTTP 206 Partial Content range seeking support.

### `GET /api/audio/stems/{track_id}/{stem_type}`
Stream isolated stem. `stem_type` is either `vocals` or `instrumental`.

### `GET /api/library`
Retrieve library tracks.
- **Query Params**:
  - `search` (string): Search filter
  - `filter_type` (`all` | `ready` | `favorites`)
  - `sort_by` (`created_at` | `title` | `artist` | `duration`)

---

## 2. AI Vocal Separation

### `POST /api/separation/start`
Start background vocal separation.
- **Request**:
```json
{
  "track_id": "e43f7008",
  "quality": "balanced",
  "model": "htdemucs"
}
```
- **Response**:
```json
{
  "job_id": "c76bdd90",
  "track_id": "e43f7008",
  "status": "queued"
}
```

### `GET /api/separation/status/{job_id}`
Retrieve separation progress.
- **Response**:
```json
{
  "job_id": "c76bdd90",
  "track_id": "e43f7008",
  "status": "processing",
  "progress": 65.4,
  "quality": "balanced",
  "model": "htdemucs"
}
```

### `GET /api/separation/result/{job_id}`
Retrieve URLs for generated stems.
- **Response**:
```json
{
  "job_id": "c76bdd90",
  "track_id": "e43f7008",
  "status": "completed",
  "vocal_url": "/api/audio/stems/e43f7008/vocals",
  "instrumental_url": "/api/audio/stems/e43f7008/instrumental"
}
```

---

## 3. Synchronized Lyrics

### `POST /api/lyrics/import`
Import synchronized lyrics in LRC or SRT format.
- **Request**:
```json
{
  "track_id": "e43f7008",
  "format": "lrc",
  "raw_content": "[00:15.00]Rathinamo en jeevanil\n[00:20.50]Kalandhavale en kangalil"
}
```

### `GET /api/lyrics/{track_id}`
Retrieve parsed timestamped lyric lines.

---

## 4. Singing Evaluation & Recording

### `POST /api/recording/save`
Save microphone vocal recording.
- **Body**: `multipart/form-data` with `track_id`, `duration`, `effects`, and `audio_file`.

### `POST /api/singing/evaluate`
Evaluate vocal performance against reference vocal track.
- **Request**:
```json
{
  "recording_id": "a03c45b4",
  "track_id": "e43f7008"
}
```
- **Response**:
```json
{
  "overall_score": 88,
  "pitch_score": 86,
  "timing_score": 90,
  "rhythm_score": 89,
  "stability_score": 85,
  "feedback": "Overall singing score: 88/100. Remarkable pitch accuracy...",
  "strengths": ["Remarkable pitch accuracy!", "Sharp rhythmic timing."],
  "improvements": ["Refine diaphragmatic breath support on high register notes."],
  "pitch_contour": [
    { "time": 0.0, "user_pitch": 60.0, "ref_pitch": 60.0 }
  ]
}
```

