import { DEFAULT_BLOCKED_CHANNELS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/constants';

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const existing = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.BLOCKLIST, STORAGE_KEYS.HISTORY]);
    if (!existing[STORAGE_KEYS.SETTINGS]) {
      await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
    }
    if (!existing[STORAGE_KEYS.BLOCKLIST]) {
      await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKLIST]: DEFAULT_BLOCKED_CHANNELS });
    }
    if (!existing[STORAGE_KEYS.HISTORY]) {
      await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] });
    }
  } catch (err) {
    console.warn('[StopSlop Background] Install storage setup failed:', err);
  }

  chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STATS_UPDATE') {
    const tabId = sender.tab?.id;
    if (tabId && message.flagged !== undefined) {
      const text = message.flagged > 0 ? String(message.flagged) : '';
      chrome.action.setBadgeText({ text, tabId });
    }
    sendResponse({ ok: true });
  }
  return true;
});
