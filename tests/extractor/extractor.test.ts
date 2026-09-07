import { describe, expect, it } from 'vitest';
import { HomeAdapter } from '../../src/content/adapters/home-adapter';
import { SearchAdapter } from '../../src/content/adapters/search-adapter';
import { ShortsAdapter } from '../../src/content/adapters/shorts-adapter';
import { SidebarAdapter } from '../../src/content/adapters/sidebar-adapter';
import { MetadataExtractor } from '../../src/content/extractor';

describe('Content Adapters & Metadata Extractor', () => {
  const homeAdapter = new HomeAdapter();
  const searchAdapter = new SearchAdapter();
  const sidebarAdapter = new SidebarAdapter();
  const shortsAdapter = new ShortsAdapter();
  const extractor = new MetadataExtractor();

  it('matches appropriate YouTube tag names', () => {
    const homeEl = { tagName: 'YTD-RICH-ITEM-RENDERER' } as Element;
    expect(homeAdapter.matches(homeEl)).toBe(true);

    const searchEl = { tagName: 'YTD-VIDEO-RENDERER' } as Element;
    expect(searchAdapter.matches(searchEl)).toBe(true);

    const sidebarEl = { tagName: 'YTD-COMPACT-VIDEO-RENDERER' } as Element;
    expect(sidebarAdapter.matches(sidebarEl)).toBe(true);

    const shortsEl = { tagName: 'YTD-REEL-ITEM-RENDERER' } as Element;
    expect(shortsAdapter.matches(shortsEl)).toBe(true);
  });

  it('extracts metadata from home card simulation', () => {
    const mockElement = {
      tagName: 'YTD-RICH-ITEM-RENDERER',
      querySelector: (selector: string) => {
        if (selector.includes('video-title')) {
          return {
            textContent: 'I asked AI to build a space station in 100 days',
            getAttribute: (_attr: string) => '/watch?v=mock_video_99'
          };
        }
        if (selector.includes('channel-name')) {
          return {
            textContent: 'AI Daily Digest',
            getAttribute: () => null
          };
        }
        if (selector.includes('thumbnail')) {
          return {
            getAttribute: (_attr: string) => '/watch?v=mock_video_99'
          };
        }
        return null;
      }
    } as unknown as Element;

    const extracted = extractor.extract(mockElement);
    expect(extracted).not.toBeNull();
    expect(extracted?.adapter.name).toBe('HomeAdapter');
    expect(extracted?.metadata.title).toBe('I asked AI to build a space station in 100 days');
    expect(extracted?.metadata.channel).toBe('AI Daily Digest');
    expect(extracted?.metadata.videoId).toBe('mock_video_99');
    expect(extracted?.metadata.isShort).toBe(false);
  });

  it('extracts shorts metadata correctly', () => {
    const mockShorts = {
      tagName: 'YTD-REEL-ITEM-RENDERER',
      querySelector: (selector: string) => {
        if (selector.includes('video-title')) {
          return {
            textContent: 'Skibidi toilet vs Ohio rizz #shorts',
            getAttribute: () => null
          };
        }
        if (selector.includes('channel-name')) {
          return {
            textContent: 'ShortsMemes',
            getAttribute: () => null
          };
        }
        if (selector.includes('shorts')) {
          return {
            getAttribute: (_attr: string) => '/shorts/xyz_short_123'
          };
        }
        return null;
      }
    } as unknown as Element;

    const extracted = extractor.extract(mockShorts);
    expect(extracted).not.toBeNull();
    expect(extracted?.adapter.name).toBe('ShortsAdapter');
    expect(extracted?.metadata.isShort).toBe(true);
    expect(extracted?.metadata.videoId).toBe('xyz_short_123');
  });
});
