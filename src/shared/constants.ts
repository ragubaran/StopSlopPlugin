import { StopSlopSettings } from './types';

export const STORAGE_KEYS = {
  SETTINGS: 'stopslop_settings',
  BLOCKLIST: 'stopslop_blocklist',
  HISTORY: 'stopslop_history'
} as const;

export const DEFAULT_SETTINGS: StopSlopSettings = {
  enabled: true,
  filterMode: 'blur-dim',
  sensitivity: 65, // Score threshold for considering video as slop
  categories: {
    aiSlop: true,
    contentFarm: true,
    brainrot: true,
    ttsNarrator: true,
    redditBot: true,
    clickbait: true,
    scam: true,
    shortsSlop: true
  },
  customKeywords: [],
  whitelistedVideos: []
};

export const MAX_HISTORY_ITEMS = 50;

export const DEFAULT_BLOCKED_CHANNELS: string[] = [];
