import { VideoMetadata } from '../../shared/types';
import { ContentAdapter } from './types';

export class ShortsAdapter implements ContentAdapter {
  readonly name = 'ShortsAdapter';

  matches(element: Element): boolean {
    const tag = element.tagName.toLowerCase();
    return tag === 'ytd-reel-item-renderer' || tag === 'ytd-rich-grid-slim-media';
  }

  extract(element: Element): VideoMetadata | null {
    const titleEl = element.querySelector('#video-title, #video-title-link, .ytd-reel-item-renderer #video-title');
    const title = (titleEl?.textContent || titleEl?.getAttribute('title') || '').trim();
    if (!title) return null;

    const channelEl = element.querySelector('#channel-name, .ytd-channel-name');
    const channel = (channelEl?.textContent || '').trim();

    const linkEl = element.querySelector('a[href*="/shorts/"]');
    const href = linkEl?.getAttribute('href') || '';
    let videoId: string | undefined;

    const match = href.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (match) videoId = match[1];

    return {
      title,
      channel,
      videoId,
      href,
      isShort: true
    };
  }

  getThumbnailContainer(element: Element): HTMLElement | null {
    return (element.querySelector('#thumbnail, ytd-thumbnail') as HTMLElement) || (element as HTMLElement);
  }
}
