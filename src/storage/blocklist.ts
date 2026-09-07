import { DEFAULT_BLOCKED_CHANNELS, STORAGE_KEYS } from '../shared/constants';

export class BlocklistRepository {
  private static cache: string[] | null = null;

  /**
   * Normalizes a channel name, handle, or URL for consistent comparison
   */
  static normalize(raw: string): string {
    if (!raw) return '';
    let clean = raw.trim();

    // Strip full YouTube URL if user pasted a channel link
    clean = clean.replace(/^https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/|user\/)?/i, '');
    // Strip leading @ for uniform comparison
    clean = clean.replace(/^@/, '');
    // Remove query params or trailing slashes
    clean = clean.split(/[?#/]/)[0].trim().toLowerCase();

    return clean;
  }

  /**
   * Evaluates if a given channel matches any rule in the blocklist
   * Supports: exact match, normalized handles, wildcard patterns (*slop*), and regex (/pattern/i)
   */
  static matches(channel: string, blocklist: string[]): { isBlocked: boolean; matchedRule?: string } {
    if (!channel || !blocklist || blocklist.length === 0) {
      return { isBlocked: false };
    }

    const normChannel = this.normalize(channel);
    const rawLower = channel.trim().toLowerCase();

    for (const rule of blocklist) {
      const cleanRule = rule.trim();
      if (!cleanRule) continue;

      // 1. Regex rule format: /pattern/flags
      if (cleanRule.startsWith('/') && cleanRule.lastIndexOf('/') > 0) {
        try {
          const lastSlash = cleanRule.lastIndexOf('/');
          const pattern = cleanRule.substring(1, lastSlash);
          const flags = cleanRule.substring(lastSlash + 1) || 'i';
          const regex = new RegExp(pattern, flags);
          if (regex.test(channel) || regex.test(normChannel)) {
            return { isBlocked: true, matchedRule: cleanRule };
          }
        } catch {
          // ignore
        }
        continue;
      }

      // 2. Wildcard rule format: e.g. *slop* or AI*
      if (cleanRule.includes('*')) {
        try {
          const escaped = cleanRule
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*');
          const regex = new RegExp(`^${escaped}$`, 'i');
          if (regex.test(channel) || regex.test(normChannel) || regex.test(rawLower)) {
            return { isBlocked: true, matchedRule: cleanRule };
          }
        } catch {
          // ignore
        }
        continue;
      }

      // 3. Exact and normalized handle/channel matching
      const normRule = this.normalize(cleanRule);
      if (
        rawLower === cleanRule.toLowerCase() ||
        normChannel === normRule
      ) {
        return { isBlocked: true, matchedRule: cleanRule };
      }
    }

    return { isBlocked: false };
  }

  static async get(): Promise<string[]> {
    if (this.cache !== null) return [...this.cache];

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const data = await chrome.storage.local.get(STORAGE_KEYS.BLOCKLIST);
        if (data && Array.isArray(data[STORAGE_KEYS.BLOCKLIST])) {
          this.cache = data[STORAGE_KEYS.BLOCKLIST];
          return [...(this.cache ?? [])];
        }
      } catch (err) {
        console.warn('[StopSlop] Failed to load blocklist from chrome.storage:', err);
      }
    }

    this.cache = [...DEFAULT_BLOCKED_CHANNELS];
    return [...this.cache];
  }

  static async add(channelName: string): Promise<string[]> {
    const clean = channelName.trim();
    if (!clean) return this.get();

    const list = await this.get();
    const cleanNorm = this.normalize(clean);
    const exists = list.some(item => this.normalize(item) === cleanNorm);

    if (!exists) {
      list.push(clean);
      this.cache = list;
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKLIST]: list });
      }
    }
    return [...list];
  }

  static async remove(channelName: string): Promise<string[]> {
    const cleanNorm = this.normalize(channelName);
    const list = await this.get();
    const updated = list.filter(item => this.normalize(item) !== cleanNorm && item.trim().toLowerCase() !== channelName.trim().toLowerCase());
    this.cache = updated;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKLIST]: updated });
    }
    return [...updated];
  }

  static clearCache(): void {
    this.cache = null;
  }
}
