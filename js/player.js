import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';

/**
 * Main Player Function
 */
export function openPlayer(src) {
  const existing = document.querySelector('.player-overlay');
  if (existing) existing.remove();

  // 1. REDIRECT PROTECTION (Forces browser to ask before leaving)
  window.onbeforeunload = () => "An ad tried to redirect you. Stay here to watch!";

  // 2. ACTIVE POPUP MONITOR (Kills new tabs every 100ms)
  const blocker = setInterval(() => {
    if (window.open) {
        window.open = function() { return { focus: () => {}, blur: () => {}, close: () => {} }; };
    }
  }, 100);

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  // Iframe Settings
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('referrerpolicy', 'origin');
  iframe.setAttribute('frameborder', '0');
  
  // 3. HARDENED SANDBOX (Blocks Downloads & Redirects)
  // We do NOT include 'allow-top-navigation' or 'allow-downloads'
  iframe.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-presentation allow-popups');
  
  iframe.src = src;

  // 4. AD-SHIELD (Eats the very first click)
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer; background: transparent;');
  
  adShield.onmousedown = () => {
    adShield.remove();
    iframe.focus();
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  const close = () => {
    clearInterval(blocker);
    window.onbeforeunload = null;
    iframe.src = '';
    overlay.remove();
  };

  closeBtn.onclick = close;

  // Keyboard Support
  const keyHandler = (e) => {
    if (e.key === 'Escape') close();
    if (e.code === 'KeyF') {
        if (!document.fullscreenElement) overlay.requestFullscreen().catch(() => {});
        else document.exitFullscreen();
    }
  };
  document.addEventListener('keydown', keyHandler);
}

/**
 * Movie Opener
 */
export function openMoviePlayer(item) {
  openPlayer(embed.movie(item.id));
}

/**
 * TV Opener
 */
export function openEpisodePlayer(itemId, s, e) {
  openPlayer(embed.tv(itemId, s, e));
}

/**
 * Live TV Opener
 */
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

  const close = () => {
    video.pause();
    overlay.remove();
  };
  closeBtn.onclick = close;

  if (window.Hls && window.Hls.isSupported()) {
    const hls = new window.Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
  } else {
    video.src = url;
  }
}
