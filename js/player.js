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
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.setAttribute('frameborder', '0');
  
  // NO SANDBOX: This ensures the movie ALWAYS loads.
  iframe.src = src;

  // AD-SHIELD: Your single line of defense.
  // It stays over the player until you click it once.
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer; background:rgba(0,0,0,0.01);');
  
  adShield.onmousedown = () => {
    adShield.remove();
    iframe.focus();
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  closeBtn.onclick = () => {
    iframe.src = '';
    overlay.remove();
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        iframe.src = '';
        overlay.remove();
    }
  });
}

export function openMoviePlayer(item) { openPlayer(embed.movie(item.id)); }
export function openEpisodePlayer(itemId, s, e) { openPlayer(embed.tv(itemId, s, e)); }
