import { VideoMetadata } from '../../shared/types';
import { ContentAdapter } from './types';

export class HomeAdapter implements ContentAdapter {
  readonly name = 'HomeAdapter';

  matches(element: Element): boolean {
    return element.tagName.toLowerCase() === 'ytd-rich-item-renderer' ||
           element.tagName.toLowerCase() === 'ytd-grid-video-renderer';
  }

  extract(element: Element): VideoMetadata | null {
    const titleEl = element.querySelector('#video-title, #video-title-link, a#video-title');
    const title = (titleEl?.textContent || titleEl?.getAttribute('title') || '').trim();
    if (!title) return null;

    const channelEl = element.querySelector('ytd-channel-name #text, #channel-name #text, .ytd-channel-name a');
    const channel = (channelEl?.textContent || '').trim();

    const linkEl = element.querySelector('a#thumbnail, a#video-title-link');
    const href = linkEl?.getAttribute('href') || '';
    let videoId: string | undefined;

    if (href.includes('v=')) {
      const match = href.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    } else if (href.includes('/shorts/')) {
      const match = href.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    }

    return {
      title,
      channel,
      videoId,
      href,
      isShort: href.includes('/shorts/')
    };
  }

  getThumbnailContainer(element: Element): HTMLElement | null {
    return (element.querySelector('#thumbnail, ytd-thumbnail, .yt-core-image') as HTMLElement) || (element as HTMLElement);
  }
}
