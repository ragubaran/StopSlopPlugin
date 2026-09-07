import { ConfidenceLevel, DetectionResult, DetectionSignal, FilterAction, FilterMode } from '../shared/types';

export class ScoreAggregator {
  static aggregate(
    signals: DetectionSignal[],
    sensitivity: number,
    filterMode: FilterMode
  ): DetectionResult {
    if (signals.length === 0) {
      return {
        isSlop: false,
        score: 0,
        categories: [],
        signals: [],
        confidence: 'LOW',
        action: 'IGNORE',
        summaryReason: 'Clean video'
      };
    }

    // Check for hard override (Blocked Channel)
    const hasBlockedChannel = signals.some(s => s.category === 'blocked-channel');
    if (hasBlockedChannel) {
      return {
        isSlop: true,
        score: 100,
        categories: ['blocked-channel'],
        signals,
        confidence: 'HIGH',
        action: filterMode === 'hide' ? 'HIDE' : filterMode === 'badge-only' ? 'BADGE' : 'BLUR',
        summaryReason: 'Blocked channel'
      };
    }

    // Collect unique categories
    const categories = Array.from(new Set(signals.map(s => s.category)));

    // Sum base scores
    let totalScore = signals.reduce((acc, s) => acc + s.score, 0);

    // Multi-signal synergy bonus
    if (categories.length >= 2) {
      totalScore += 15;
    }
    if (categories.length >= 3) {
      totalScore += 15;
    }

    // Cap between 0 and 100
    const finalScore = Math.min(100, Math.max(0, totalScore));

    // Confidence mapping
    let confidence: ConfidenceLevel = 'LOW';
    if (finalScore >= 80) confidence = 'HIGH';
    else if (finalScore >= 60) confidence = 'MEDIUM';

    // Evaluation against sensitivity threshold
    const isSlop = finalScore >= sensitivity;

    let action: FilterAction = 'IGNORE';
    if (isSlop) {
      switch (filterMode) {
        case 'hide':
          action = 'HIDE';
          break;
        case 'badge-only':
          action = 'BADGE';
          break;
        case 'blur-dim':
        default:
          action = 'BLUR';
          break;
      }
    }

    // Construct human-readable summary reason
    const summaryReason = signals.map(s => s.reason).slice(0, 2).join(' + ');

    return {
      isSlop,
      score: finalScore,
      categories,
      signals,
      confidence,
      action,
      summaryReason
    };
  }
}
