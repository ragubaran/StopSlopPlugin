import { beforeEach, describe, expect, it } from 'vitest';
import { BlocklistRepository } from '../../src/storage/blocklist';
import { HistoryRepository } from '../../src/storage/history';
import { SettingsRepository } from '../../src/storage/settings';

describe('Storage Repositories', () => {
  beforeEach(() => {
    SettingsRepository.clearCache();
    BlocklistRepository.clearCache();
    HistoryRepository.clearCache();
  });

  describe('SettingsRepository', () => {
    it('returns default settings when storage is empty', async () => {
      const settings = await SettingsRepository.get();
      expect(settings.enabled).toBe(true);
      expect(settings.filterMode).toBe('blur-dim');
      expect(settings.sensitivity).toBe(65);
      expect(settings.categories.aiSlop).toBe(true);
    });

    it('updates settings and persists in cache', async () => {
      await SettingsRepository.save({
        filterMode: 'hide',
        sensitivity: 80
      });
      const updated = await SettingsRepository.get();
      expect(updated.filterMode).toBe('hide');
      expect(updated.sensitivity).toBe(80);
      expect(updated.enabled).toBe(true); // preserved
    });
  });

  describe('BlocklistRepository', () => {
    it('adds and removes channels case-insensitively', async () => {
      await BlocklistRepository.add('SlopHub');
      let list = await BlocklistRepository.get();
      expect(list).toContain('SlopHub');

      // Duplicate add should be ignored (even with @ or case differences)
      await BlocklistRepository.add('@slophub');
      list = await BlocklistRepository.get();
      expect(list.length).toBe(1);

      // Remove
      await BlocklistRepository.remove('SLOPHUB');
      list = await BlocklistRepository.get();
      expect(list).not.toContain('SlopHub');
    });

    it('normalizes handles and URLs properly', () => {
      expect(BlocklistRepository.normalize('@CoolCreator')).toBe('coolcreator');
      expect(BlocklistRepository.normalize('https://www.youtube.com/@SlopChannel/videos')).toBe('slopchannel');
      expect(BlocklistRepository.normalize('https://youtube.com/c/SomeBotChannel')).toBe('somebotchannel');
    });

    it('matches exact channels, handles, wildcards, and regexes', () => {
      const blocklist = ['@BadChannel', '*SlopFactory*', '/^AI\\sBot/i'];

      // Handle match
      expect(BlocklistRepository.matches('BadChannel', blocklist).isBlocked).toBe(true);
      expect(BlocklistRepository.matches('@badchannel', blocklist).isBlocked).toBe(true);

      // Wildcard match
      expect(BlocklistRepository.matches('The Ultimate SlopFactory Clips', blocklist).isBlocked).toBe(true);

      // Regex match
      expect(BlocklistRepository.matches('AI Bot Daily', blocklist).isBlocked).toBe(true);

      // Clean channel
      expect(BlocklistRepository.matches('GoodTechExplained', blocklist).isBlocked).toBe(false);
    });
  });

  describe('HistoryRepository', () => {
    it('adds flagged items and bounds history length', async () => {
      await HistoryRepository.clear();
      for (let i = 0; i < 60; i++) {
        await HistoryRepository.add({
          id: `item_${i}`,
          title: `Slop Video ${i}`,
          channel: `SpamChannel`,
          score: 80,
          categories: ['ai-slop'],
          summaryReason: 'AI marker',
          timestamp: Date.now() + i
        });
      }
      const history = await HistoryRepository.get();
      expect(history.length).toBe(50); // MAX_HISTORY_ITEMS
      expect(history[0].id).toBe('item_59'); // most recent first
    });
  });
});
