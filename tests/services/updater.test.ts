import { beforeEach, describe, expect, it } from 'vitest';
import { RuleUpdaterService } from '../../src/services/updater';
import { BackupService } from '../../src/storage/backup';
import { BlocklistRepository } from '../../src/storage/blocklist';
import { DynamicRulesRepository } from '../../src/storage/rules';
import { SettingsRepository } from '../../src/storage/settings';

describe('Updateable Architecture & Services', () => {
  beforeEach(() => {
    SettingsRepository.clearCache();
    BlocklistRepository.clearCache();
    DynamicRulesRepository.clearCache();
  });

  describe('RuleUpdaterService', () => {
    it('applies and persists a valid rules package', async () => {
      const packagePayload = {
        version: '1.2.0-rules',
        lastUpdated: Date.now(),
        author: 'Community Test',
        patterns: {
          aiSlop: ['\\b(?:brand\\s+new\\s+ai\\s+scam)\\b'],
          contentFarm: ['\\b(?:unbelievable\\s+secret)\\b'],
          brainrot: [],
          ttsNarrator: [],
          redditBot: []
        },
        communityBlockedChannels: ['@BadBotFarm', '*FakeTrailers*']
      };

      const result = await RuleUpdaterService.applyRulesPackage(packagePayload);
      expect(result.success).toBe(true);
      expect(result.version).toBe('1.2.0-rules');
      expect(result.ruleCount).toBe(4);

      const loaded = await DynamicRulesRepository.get();
      expect(loaded.version).toBe('1.2.0-rules');
      expect(loaded.patterns.aiSlop).toContain('\\b(?:brand\\s+new\\s+ai\\s+scam)\\b');
      expect(loaded.communityBlockedChannels).toContain('@BadBotFarm');
    });

    it('rejects invalid rules packages', async () => {
      await expect(RuleUpdaterService.applyRulesPackage(null)).rejects.toThrow();
      await expect(RuleUpdaterService.applyRulesPackage({ version: '1.0' })).rejects.toThrow();
    });
  });

  describe('BackupService', () => {
    it('exports and imports backup data round-trip', async () => {
      await BlocklistRepository.add('@BlockedCreator99');
      await SettingsRepository.save({ filterMode: 'hide', sensitivity: 85 });

      const exported = await BackupService.exportData();
      expect(exported.blockedChannels).toContain('@BlockedCreator99');
      expect(exported.settings.filterMode).toBe('hide');
      expect(exported.settings.sensitivity).toBe(85);

      // Simulate import
      const serialized = JSON.stringify(exported);
      const importResult = await BackupService.importData(serialized);
      expect(importResult.success).toBe(true);

      const restoredSettings = await SettingsRepository.get();
      expect(restoredSettings.filterMode).toBe('hide');
      expect(restoredSettings.sensitivity).toBe(85);
    });
  });
});
