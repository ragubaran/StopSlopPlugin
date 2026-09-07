import { StopSlopBackupData } from '../shared/types';
import { BlocklistRepository } from './blocklist';
import { DynamicRulesRepository } from './rules';
import { SettingsRepository } from './settings';

export class BackupService {
  /**
   * Generates a complete backup data object
   */
  static async exportData(): Promise<StopSlopBackupData> {
    const settings = await SettingsRepository.get();
    const blockedChannels = await BlocklistRepository.get();
    const dynamicRules = await DynamicRulesRepository.get();

    return {
      version: '0.1.0',
      exportedAt: Date.now(),
      settings,
      blockedChannels,
      customKeywords: settings.customKeywords || [],
      dynamicRules
    };
  }

  /**
   * Triggers a browser file download of the backup JSON
   */
  static async downloadBackup(): Promise<void> {
    const data = await this.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `stopslop-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Imports and applies a backup JSON string
   */
  static async importData(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString) as Partial<StopSlopBackupData>;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid backup file format');
      }

      if (parsed.settings) {
        await SettingsRepository.save(parsed.settings);
      }

      if (Array.isArray(parsed.blockedChannels)) {
        for (const ch of parsed.blockedChannels) {
          await BlocklistRepository.add(ch);
        }
      }

      if (parsed.dynamicRules) {
        await DynamicRulesRepository.save(parsed.dynamicRules);
      }

      return {
        success: true,
        message: 'Settings, blocklists, and rules successfully imported!'
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to parse backup JSON'
      };
    }
  }
}
