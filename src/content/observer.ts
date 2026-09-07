import { SlopDetector } from '../detection/detector';
import { DetectionResult, DynamicRulesPackage, StopSlopSettings, VideoMetadata } from '../shared/types';
import { BlocklistRepository } from '../storage/blocklist';
import { HistoryRepository } from '../storage/history';
import { DynamicRulesRepository } from '../storage/rules';
import { SettingsRepository } from '../storage/settings';
import { MetadataExtractor } from './extractor';
import { FilterRenderer } from './renderer';

export class YouTubeObserver {
  private extractor = new MetadataExtractor();
  private processedElements = new WeakSet<Element>();
  private videoResultCache = new Map<string, DetectionResult>();
  private settings: StopSlopSettings | null = null;
  private blockedChannels: string[] = [];
  private dynamicRules: DynamicRulesPackage | undefined = undefined;
  private observer: MutationObserver | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private scannedCount = 0;
  private flaggedCount = 0;

  async init(): Promise<void> {
    await this.reloadConfig();
    this.setupListeners();
    this.startObserver();
    this.scheduleScan();
  }

  async reloadConfig(): Promise<void> {
    this.settings = await SettingsRepository.get();
    this.blockedChannels = await BlocklistRepository.get();
    this.dynamicRules = await DynamicRulesRepository.get();
  }

  private setupListeners(): void {
    // Listen for YouTube SPA navigation
    window.addEventListener('yt-navigate-finish', () => {
      this.scheduleScan();
    });

    // Listen for extension messages
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg.type === 'CONFIG_UPDATED') {
          this.reloadConfig().then(() => {
            this.rescanAll();
            sendResponse({ success: true });
          });
          return true;
        } else if (msg.type === 'GET_PAGE_STATS') {
          sendResponse({ scanned: this.scannedCount, flagged: this.flaggedCount });
          return true;
        }
        return false;
      });
    }
  }

  private startObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      let hasNewNodes = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          hasNewNodes = true;
          break;
        }
      }
      if (hasNewNodes) {
        this.scheduleScan();
      }
    });

    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  scheduleScan(): void {
    if (this.scanTimer) clearTimeout(this.scanTimer);
    this.scanTimer = setTimeout(() => {
      this.scanPage();
    }, 100);
  }

  scanPage(): void {
    if (!this.settings || !this.settings.enabled) {
      this.removeAllFilters();
      return;
    }

    const candidateSelectors = [
      'ytd-rich-item-renderer',
      'ytd-video-renderer',
      'ytd-compact-video-renderer',
      'ytd-grid-video-renderer',
      'ytd-reel-item-renderer',
      'ytd-rich-grid-slim-media'
    ].join(',');

    const elements = document.querySelectorAll(candidateSelectors);
    let newFlagged = 0;

    elements.forEach((element) => {
      if (this.processedElements.has(element)) return;

      const extracted = this.extractor.extract(element);
      if (!extracted) return;

      const { metadata, adapter } = extracted;
      this.processedElements.add(element);
      this.scannedCount++;

      // Check cache first
      let result: DetectionResult;
      const cacheKey = metadata.videoId || `${metadata.channel}:${metadata.title}`;
      if (this.videoResultCache.has(cacheKey)) {
        result = this.videoResultCache.get(cacheKey)!;
      } else {
        result = SlopDetector.detect(metadata, this.settings!, this.blockedChannels, this.dynamicRules);
        this.videoResultCache.set(cacheKey, result);
      }

      if (result.isSlop) {
        this.flaggedCount++;
        newFlagged++;

        FilterRenderer.apply(
          element,
          adapter,
          metadata,
          result,
          () => this.handleUnflag(metadata, element),
          () => this.handleBlockChannel(metadata.channel)
        );

        // Record in history
        HistoryRepository.add({
          id: cacheKey,
          videoId: metadata.videoId,
          title: metadata.title,
          channel: metadata.channel,
          score: result.score,
          categories: result.categories,
          summaryReason: result.summaryReason,
          timestamp: Date.now()
        });
      }
    });

    if (newFlagged > 0) {
      this.syncStats();
    }
  }

  rescanAll(): void {
    this.videoResultCache.clear();
    const flaggedElements = document.querySelectorAll('.stop-slop-card');
    flaggedElements.forEach((el) => {
      this.processedElements.delete(el);
      FilterRenderer.remove(el);
    });
    this.scanPage();
  }

  private removeAllFilters(): void {
    document.querySelectorAll('.stop-slop-card').forEach((el) => {
      FilterRenderer.remove(el);
    });
  }

  private async handleUnflag(metadata: VideoMetadata, element: Element): Promise<void> {
    if (metadata.videoId && this.settings) {
      if (!this.settings.whitelistedVideos.includes(metadata.videoId)) {
        this.settings.whitelistedVideos.push(metadata.videoId);
        await SettingsRepository.save(this.settings);
      }
    }
    const cacheKey = metadata.videoId || `${metadata.channel}:${metadata.title}`;
    this.videoResultCache.delete(cacheKey);
    FilterRenderer.remove(element);
    FilterRenderer.showToast('Video unflagged & whitelisted.');
  }

  private async handleBlockChannel(channelName: string): Promise<void> {
    if (!channelName) return;
    this.blockedChannels = await BlocklistRepository.add(channelName);
    FilterRenderer.showToast(`Channel "${channelName}" added to blocklist.`);
    this.rescanAll();
  }

  private syncStats(): void {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage({
          type: 'STATS_UPDATE',
          scanned: this.scannedCount,
          flagged: this.flaggedCount
        });
      } catch {
        // service worker may be idle
      }
    }
  }
}
