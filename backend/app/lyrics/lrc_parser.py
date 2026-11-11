import re
from typing import List, Dict, Any, Optional

LRC_LINE_REGEX = re.compile(r"^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)$")
LRC_TAG_REGEX = re.compile(r"^\[([a-zA-Z]+):(.*)\]$")
SRT_TIMESTAMP_REGEX = re.compile(r"(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})")

def parse_time_to_seconds(minutes: str, seconds: str, centis: Optional[str]) -> float:
    m = float(minutes)
    s = float(seconds)
    c = 0.0
    if centis:
        if len(centis) == 1:
            c = float(centis) / 10.0
        elif len(centis) == 2:
            c = float(centis) / 100.0
        else:
            c = float(centis[:3]) / 1000.0
    return round(m * 60.0 + s + c, 3)

def parse_lrc(content: str) -> List[Dict[str, Any]]:
    """Parses LRC string into list of timestamped lines."""
    lines_output = []
    lines = content.strip().splitlines()
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for metadata tags
        tag_match = LRC_TAG_REGEX.match(line)
        if tag_match:
            continue
            
        # Find all timestamps in the line (some LRC lines have multiple timestamps)
        matches = list(re.finditer(r"\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]", line))
        if matches:
            # The text comes after the last timestamp match
            text = line[matches[-1].end():].strip()
            
            # Check for inline word timestamps: <00:15.30>
            word_matches = list(re.finditer(r"<(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?>([^<]+)", text))
            words = []
            if word_matches:
                for wm in word_matches:
                    w_time = parse_time_to_seconds(wm.group(1), wm.group(2), wm.group(3))
                    w_text = wm.group(4).strip()
                    words.append({"word": w_text, "start": w_time, "end": w_time + 0.5})
                # Clean text
                clean_text = re.sub(r"<\d{1,2}:\d{2}(?:\.\d{1,3})?>", "", text).strip()
            else:
                clean_text = text
                
            for m in matches:
                sec = parse_time_to_seconds(m.group(1), m.group(2), m.group(3))
                lines_output.append({
                    "time": sec,
                    "text": clean_text,
                    "words": words if words else None
                })
                
    # Sort chronologically
    lines_output.sort(key=lambda x: x["time"])
    return lines_output

def parse_srt(content: str) -> List[Dict[str, Any]]:
    """Parses SRT subtitle content into lyric lines."""
    lines_output = []
    blocks = content.strip().split("\n\n")
    
    for block in blocks:
        parts = [p.strip() for p in block.splitlines() if p.strip()]
        if len(parts) >= 2:
            time_line = parts[1] if parts[0].isdigit() else parts[0]
            text_lines = parts[2:] if parts[0].isdigit() else parts[1:]
            
            match = SRT_TIMESTAMP_REGEX.search(time_line)
            if match:
                h, m, s, ms = map(float, match.groups()[:4])
                start_sec = round(h * 3600.0 + m * 60.0 + s + (ms / 1000.0), 3)
                text = " ".join(text_lines)
                lines_output.append({
                    "time": start_sec,
                    "text": text,
                    "words": None
                })
                
    lines_output.sort(key=lambda x: x["time"])
    return lines_output

def parse_lyrics(content: str, fmt: str = "lrc") -> List[Dict[str, Any]]:
    """Unified entry point for lyrics parsing."""
    if fmt.lower() == "srt" or ("-->" in content):
        return parse_srt(content)
    elif fmt.lower() == "lrc" or ("[" in content and "]" in content):
        return parse_lrc(content)
    else:
        # Plain text without timestamps: distribute evenly or place at 0
        raw_lines = [l.strip() for l in content.splitlines() if l.strip()]
        return [{"time": round(i * 4.0, 2), "text": l, "words": None} for i, l in enumerate(raw_lines)]

