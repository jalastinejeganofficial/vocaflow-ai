from app.lyrics.lrc_parser import parse_lrc, parse_srt, parse_lyrics

def test_parse_standard_lrc():
    sample_lrc = """[ti:Test Song]
[ar:Vocalist]
[00:04.50]First line of lyrics
[00:10.25]Second line of song
[01:05.80]Bridge section starts here
"""
    parsed = parse_lrc(sample_lrc)
    assert len(parsed) == 3
    assert parsed[0]["time"] == 4.5
    assert parsed[0]["text"] == "First line of lyrics"
    assert parsed[1]["time"] == 10.25
    assert parsed[2]["time"] == 65.80

def test_parse_srt():
    sample_srt = """1
00:00:05,200 --> 00:00:08,500
Hello karaoke world

2
00:00:12,000 --> 00:00:15,000
Sing with me now
"""
    parsed = parse_srt(sample_srt)
    assert len(parsed) == 2
    assert parsed[0]["time"] == 5.2
    assert parsed[0]["text"] == "Hello karaoke world"
    assert parsed[1]["time"] == 12.0

def test_parse_plain_text():
    sample_txt = "Line one\nLine two\nLine three"
    parsed = parse_lyrics(sample_txt, "text")
    assert len(parsed) == 3
    assert parsed[0]["text"] == "Line one"

