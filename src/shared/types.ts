/**
 * Shared Type Definitions for StopSlop
 */

export type SlopCategory =
  | 'ai-slop'
  | 'content-farm'
  | 'brainrot'
  | 'tts-narrator'
  | 'reddit-bot'
  | 'clickbait'
  | 'scam'
  | 'blocked-channel'
  | 'custom-keyword';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type FilterAction = 'IGNORE' | 'BADGE' | 'BLUR' | 'HIDE';

export type FilterMode = 'blur-dim' | 'badge-only' | 'hide';

export interface DetectionSignal {
  category: SlopCategory;
  score: number;
  reason: string;
  matchedPattern?: string;
}

export interface DetectionResult {
  isSlop: boolean;
  score: number; // 0 to 100
  categories: SlopCategory[];
  signals: DetectionSignal[];
  confidence: ConfidenceLevel;
  action: FilterAction;
  summaryReason: string;
}

export interface VideoMetadata {
  title: string;
  channel: string;
  channelId?: string;
  videoId?: string;
  href?: string;
  isShort: boolean;
  publishedText?: string;
  viewCountText?: string;
}

export interface CategorySettings {
  aiSlop: boolean;
  contentFarm: boolean;
  brainrot: boolean;
  ttsNarrator: boolean;
  redditBot: boolean;
  clickbait: boolean;
  scam: boolean;
  shortsSlop: boolean;
}

export interface StopSlopSettings {
  enabled: boolean;
  filterMode: FilterMode;
  sensitivity: number; // 30 - 100 threshold
  categories: CategorySettings;
  customKeywords: string[];
  whitelistedVideos: string[];
}

export interface FlaggedItem {
  id: string; // unique videoId or generated hash
  videoId?: string;
  title: string;
  channel: string;
  score: number;
  categories: SlopCategory[];
  summaryReason: string;
  timestamp: number;
  isWhitelisted?: boolean;
}

export interface DynamicRulesPackage {
  version: string;
  lastUpdated: number;
  author?: string;
  patterns: {
    aiSlop?: string[];
    contentFarm?: string[];
    brainrot?: string[];
    ttsNarrator?: string[];
    redditBot?: string[];
  };
  communityBlockedChannels?: string[];
}

export interface StopSlopBackupData {
  version: string;
  exportedAt: number;
  settings: StopSlopSettings;
  blockedChannels: string[];
  customKeywords: string[];
  dynamicRules?: DynamicRulesPackage;
}

export interface PageStats {
  scanned: number;
  flagged: number;
}
