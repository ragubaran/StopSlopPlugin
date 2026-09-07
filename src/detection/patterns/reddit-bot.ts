import { DetectionSignal } from '../../shared/types';

export const REDDIT_BOT_REGEXES: RegExp[] = [
  /\b(?:r\/(?:askreddit|aita|amitheasshole|tifu|relationship_advice|maliciouscompliance|entitledparents))\b/i,
  /\b(?:aita\s+for|am\s+i\s+the\s+a\*\*?hole|reddit\s+stories(?:\s+episode|\s+#\d+)?)\b/i,
  /\b(?:my\s+(?:wife|husband|mother-in-law)\s+(?:cheated|demanded|did\s+this)|update:\s+my\s+(?:wife|husband))\b/i,
  /\b(?:reddit\s+top\s+posts?|best\s+of\s+reddit\s+stories)\b/i
];

export function detectRedditBot(title: string): DetectionSignal[] {
  const signals: DetectionSignal[] = [];

  for (const regex of REDDIT_BOT_REGEXES) {
    const match = title.match(regex);
    if (match) {
      signals.push({
        category: 'reddit-bot',
        score: 35,
        reason: 'Automated Reddit story / forum scraping format',
        matchedPattern: match[0]
      });
      break;
    }
  }

  return signals;
}
