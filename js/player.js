import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';

export function openPlayer(src) {
  const existing = document.querySelector('.player-overlay');
  if (existing) existing.remove();

  // 1. REDIRECT PROTECTION
  window.onbeforeunload = () => "Stay here to keep watching!";

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('referrerpolicy', 'origin');
  iframe.setAttribute('frameborder', '0');
  
  // 2. VIDLINK FRIENDLY SANDBOX
  // We added 'allow-top-navigation-by-user-activation' so it doesn't stay black
  // but kept 'allow-downloads' REMOVED to block those scary files.
  iframe.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-presentation allow-popups allow-top-navigation-by-user-activation');
  
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
    window.onbeforeunload = null;
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

export function openLivePlayer(url, title) {
    const existing = document.querySelector('.player-overlay');
    if (existing) existing.remove();
    const overlay = mk('div', 'player-overlay');
    const closeBtn = mk('button', 'player-close', icon('x', 20));
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.style.width = '100%';
    video.style.height = '100%';
    overlay.append(video, closeBtn);
    document.body.appendChild(overlay);
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else { video.src = url; }
    closeBtn.onclick = () => { video.pause(); overlay.remove(); };
}
