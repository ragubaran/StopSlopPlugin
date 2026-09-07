import { DynamicRulesPackage } from '../shared/types';

export const DYNAMIC_RULES_STORAGE_KEY = 'stopslop_dynamic_rules';

export const DEFAULT_DYNAMIC_RULES: DynamicRulesPackage = {
  version: '0.1.0-rules',
  lastUpdated: Date.now(),
  author: 'StopSlop Community Seed',
  patterns: {
    aiSlop: [
      '\\b(?:ai\\s+generated|ai\\s+trailer|midjourney|chatgpt|elevenlabs)\\b',
      '\\b(?:i\\s+asked\\s+ai|what\\s+happens\\s+when\\s+ai)\\b'
    ],
    contentFarm: [
      '\\b(?:facts\\s+that\\s+will\\s+save\\s+your\\s+life|dark\\s+psychology)\\b',
      '\\b(?:this\\s+changes\\s+everything|why\\s+everyone\\s+is\\s+leaving)\\b'
    ],
    brainrot: [
      '\\b(?:skibidi|grimace\\s+shake|ohio\\s+rizz|subway\\s+surfers\\s+gameplay)\\b'
    ],
    ttsNarrator: [
      '\\b(?:text\\s+to\\s+speech|ai\\s+voice|cloned\\s+voice)\\b'
    ],
    redditBot: [
      '\\b(?:r\\/(?:askreddit|aita|tifu)|aita\\s+for|reddit\\s+stories)\\b'
    ]
  },
  communityBlockedChannels: []
};

export class DynamicRulesRepository {
  private static cache: DynamicRulesPackage | null = null;

  static async get(): Promise<DynamicRulesPackage> {
    if (this.cache !== null) return { ...this.cache };

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const data = await chrome.storage.local.get(DYNAMIC_RULES_STORAGE_KEY);
        if (data && data[DYNAMIC_RULES_STORAGE_KEY]) {
          this.cache = data[DYNAMIC_RULES_STORAGE_KEY];
          return { ...this.cache! };
        }
      } catch (err) {
        console.warn('[StopSlop] Failed to load dynamic rules:', err);
      }
    }

    this.cache = { ...DEFAULT_DYNAMIC_RULES };
    return { ...this.cache };
  }

  static async save(rules: DynamicRulesPackage): Promise<DynamicRulesPackage> {
    this.cache = rules;
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [DYNAMIC_RULES_STORAGE_KEY]: rules });
    }
    return { ...rules };
  }

  static clearCache(): void {
    this.cache = null;
  }
}
