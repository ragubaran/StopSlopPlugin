import { DetectionSignal } from '../../shared/types';

export const AI_SLOP_REGEXES: RegExp[] = [
  /\b(?:i\s+asked\s+ai\s+to|what\s+happens\s+when\s+ai|ai\s+generated\s+animation|ai\s+recreates|ai\s+expanded)\b/i,
  /\b(?:midjourney|chatgpt|dall-?e|sora\s+ai|elevenlabs|runway\s+gen|stable\s+diffusion)\b/i,
  /(?:concept|teaser|movie|official)?\s*trailer\s*[\(\[]?\s*ai\s*(?:concept)?[\)\]]?/i,
  /\b(?:ai\s+(?:concept\s+)?(?:movie\s+|teaser\s+)?trailers?|fan-?made\s+ai\s+trailer)\b/i,
  /\b(?:100\s+days\s+in\s+ai|i\s+let\s+ai\s+control|ai\s+imagines|ai\s+draws|ai\s+predicts)\b/i,
  /\b(?:deepfake|ai\s+voice\s+cover|ai\s+sponge)\b/i
];

export function detectAiSlop(title: string): DetectionSignal[] {
  const signals: DetectionSignal[] = [];

  for (const regex of AI_SLOP_REGEXES) {
    const match = title.match(regex);
    if (match) {
      signals.push({
        category: 'ai-slop',
        score: 30,
        reason: 'AI-generated content or trailer marker',
        matchedPattern: match[0]
      });
      break; // One signal from regex group is enough
    }
  }

  return signals;
}
