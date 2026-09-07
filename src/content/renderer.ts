import { DetectionResult, VideoMetadata } from '../shared/types';
import { ContentAdapter } from './adapters/types';

export class FilterRenderer {
  static apply(
    element: Element,
    adapter: ContentAdapter,
    _metadata: VideoMetadata,
    result: DetectionResult,
    onUnflag: () => void,
    onBlockChannel: () => void
  ): void {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.add('stop-slop-card', 'stop-slop-flagged');

    // Remove old action classes
    htmlElement.classList.remove('stop-slop-action-blur', 'stop-slop-action-badge', 'stop-slop-action-hide');
    htmlElement.classList.add(`stop-slop-action-${result.action.toLowerCase()}`);

    htmlElement.dataset.stopSlopScore = String(result.score);
    htmlElement.dataset.stopSlopReason = result.summaryReason;

    const thumbContainer = adapter.getThumbnailContainer(element);
    if (!thumbContainer) return;
    thumbContainer.style.position = 'relative';

    // 1. Inject or update Badge
    let badge = thumbContainer.querySelector('.stop-slop-badge-container') as HTMLElement;
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'stop-slop-badge-container';
      thumbContainer.appendChild(badge);
    }

    const primaryCategory = result.categories[0] || 'ai-slop';
    const readableCat = primaryCategory.replace('-', ' ').toUpperCase();

    badge.innerHTML = `
      <div class="stop-slop-badge" title="Flagged with ${result.score}% slop confidence (${result.confidence} confidence)">
        <span class="stop-slop-badge-icon">🚩</span>
        <span class="stop-slop-badge-cat">${readableCat}</span>
        <span class="stop-slop-badge-reason">${this.escape(result.summaryReason)}</span>
      </div>
    `;

    // 2. Inject Reveal Overlay if BLUR mode
    if (result.action === 'BLUR') {
      let overlay = thumbContainer.querySelector('.stop-slop-overlay') as HTMLElement;
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'stop-slop-overlay';
        overlay.innerHTML = `
          <button type="button" class="stop-slop-action-btn btn-reveal" title="Reveal thumbnail">
            👁️ Reveal
          </button>
        `;

        overlay.querySelector('.btn-reveal')?.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          htmlElement.classList.toggle('stop-slop-revealed');
        });

        thumbContainer.appendChild(overlay);
      }
    }

    // 3. Inject Quick Actions Toolbar
    let quickActions = htmlElement.querySelector('.stop-slop-quick-actions') as HTMLElement;
    if (!quickActions) {
      quickActions = document.createElement('div');
      quickActions.className = 'stop-slop-quick-actions';
      quickActions.innerHTML = `
        <button type="button" class="stop-slop-mini-btn btn-unflag" title="Mark as safe / whitelist video">
          🏳️ Unflag
        </button>
        <button type="button" class="stop-slop-mini-btn btn-block-chan" title="Block and flag all videos from this channel">
          🚫 Block Channel
        </button>
      `;

      quickActions.querySelector('.btn-unflag')?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        onUnflag();
      });

      quickActions.querySelector('.btn-block-chan')?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        onBlockChannel();
      });

      htmlElement.appendChild(quickActions);
    }
  }

  static remove(element: Element): void {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.remove(
      'stop-slop-card',
      'stop-slop-flagged',
      'stop-slop-action-blur',
      'stop-slop-action-badge',
      'stop-slop-action-hide',
      'stop-slop-revealed'
    );
    delete htmlElement.dataset.stopSlopScore;
    delete htmlElement.dataset.stopSlopReason;

    htmlElement.querySelector('.stop-slop-badge-container')?.remove();
    htmlElement.querySelector('.stop-slop-overlay')?.remove();
    htmlElement.querySelector('.stop-slop-quick-actions')?.remove();
  }

  static showToast(message: string): void {
    const existing = document.querySelector('.stop-slop-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'stop-slop-toast';
    toast.innerHTML = `<span>🚩 StopSlop:</span> <span>${this.escape(message)}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  private static escape(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
