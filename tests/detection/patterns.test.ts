import { describe, expect, it } from 'vitest';
import { detectAiSlop } from '../../src/detection/patterns/ai-slop';
import { detectBrainrot } from '../../src/detection/patterns/brainrot';
import { detectContentFarm } from '../../src/detection/patterns/content-farm';
import { detectRedditBot } from '../../src/detection/patterns/reddit-bot';
import { detectTtsSignals } from '../../src/detection/patterns/tts';

describe('Slop Pattern Detection', () => {
  describe('detectAiSlop', () => {
    it('detects AI generation prompts', () => {
      const title = 'I asked AI to recreate Harry Potter as an 80s anime';
      const signals = detectAiSlop(title);
      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].category).toBe('ai-slop');
    });

    it('detects AI tool buzzwords (Midjourney, ChatGPT, Sora)', () => {
      const title = 'Midjourney v6 vs Dall-E 3: Mindblowing results!';
      const signals = detectAiSlop(title);
      expect(signals.length).toBeGreaterThan(0);
    });

    it('detects fake AI concept trailers', () => {
      const title = 'Spider-Man 4 - Teaser Trailer (AI Concept) | Tom Holland';
      const signals = detectAiSlop(title);
      expect(signals.length).toBeGreaterThan(0);
    });

    it('passes normal titles', () => {
      const title = 'Building a distributed key-value store in Rust';
      const signals = detectAiSlop(title);
      expect(signals.length).toBe(0);
    });
  });

  describe('detectBrainrot', () => {
    it('detects brainrot memes', () => {
      const title = 'Skibidi Toilet Episode 77 Leaked Full Fight';
      const signals = detectBrainrot(title);
      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].category).toBe('brainrot');
    });

    it('detects sensory background hooks like Subway Surfers gameplay', () => {
      const title = 'Crazy Reddit Drama + Subway Surfers Gameplay Background';
      const signals = detectBrainrot(title);
      expect(signals.length).toBeGreaterThan(0);
    });
  });

  describe('detectContentFarm', () => {
    it('detects hyper-curiosity listicles', () => {
      const title = 'Top 10 facts that will save your life one day';
      const signals = detectContentFarm(title);
      expect(signals.length).toBeGreaterThan(0);
    });

    it('detects extreme ALL-CAPS clickbait', () => {
      const title = 'THEY FINALLY DID IT AND NOBODY CAN STOP THEM NOW!!!';
      const signals = detectContentFarm(title);
      expect(signals.some(s => s.category === 'clickbait')).toBe(true);
    });

    it('detects spam punctuation (???!!!)', () => {
      const title = 'Is this the end of YouTube???!!!';
      const signals = detectContentFarm(title);
      expect(signals.some(s => s.category === 'clickbait')).toBe(true);
    });
  });

  describe('detectTtsSignals', () => {
    it('detects AI voiceover / TTS markers', () => {
      const title = 'Scary stories read by AI voice that will keep you awake';
      const signals = detectTtsSignals(title);
      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].category).toBe('tts-narrator');
    });
  });

  describe('detectRedditBot', () => {
    it('detects automated AITA / AskReddit story channels', () => {
      const title = 'AITA for telling my mother-in-law she cannot live with us?';
      const signals = detectRedditBot(title);
      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0].category).toBe('reddit-bot');
    });

    it('detects subreddit scraping markers', () => {
      const title = 'r/AskReddit What is the most unhinged thing a coworker did?';
      const signals = detectRedditBot(title);
      expect(signals.length).toBeGreaterThan(0);
    });
  });
});
