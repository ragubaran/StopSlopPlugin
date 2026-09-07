import { MAX_HISTORY_ITEMS, STORAGE_KEYS } from '../shared/constants';
import { FlaggedItem } from '../shared/types';

export class HistoryRepository {
  private static cache: FlaggedItem[] | null = null;

  static async get(): Promise<FlaggedItem[]> {
    if (this.cache !== null) return [...this.cache];

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const data = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
        if (data && Array.isArray(data[STORAGE_KEYS.HISTORY])) {
          this.cache = data[STORAGE_KEYS.HISTORY];
          return [...(this.cache ?? [])];
        }
      } catch (err) {
        console.warn('[StopSlop] Failed to load history from chrome.storage:', err);
      }
    }

    this.cache = [];
    return [...this.cache];
  }

  static async add(item: FlaggedItem): Promise<FlaggedItem[]> {
    let list = await this.get();
    // Deduplicate by videoId or id
    list = list.filter(i => (item.videoId ? i.videoId !== item.videoId : i.id !== item.id));
    list.unshift(item);

    if (list.length > MAX_HISTORY_ITEMS) {
      list = list.slice(0, MAX_HISTORY_ITEMS);
    }
    this.cache = list;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: list });
    }
    return [...list];
  }

  static async clear(): Promise<void> {
    this.cache = [];
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] });
    }
  }

  static clearCache(): void {
    this.cache = null;
  }
}
