import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';

export function openPlayer(src) {
  const existing = document.querySelector('.player-overlay');
  if (existing) existing.remove();

  // 1. THE REDIRECT TRAP
  // If an ad tries to hijack the tab, this forces the browser to stop it.
  window.onbeforeunload = () => "An ad tried to redirect you. Click 'Stay' to keep watching!";

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  // 2. THE HYBRID SECURITY SETTINGS
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('referrerpolicy', 'origin');
  iframe.setAttribute('frameborder', '0');
  
  // This specific sandbox combo allows the movie to play but BLOCKS auto-downloads
  iframe.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox');
  
  iframe.src = src;

  // 3. THE AD-SHIELD (Invisible Wall)
  // This catches the very first click (the one that usually triggers a download/popup)
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer; background: transparent;');
  
  adShield.onmousedown = () => {
    adShield.remove();
    iframe.focus();
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  const close = () => {
    window.onbeforeunload = null; // Turn off the trap when closing
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

// --- LINK TO BUTTONS ---
export function openMoviePlayer(item) {
  openPlayer(embed.movie(item.id));
}

export function openEpisodePlayer(itemId, s, e) {
  openPlayer(embed.tv(itemId, s, e));
}

// --- LIVE TV (No Sandbox Needed) ---
export function openLivePlayer(url, title) {
    const existing = document.querySelector('.player-overlay');
    if (existing) existing.remove();
    const overlay = mk('div', 'player-overlay');
    const closeBtn = mk('button', 'player-close', icon('x', 20));
    const video = document.createElement('video');
    video.controls = true; video.autoplay = true; video.style.width = '100%'; video.style.height = '100%';
    overlay.append(video, closeBtn);
    document.body.appendChild(overlay);
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls(); hls.loadSource(url); hls.attachMedia(video);
    } else { video.src = url; }
    closeBtn.onclick = () => { video.pause(); overlay.remove(); };
}
