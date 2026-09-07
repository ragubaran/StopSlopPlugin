import { DetectionSignal } from '../../shared/types';

export const TTS_REGEXES: RegExp[] = [
  /\b(?:ai\s+voice(?:over)?|text\s+to\s+speech|elevenlabs\s+voice|cloned\s+voice)\b/i,
  /\b(?:synthetic\s+voice|auto-?generated\s+voice|ai\s+narrat(?:ion|ed|or))\b/i,
  /\b(?:scary\s+stories\s+read\s+by\s+ai|ai\s+reddit\s+voice)\b/i
];

export function detectTtsSignals(title: string): DetectionSignal[] {
  const signals: DetectionSignal[] = [];

  for (const regex of TTS_REGEXES) {
    const match = title.match(regex);
    if (match) {
      signals.push({
        category: 'tts-narrator',
        score: 30,
        reason: 'Automated TTS / synthetic voice marker',
        matchedPattern: match[0]
      });
      break;
    }
  }

  return signals;
}
