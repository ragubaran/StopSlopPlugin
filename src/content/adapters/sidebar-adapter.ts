import { VideoMetadata } from '../../shared/types';
import { ContentAdapter } from './types';

export class SidebarAdapter implements ContentAdapter {
  readonly name = 'SidebarAdapter';

  matches(element: Element): boolean {
    return element.tagName.toLowerCase() === 'ytd-compact-video-renderer';
  }

  extract(element: Element): VideoMetadata | null {
    const titleEl = element.querySelector('#video-title, span#video-title');
    const title = (titleEl?.textContent || titleEl?.getAttribute('title') || '').trim();
    if (!title) return null;

    const channelEl = element.querySelector('.ytd-channel-name #text, #byline');
    const channel = (channelEl?.textContent || '').trim();

    const linkEl = element.querySelector('a#thumbnail');
    const href = linkEl?.getAttribute('href') || '';
    let videoId: string | undefined;

    if (href.includes('v=')) {
      const match = href.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    }

    return {
      title,
      channel,
      videoId,
      href,
      isShort: false
    };
  }

  getThumbnailContainer(element: Element): HTMLElement | null {
    return (element.querySelector('#thumbnail, ytd-thumbnail') as HTMLElement) || (element as HTMLElement);
  }
}
