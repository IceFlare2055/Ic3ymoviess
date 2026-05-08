import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';

export function openPlayer(src) {
  const existing = document.querySelector('.player-overlay');
  if (existing) existing.remove();

  // 1. THE NAVIGATION TRAP
  // This is our primary defense since we can't use a sandbox.
  window.onbeforeunload = () => "An ad tried to redirect you. Stay here to watch!";

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  // 2. CLEAN IFRAME (No Sandbox)
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('referrerpolicy', 'origin');
  iframe.setAttribute('frameborder', '0');
  iframe.src = src;

  // 3. THE AD-SHIELD
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer;');
  
  adShield.onmousedown = () => {
    adShield.remove();
    iframe.focus();
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  const close = () => {
    window.onbeforeunload = null; // Disable trap on close
    iframe.src = '';
    overlay.remove();
  };

  closeBtn.onclick = close;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.code === 'KeyF') {
        if (!document.fullscreenElement) overlay.requestFullscreen().catch(() => {});
        else document.exitFullscreen();
    }
  });
}

export function openMoviePlayer(item) {
  openPlayer(embed.movie(item.id));
}

export function openEpisodePlayer(itemId, s, e) {
  openPlayer(embed.tv(itemId, s, e));
}

// Global Popup Killer (Stays active in the background)
(function() {
    window.open = function() { return { focus: () => {}, blur: () => {}, close: () => {} }; };
})();
