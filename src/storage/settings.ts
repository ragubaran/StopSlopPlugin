import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/constants';
import { StopSlopSettings } from '../shared/types';

export class SettingsRepository {
  private static cache: StopSlopSettings | null = null;

  static async get(): Promise<StopSlopSettings> {
    if (this.cache) return { ...this.cache };

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const data = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        const stored = data?.[STORAGE_KEYS.SETTINGS] as Partial<StopSlopSettings> | undefined;
        if (stored) {
          this.cache = {
            ...DEFAULT_SETTINGS,
            ...stored,
            categories: {
              ...DEFAULT_SETTINGS.categories,
              ...(stored.categories || {})
            }
          };
          return { ...this.cache };
        }
      } catch (err) {
        console.warn('[StopSlop] Failed to load settings from chrome.storage:', err);
      }
    }

    this.cache = { ...DEFAULT_SETTINGS };
    return { ...this.cache };
  }

  static async save(settings: Partial<StopSlopSettings>): Promise<StopSlopSettings> {
    const current = await this.get();
    const updated: StopSlopSettings = {
      ...current,
      ...settings,
      categories: {
        ...current.categories,
        ...(settings.categories || {})
      }
    };
    this.cache = updated;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
    }

    return { ...updated };
  }

  static clearCache(): void {
    this.cache = null;
  }
}
