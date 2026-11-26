import { describe, it, expect } from 'vitest';
import { repairAndParseJsonObject } from './json-repair';

describe('repairAndParseJsonObject', () => {
  it('parses valid plain JSON object', () => {
    const res = repairAndParseJsonObject('{"meeting_title": "Sync"}');
    expect(res).toEqual({ meeting_title: 'Sync' });
  });

  it('repairs mismatched array bracket closing an object literal', () => {
    const malformed = `{
      "meeting_title": "Penyelarasan Arsitektur",
      "meeting_dynamics": {
        "speaker_talk_time": [{"speaker": "Ki", "duration_minutes": 25, "percentage": 43.1}],
        "consensus_score": "85%",
        "sentiment_trajectory": "Kolaboratif"
      ],
      "next_meeting": "TBD"
    }`;

    const res = repairAndParseJsonObject(malformed);
    expect(res).not.toBeNull();
    expect(res?.meeting_title).toBe('Penyelarasan Arsitektur');
    expect((res?.meeting_dynamics as Record<string, unknown>)?.consensus_score).toBe('85%');
    expect(res?.next_meeting).toBe('TBD');
  });

  it('repairs trailing commas inside fenced JSON blocks', () => {
    const fenced = '```json\n{"title": "Test [v1] {draft}", "items": ["a", "b",],}\n```';
    const res = repairAndParseJsonObject(fenced);
    expect(res).toEqual({ title: 'Test [v1] {draft}', items: ['a', 'b'] });
  });

  it('returns null for non-JSON markdown content', () => {
    expect(repairAndParseJsonObject('# Executive Summary\nJust markdown text.')).toBeNull();
  });

  it('repairs unterminated string ending with trailing backslash', () => {
    const res = repairAndParseJsonObject('{"meeting_title": "Trailing\\');
    expect(res).toEqual({ meeting_title: 'Trailing\\' });
  });
});

