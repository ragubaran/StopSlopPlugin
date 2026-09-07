import { describe, expect, it } from 'vitest';
import { SlopDetector } from '../../src/detection/detector';
import { ScoreAggregator } from '../../src/detection/scorer';
import { DEFAULT_SETTINGS } from '../../src/shared/constants';
import { DetectionSignal, VideoMetadata } from '../../src/shared/types';

describe('Detector & Scorer Engine', () => {
  describe('ScoreAggregator', () => {
    it('returns IGNORE for clean signals', () => {
      const result = ScoreAggregator.aggregate([], 65, 'blur-dim');
      expect(result.isSlop).toBe(false);
      expect(result.action).toBe('IGNORE');
      expect(result.score).toBe(0);
    });

    it('awards combo bonus for multi-category signals', () => {
      const signals: DetectionSignal[] = [
        { category: 'ai-slop', score: 30, reason: 'AI marker' },
        { category: 'content-farm', score: 25, reason: 'Listicle' }
      ];
      const result = ScoreAggregator.aggregate(signals, 65, 'blur-dim');
      // 30 + 25 + 15 (combo bonus) = 70 >= 65
      expect(result.score).toBe(70);
      expect(result.isSlop).toBe(true);
      expect(result.action).toBe('BLUR');
      expect(result.confidence).toBe('MEDIUM');
    });

    it('maps actions correctly according to filterMode', () => {
      const signals: DetectionSignal[] = [
        { category: 'brainrot', score: 85, reason: 'Skibidi' }
      ];
      const blurRes = ScoreAggregator.aggregate(signals, 65, 'blur-dim');
      expect(blurRes.action).toBe('BLUR');

      const badgeRes = ScoreAggregator.aggregate(signals, 65, 'badge-only');
      expect(badgeRes.action).toBe('BADGE');

      const hideRes = ScoreAggregator.aggregate(signals, 65, 'hide');
      expect(hideRes.action).toBe('HIDE');
    });
  });

  describe('SlopDetector.detect', () => {
    it('immediately flags blocked channels with 100 score', () => {
      const video: VideoMetadata = {
        title: 'Normal Cooking Recipe',
        channel: 'SlopFarmTV',
        isShort: false
      };
      const result = SlopDetector.detect(video, DEFAULT_SETTINGS, ['@SlopFarmTV']);
      expect(result.isSlop).toBe(true);
      expect(result.score).toBe(100);
      expect(result.categories).toContain('blocked-channel');
    });

    it('flags blocked channels using wildcard patterns', () => {
      const video: VideoMetadata = {
        title: 'Learn Math in 5 mins',
        channel: 'Top ContentFarm Central',
        isShort: false
      };
      const result = SlopDetector.detect(video, DEFAULT_SETTINGS, ['*ContentFarm*']);
      expect(result.isSlop).toBe(true);
      expect(result.score).toBe(100);
      expect(result.categories).toContain('blocked-channel');
    });

    it('flags videos matching custom keywords', () => {
      const video: VideoMetadata = {
        title: 'Check out this totally fake leak',
        channel: 'SomeGuy',
        isShort: false
      };
      const settings = {
        ...DEFAULT_SETTINGS,
        customKeywords: ['fake leak']
      };
      const result = SlopDetector.detect(video, settings, []);
      expect(result.isSlop).toBe(true);
      expect(result.categories).toContain('custom-keyword');
    });

    it('ignores whitelisted videos even if they contain slop keywords', () => {
      const video: VideoMetadata = {
        videoId: 'clean_123',
        title: 'I asked AI to recreate Harry Potter (Documentary on LLMs)',
        channel: 'TechChannel',
        isShort: false
      };
      const settings = {
        ...DEFAULT_SETTINGS,
        whitelistedVideos: ['clean_123']
      };
      const result = SlopDetector.detect(video, settings, []);
      expect(result.isSlop).toBe(false);
      expect(result.action).toBe('IGNORE');
    });

    it('respects sensitivity threshold changes', () => {
      const video: VideoMetadata = {
        title: 'AITA for leaving the dinner early?',
        channel: 'StoryChannel',
        isShort: false
      };
      // High threshold (95) -> should ignore
      const highSensResult = SlopDetector.detect(video, { ...DEFAULT_SETTINGS, sensitivity: 95 }, []);
      expect(highSensResult.isSlop).toBe(false);

      // Normal threshold (30) -> should flag
      const lowSensResult = SlopDetector.detect(video, { ...DEFAULT_SETTINGS, sensitivity: 30 }, []);
      expect(lowSensResult.isSlop).toBe(true);
    });
  });
});
