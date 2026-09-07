import { DetectionSignal } from '../../shared/types';

export const BRAINROT_REGEXES: RegExp[] = [
  /\b(?:skibidi(?:\s+toilet)?|grimace\s+shake|ohio\s+rizz|baby\s+gronk|fanum\s+tax)\b/i,
  /\b(?:mewing\s+tutorial|looksmaxxing|sigma\s+grindset|smurf\s+cat)\b/i,
  /\b(?:subway\s+surfers\s+gameplay|soap\s+cutting\s+asmr|kinetic\s+sand\s+cutting)\b/i,
  /\b(?:slime\s+satisfying\s+compilation|oddly\s+satisfying\s+asmr\s+slop)\b/i,
  /\b(?:garten\s+of\s+banban|poppy\s+playtime\s+animation|rainbow\s+friends\s+animation)\b/i
];

export function detectBrainrot(title: string): DetectionSignal[] {
  const signals: DetectionSignal[] = [];

  for (const regex of BRAINROT_REGEXES) {
    const match = title.match(regex);
    if (match) {
      signals.push({
        category: 'brainrot',
        score: 35,
        reason: 'Brainrot meme / sensory hook pattern',
        matchedPattern: match[0]
      });
      break;
    }
  }

  return signals;
}
