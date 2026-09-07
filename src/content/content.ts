import './content.css';
import { YouTubeObserver } from './observer';

const observer = new YouTubeObserver();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observer.init();
  });
} else {
  observer.init();
}
