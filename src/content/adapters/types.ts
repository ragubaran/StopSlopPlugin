import { VideoMetadata } from '../../shared/types';

export interface ContentAdapter {
  readonly name: string;
  matches(element: Element): boolean;
  extract(element: Element): VideoMetadata | null;
  getThumbnailContainer(element: Element): HTMLElement | null;
}
