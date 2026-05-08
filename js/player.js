import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';

export function openPlayer(src) {
  const existing = document.querySelector('.player-overlay');
  if (existing) existing.remove();

  // THE REDIRECT TRAP: Prevents ads from taking over your main tab
  window.onbeforeunload = () => "Warning: An ad tried to redirect you. Stay here to watch!";

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('referrerpolicy', 'origin');
  iframe.setAttribute('frameborder', '0');
  
  // THE SHADOW SANDBOX: 
  // Includes 'allow-top-navigation-by-user-activation' to fix the black screen
  // Does NOT include 'allow-downloads' to stop malware downloads
  iframe.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-presentation allow-popups allow-top-navigation-by-user-activation');
  
  iframe.src = src;

  // AD-SHIELD: Catches the very first "dirty" click
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer;');
  
  adShield.onmousedown = () => {
    adShield.remove();
    iframe.focus();
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  const close = () => {
    window.onbeforeunload = null;
    iframe.src = '';
    overlay.remove();
  };

  closeBtn.onclick = close;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

export function openMoviePlayer(item) { openPlayer(embed.movie(item.id)); }
export function openEpisodePlayer(itemId, s, e) { openPlayer(embed.tv(itemId, s, e)); }
