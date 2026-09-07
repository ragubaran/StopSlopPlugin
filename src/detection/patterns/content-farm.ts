import { DetectionSignal } from '../../shared/types';

export const CONTENT_FARM_REGEXES: RegExp[] = [
  /\b(?:facts\s+that\s+will\s+save\s+your\s+life|unbelievable\s+facts\s+you\s+didn'?t\s+know)\b/i,
  /\b(?:dark\s+psychology\s+tricks?|sigma\s+(?:male\s+)?rule\s+#\d+|how\s+to\s+manipulate\s+anyone)\b/i,
  /\b(?:this\s+changes\s+everything|the\s+end\s+of\s+[a-zA-Z]+|why\s+everyone\s+is\s+leaving)\b/i,
  /\b(?:nobody\s+is\s+talking\s+about\s+this|they\s+don'?t\s+want\s+you\s+to\s+know|secret\s+revealed)\b/i,
  /\b(?:100\s+days\s+in\s+hardcore|top\s+10\s+[a-z0-9\s]+that\s+will\s+blow\s+your\s+mind)\b/i,
  /\b(?:you\s+won'?t\s+believe\s+what\s+happened|watch\s+till\s+the\s+end\s+to\s+see)\b/i
];

export function detectContentFarm(title: string): DetectionSignal[] {
  const signals: DetectionSignal[] = [];

  for (const regex of CONTENT_FARM_REGEXES) {
    const match = title.match(regex);
    if (match) {
      signals.push({
        category: 'content-farm',
        score: 25,
        reason: 'Content farm listicle / hyper-curiosity formula',
        matchedPattern: match[0]
      });
      break;
    }
  }

  // Structural Clickbait Checks:
  // 1. ALL CAPS Ratio
  if (title.length >= 16) {
    const letters = title.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 10) {
      const uppers = (letters.match(/[A-Z]/g) || []).length;
      if (uppers / letters.length >= 0.75) {
        signals.push({
          category: 'clickbait',
          score: 20,
          reason: 'Excessive ALL-CAPS title (>75%)'
        });
      }
    }
  }

  // 2. Sensational Punctuation
  if (/[!?]{3,}/.test(title)) {
    signals.push({
      category: 'clickbait',
      score: 15,
      reason: 'Sensational punctuation (??? / !!!)'
    });
  }

  // 3. Emoji Spam
  const emojis = title.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu);
  if (emojis && emojis.length >= 3) {
    signals.push({
      category: 'clickbait',
      score: 15,
      reason: 'Excessive emojis in title'
    });
  }

  return signals;
}
