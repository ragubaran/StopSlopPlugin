import { DynamicRulesPackage } from '../shared/types';
import { DynamicRulesRepository } from '../storage/rules';

export interface RuleUpdateResult {
  success: boolean;
  updated: boolean;
  version: string;
  ruleCount: number;
  message: string;
}

export interface AppUpdateResult {
  status: 'update_available' | 'no_update' | 'throttled' | 'unsupported';
  version?: string;
  message: string;
}

export class RuleUpdaterService {
  // Default URL for community-curated slop rule definitions
  static DEFAULT_RULES_URL = 'https://raw.githubusercontent.com/StopSlop/rules/main/rules.json';

  /**
   * Fetches and applies updated rule definitions from remote or custom URL
   */
  static async updateRules(url: string = this.DEFAULT_RULES_URL): Promise<RuleUpdateResult> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return await this.applyRulesPackage(json);
    } catch (err) {
      return {
        success: false,
        updated: false,
        version: 'unknown',
        ruleCount: 0,
        message: err instanceof Error ? err.message : 'Failed to fetch rule updates'
      };
    }
  }

  /**
   * Validates and saves a rules package payload
   */
  static async applyRulesPackage(pkg: unknown): Promise<RuleUpdateResult> {
    if (!pkg || typeof pkg !== 'object') {
      throw new Error('Invalid rules package format: expected JSON object');
    }

    const data = pkg as Partial<DynamicRulesPackage>;
    if (!data.version || !data.patterns) {
      throw new Error('Invalid rules package: missing version or patterns field');
    }

    const current = await DynamicRulesRepository.get();

    // Check if package is newer
    const isNewer = data.version !== current.version || (data.lastUpdated && data.lastUpdated > current.lastUpdated);

    const validPackage: DynamicRulesPackage = {
      version: String(data.version),
      lastUpdated: data.lastUpdated || Date.now(),
      author: data.author || 'Community',
      patterns: {
        aiSlop: Array.isArray(data.patterns.aiSlop) ? data.patterns.aiSlop : [],
        contentFarm: Array.isArray(data.patterns.contentFarm) ? data.patterns.contentFarm : [],
        brainrot: Array.isArray(data.patterns.brainrot) ? data.patterns.brainrot : [],
        ttsNarrator: Array.isArray(data.patterns.ttsNarrator) ? data.patterns.ttsNarrator : [],
        redditBot: Array.isArray(data.patterns.redditBot) ? data.patterns.redditBot : []
      },
      communityBlockedChannels: Array.isArray(data.communityBlockedChannels) ? data.communityBlockedChannels : []
    };

    await DynamicRulesRepository.save(validPackage);

    const totalRules =
      validPackage.patterns.aiSlop!.length +
      validPackage.patterns.contentFarm!.length +
      validPackage.patterns.brainrot!.length +
      validPackage.patterns.ttsNarrator!.length +
      validPackage.patterns.redditBot!.length +
      validPackage.communityBlockedChannels!.length;

    return {
      success: true,
      updated: Boolean(isNewer),
      version: validPackage.version,
      ruleCount: totalRules,
      message: `Rules updated to ${validPackage.version} (${totalRules} active rules)`
    };
  }

  /**
   * Queries Chromium runtime for browser extension binary updates
   */
  static async checkAppUpdate(): Promise<AppUpdateResult> {
    if (typeof chrome !== 'undefined' && chrome.runtime?.requestUpdateCheck) {
      return new Promise((resolve) => {
        chrome.runtime.requestUpdateCheck((status, details) => {
          if (status === 'update_available') {
            resolve({
              status: 'update_available',
              version: details?.version,
              message: `New version ${details?.version || ''} available! Reload extension to apply.`
            });
          } else if (status === 'no_update') {
            resolve({
              status: 'no_update',
              message: 'StopSlop is up to date (latest version).'
            });
          } else {
            resolve({
              status: 'throttled',
              message: 'Update check throttled by Chrome. Try again in a few minutes.'
            });
          }
        });
      });
    }

    return {
      status: 'unsupported',
      message: 'Extension update checks are handled by your browser (Developer/Unpacked mode).'
    };
  }
}
