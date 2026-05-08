import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';

export function openPlayer(src) {
  const existing = document.querySelector('.player-overlay');
  if (existing) existing.remove();

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('frameborder', '0');
  iframe.src = src;

  // The Ad-Shield stays to catch that first click
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer; background:rgba(0,0,0,0.01);');
  
  adShield.onmousedown = () => {
    adShield.remove();
    iframe.focus();
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  const close = () => {
    iframe.src = '';
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };

  const onKey = (e) => {
    if (e.key === 'Escape') close();
    // Press 'F' to go Fullscreen
    if (e.code === 'KeyF') {
      if (!document.fullscreenElement) {
        overlay.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }
  };

  closeBtn.onclick = close;
  document.addEventListener('keydown', onKey);
}

export function openMoviePlayer(item) { openPlayer(embed.movie(item.id)); }
export function openEpisodePlayer(itemId, s, e) { openPlayer(embed.tv(itemId, s, e)); }
