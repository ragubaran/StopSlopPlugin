import { DetectionResult, DetectionSignal, DynamicRulesPackage, SlopCategory, StopSlopSettings, VideoMetadata } from '../shared/types';
import { BlocklistRepository } from '../storage/blocklist';
import { detectAiSlop } from './patterns/ai-slop';
import { detectBrainrot } from './patterns/brainrot';
import { detectContentFarm } from './patterns/content-farm';
import { detectRedditBot } from './patterns/reddit-bot';
import { detectTtsSignals } from './patterns/tts';
import { ScoreAggregator } from './scorer';

function matchDynamicPatterns(
  title: string,
  patterns: string[] | undefined,
  category: SlopCategory,
  label: string
): DetectionSignal[] {
  if (!patterns || patterns.length === 0) return [];
  const signals: DetectionSignal[] = [];

  for (const pat of patterns) {
    const cleanPat = pat.trim();
    if (!cleanPat) continue;
    try {
      const re = new RegExp(cleanPat, 'i');
      const match = title.match(re);
      if (match) {
        signals.push({
          category,
          score: 30,
          reason: `Updated rule (${label}): "${match[0]}"`,
          matchedPattern: match[0]
        });
        break;
      }
    } catch {
      if (title.toLowerCase().includes(cleanPat.toLowerCase())) {
        signals.push({
          category,
          score: 30,
          reason: `Updated rule (${label}): "${cleanPat}"`,
          matchedPattern: cleanPat
        });
        break;
      }
    }
  }

  return signals;
}

export class SlopDetector {
  static detect(
    video: VideoMetadata,
    settings: StopSlopSettings,
    blockedChannels: string[],
    dynamicRules?: DynamicRulesPackage
  ): DetectionResult {
    // If master switch disabled
    if (!settings.enabled) {
      return {
        isSlop: false,
        score: 0,
        categories: [],
        signals: [],
        confidence: 'LOW',
        action: 'IGNORE',
        summaryReason: 'Protection disabled'
      };
    }

    // 1. Whitelist check (explicit user bypass)
    if (video.videoId && settings.whitelistedVideos?.includes(video.videoId)) {
      return {
        isSlop: false,
        score: 0,
        categories: [],
        signals: [],
        confidence: 'LOW',
        action: 'IGNORE',
        summaryReason: 'Whitelisted by user'
      };
    }

    const signals: DetectionSignal[] = [];
    const title = video.title || '';
    const channel = (video.channel || '').trim();

    // 2. Local User Channel Blocklist + Community Dynamic Blocklist Check (100% Score Priority)
    const combinedBlocklist = [
      ...blockedChannels,
      ...(dynamicRules?.communityBlockedChannels || [])
    ];

    if (channel && combinedBlocklist.length > 0) {
      const blockMatch = BlocklistRepository.matches(channel, combinedBlocklist);
      if (blockMatch.isBlocked) {
        signals.push({
          category: 'blocked-channel',
          score: 100,
          reason: `Blocked channel: "${blockMatch.matchedRule || channel}"`
        });
      }
    }

    // 3. User Custom Keywords Check
    if (title && settings.customKeywords?.length > 0) {
      for (const kw of settings.customKeywords) {
        const cleanKw = kw.trim();
        if (!cleanKw) continue;
        let matched = false;
        try {
          const re = new RegExp(`\\b${cleanKw}\\b`, 'i');
          matched = re.test(title);
        } catch {
          matched = title.toLowerCase().includes(cleanKw.toLowerCase());
        }

        if (matched) {
          signals.push({
            category: 'custom-keyword',
            score: 80,
            reason: `Custom blocklist keyword: "${cleanKw}"`
          });
          break;
        }
      }
    }

    // 4. Baseline Pattern Detectors (conditional on category toggles)
    if (title) {
      if (settings.categories.aiSlop) {
        signals.push(...detectAiSlop(title));
        if (dynamicRules?.patterns.aiSlop) {
          signals.push(...matchDynamicPatterns(title, dynamicRules.patterns.aiSlop, 'ai-slop', 'AI Slop'));
        }
      }
      if (settings.categories.contentFarm || settings.categories.clickbait) {
        signals.push(...detectContentFarm(title));
        if (dynamicRules?.patterns.contentFarm) {
          signals.push(...matchDynamicPatterns(title, dynamicRules.patterns.contentFarm, 'content-farm', 'Content Farm'));
        }
      }
      if (settings.categories.brainrot) {
        signals.push(...detectBrainrot(title));
        if (dynamicRules?.patterns.brainrot) {
          signals.push(...matchDynamicPatterns(title, dynamicRules.patterns.brainrot, 'brainrot', 'Brainrot'));
        }
      }
      if (settings.categories.ttsNarrator) {
        signals.push(...detectTtsSignals(title));
        if (dynamicRules?.patterns.ttsNarrator) {
          signals.push(...matchDynamicPatterns(title, dynamicRules.patterns.ttsNarrator, 'tts-narrator', 'TTS'));
        }
      }
      if (settings.categories.redditBot) {
        signals.push(...detectRedditBot(title));
        if (dynamicRules?.patterns.redditBot) {
          signals.push(...matchDynamicPatterns(title, dynamicRules.patterns.redditBot, 'reddit-bot', 'Reddit Bot'));
        }
      }
    }

    // 5. Shorts Format Modifier
    if (video.isShort && settings.categories.shortsSlop && signals.length > 0) {
      signals.push({
        category: 'ai-slop',
        score: 15,
        reason: 'Vertical Shorts slop format'
      });
    }

    return ScoreAggregator.aggregate(signals, settings.sensitivity, settings.filterMode);
  }
}
