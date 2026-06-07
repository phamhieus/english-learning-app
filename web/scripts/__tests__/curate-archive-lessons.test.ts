import { describe, expect, it } from 'vitest';
import {
  clockToMs,
  getTranscriptCandidate,
  mergeIntoSentences,
  parseSubtitle,
  pickVideoFile,
} from '../curate-archive-lessons.mjs';

describe('clockToMs', () => {
  it('parses SRT comma milliseconds', () => {
    expect(clockToMs('00:00:02,100')).toBe(2100);
    expect(clockToMs('01:02:03,500')).toBe(3723500);
  });
  it('parses VTT dot milliseconds and MM:SS form', () => {
    expect(clockToMs('00:05.400')).toBe(5400);
    expect(clockToMs('00:00:08.300')).toBe(8300);
  });
});

describe('parseSubtitle', () => {
  it('parses an SRT cue list into timed segments (spec §6 example)', () => {
    const srt = `1
00:00:02,100 --> 00:00:05,400
How are you doing today?

2
00:00:05,600 --> 00:00:08,300
I'm doing great. Thank you.
`;
    expect(parseSubtitle(srt)).toEqual([
      { startMs: 2100, endMs: 5400, text: 'How are you doing today?' },
      { startMs: 5600, endMs: 8300, text: "I'm doing great. Thank you." },
    ]);
  });

  it('parses a WebVTT file, ignoring the header and tags', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
<v Speaker>Hello <b>there</b>

00:00:03.000 --> 00:00:04.000
General Kenobi
`;
    expect(parseSubtitle(vtt)).toEqual([
      { startMs: 1000, endMs: 3000, text: 'Hello there' },
      { startMs: 3000, endMs: 4000, text: 'General Kenobi' },
    ]);
  });

  it('drops cues with empty text or non-positive duration', () => {
    const srt = `1
00:00:02,000 --> 00:00:02,000
zero length

2
00:00:03,000 --> 00:00:05,000
kept
`;
    expect(parseSubtitle(srt)).toEqual([{ startMs: 3000, endMs: 5000, text: 'kept' }]);
  });
});

describe('mergeIntoSentences', () => {
  it('joins fragments until sentence-ending punctuation', () => {
    const cues = [
      { startMs: 0, endMs: 800, text: 'I really' },
      { startMs: 800, endMs: 1600, text: 'like this' },
      { startMs: 1600, endMs: 2400, text: 'place.' },
      { startMs: 2400, endMs: 3200, text: 'It is calm.' },
    ];
    const merged = mergeIntoSentences(cues);
    expect(merged).toEqual([
      { startMs: 0, endMs: 2400, text: 'I really like this place.' },
      { startMs: 2400, endMs: 3200, text: 'It is calm.' },
    ]);
  });

  it('flushes on the max duration budget even without punctuation', () => {
    const cues = [
      { startMs: 0, endMs: 4000, text: 'one two three' },
      { startMs: 4000, endMs: 9000, text: 'four five six' },
    ];
    const merged = mergeIntoSentences(cues, { maxMs: 5000, maxChars: 999 });
    expect(merged.length).toBeGreaterThanOrEqual(1);
    expect(merged[0].startMs).toBe(0);
  });
});

describe('pickVideoFile', () => {
  it('prefers a small progressive mp4 and skips _edit cuts', () => {
    const files = [
      { name: 'Film.ogv' },
      { name: 'Film_edit.mp4' },
      { name: 'Film.mp4' },
      { name: 'Film_512kb.mp4' },
    ];
    expect(pickVideoFile(files)).toBe('Film_512kb.mp4');
  });
  it('returns null when nothing is streamable', () => {
    expect(pickVideoFile([{ name: 'Film.avi' }, { name: 'data.json' }])).toBeNull();
  });
});

describe('getTranscriptCandidate', () => {
  it('follows the priority ladder (align > en.vtt > asr.srt)', () => {
    const files = [
      { name: 'x.asr.srt' },
      { name: 'x.en.vtt' },
      { name: 'x.align.srt' },
    ];
    expect(getTranscriptCandidate(files)?.filename).toBe('x.align.srt');
  });
  it('falls back to a plain .srt and reports its type', () => {
    expect(getTranscriptCandidate([{ name: 'x.srt' }])).toEqual({
      filename: 'x.srt',
      type: 'srt',
      priority: 60,
    });
  });
  it('returns null when there is no subtitle', () => {
    expect(getTranscriptCandidate([{ name: 'x.mp4' }])).toBeNull();
  });
});
