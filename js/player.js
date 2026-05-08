import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';
import { progress, history } from './storage.js';

function trackProgress(key) {
  const handler = (e) => {
    if (e.data?.type === 'v_progress') {
      progress.set(key, { t: e.data.time, d: e.data.duration });
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

export function openPlayer(src, progressKey) {
  const existing = document.querySelector('.player-overlay');
  if (existing && existing._close) existing._close();
  else existing?.remove();

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('frameborder', '0');
  iframe.src = src;

  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer; background: transparent;');
  
  adShield.onmousedown = () => {
    adShield.remove();
    iframe.focus();
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  const cleanup = progressKey ? trackProgress(progressKey) : () => {};

  const close = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    cleanup();
    iframe.src = '';
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };

  const onKey = (e) => {
    if (e.key === 'Escape') close();
    // Re-adding the 'F' for Fullscreen fix
    if (e.code === 'KeyF') {
      if (!document.fullscreenElement) {
        overlay.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }
  };

  overlay._close = close;
  closeBtn.onclick = close;
  document.addEventListener('keydown', onKey);
}

export function openMoviePlayer(item) {
  history.add(item, 'movie');
  const key = `movie_${item.id}`;
  const saved = progress.get(key);
  const opts = saved?.t > 10 ? { timestamp: saved.t } : {};
  openPlayer(embed.movie(item.id, opts), key);
}

export function openEpisodePlayer(itemId, s, e) {
  const key = `tv_${itemId}_s${s}_e${e}`;
  const saved = progress.get(key);
  const opts = saved?.t > 10 ? { timestamp: saved.t } : {};
  openPlayer(embed.tv(itemId, s, e, opts), key);
}
