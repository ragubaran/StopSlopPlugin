import { HomeAdapter } from './adapters/home-adapter';
import { SearchAdapter } from './adapters/search-adapter';
import { ShortsAdapter } from './adapters/shorts-adapter';
import { SidebarAdapter } from './adapters/sidebar-adapter';
import { ContentAdapter } from './adapters/types';
import { VideoMetadata } from '../shared/types';

export class MetadataExtractor {
  private adapters: ContentAdapter[];

  constructor() {
    this.adapters = [
      new HomeAdapter(),
      new SearchAdapter(),
      new SidebarAdapter(),
      new ShortsAdapter()
    ];
  }

  getAdapter(element: Element): ContentAdapter | null {
    for (const adapter of this.adapters) {
      if (adapter.matches(element)) {
        return adapter;
      }
    }
    return null;
  }

  extract(element: Element): { metadata: VideoMetadata; adapter: ContentAdapter } | null {
    const adapter = this.getAdapter(element);
    if (!adapter) return null;

    const metadata = adapter.extract(element);
    if (!metadata || !metadata.title) return null;

    return { metadata, adapter };
  }
}
