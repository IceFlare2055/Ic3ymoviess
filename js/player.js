import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';
import { progress, history } from './storage.js';

// --- PROGRESS TRACKING ---
function trackProgress(key) {
  const handler = (e) => {
    // Note: Vidsrc.to uses a different message system than Vidking
    // We'll keep this clean for now
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

// --- CORE PLAYER ENGINE ---
export function openPlayer(src, progressKey) {
  const existing = document.querySelector('.player-overlay');
  if (existing && existing._close) existing._close();
  else existing?.remove();

  // 1. STICKY REDIRECT GUARD
  // Instead of blocking window.open, we use this to catch redirects
  window.onbeforeunload = () => "Return to movie?";

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  // 2. THE CRITICAL SETTINGS FOR VIDSRC.TO
  iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
  
  // Changing this to 'origin' helps Vidsrc.to verify your site
  iframe.setAttribute('referrerpolicy', 'origin'); 
  
  iframe.setAttribute('frameborder', '0');
  iframe.src = src;

  // 3. AD-SHIELD
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
    window.onbeforeunload = null;
    document.removeEventListener('keydown', onKey);
  };

  const onKey = (e) => {
    if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        else close();
    }
    if (e.code === 'KeyF') {
      if (!document.fullscreenElement) overlay.requestFullscreen().catch(() => {});
      else document.exitFullscreen();
    }
  };

  overlay._close = close;
  closeBtn.onclick = close;
  document.addEventListener('keydown', onKey);
}

// --- BUTTON EXPORTS ---
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

export function openLivePlayer(url, title) {
  const existing = document.querySelector('.player-overlay');
  if (existing && existing._close) existing._close();
  else existing?.remove();

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const video = document.createElement('video');
  const loading = mk('div', 'live-fs-loading', `<div class="spin-ring"><div></div><div></div><div></div><div></div></div><span>Connecting…</span>`);
  
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;

  overlay.append(video, closeBtn, loading);
  document.body.appendChild(overlay);

  const close = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (video._hls) video._hls.destroy();
    video.pause();
    video.src = '';
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };

  overlay._close = close;
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  closeBtn.onclick = close;
  document.addEventListener('keydown', onKey);

  const initHls = () => {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.oncanplay = () => loading.remove();
    } else if (window.Hls?.isSupported()) {
      const hls = new window.Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        loading.remove();
        video.play().catch(() => {});
      });
      video._hls = hls;
    }
  };

  if (window.Hls) initHls();
  else {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.7/hls.min.js';
    s.onload = initHls;
    document.head.appendChild(s);
  }
}
import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';
import { progress, history } from './storage.js';

export function openPlayer(src, progressKey) {
  const existing = document.querySelector('.player-overlay');
  if (existing && existing._close) existing._close();
  else existing?.remove();

  // 1. THE REDIRECT LOCK
  // If an ad tries to hijack the tab, this forces a "Stay on Page" prompt.
  window.onbeforeunload = () => "An ad tried to redirect you. Stay here to watch the movie.";

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
  iframe.setAttribute('referrerpolicy', 'origin');
  iframe.setAttribute('frameborder', '0');

  // 2. THE DOWNLOAD & REDIRECT JAIL
  // We omit 'allow-top-navigation' to stop redirects.
  // We omit 'allow-downloads' to stop those scary file downloads.
  iframe.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox');

  iframe.src = src;

  // 3. THE CLICK-EATER SHIELD
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer; background: transparent;');
  
  adShield.onmousedown = () => {
    adShield.remove();
    iframe.focus();
    console.log("Shield dropped. First ad attempt neutralized.");
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  const onKey = (e) => {
    if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        else close();
    }
    if (e.code === 'KeyF') {
      if (!document.fullscreenElement) overlay.requestFullscreen().catch(() => {});
      else document.exitFullscreen();
    }
  };

  const close = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    iframe.src = '';
    overlay.remove();
    window.onbeforeunload = null; 
    document.removeEventListener('keydown', onKey);
  };

  overlay._close = close;
  closeBtn.onclick = close;
  document.addEventListener('keydown', onKey);
}

// --- KEEP THESE AT THE BOTTOM FOR THE BUTTONS TO WORK ---
export function openMoviePlayer(item) {
  history.add(item, 'movie');
  openPlayer(embed.movie(item.id), `movie_${item.id}`);
}

export function openEpisodePlayer(itemId, s, e) {
  openPlayer(embed.tv(itemId, s, e), `tv_${itemId}_s${s}_e${e}`);
}

export function openLivePlayer(url, title) {
  // Live player logic...
  const existing = document.querySelector('.player-overlay');
  if (existing && existing._close) existing._close();
  else existing?.remove();

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const video = document.createElement('video');
  video.controls = true;
  video.autoplay = true;
  overlay.append(video, closeBtn);
  document.body.appendChild(overlay);

  const close = () => {
    video.pause();
    overlay.remove();
  };
  closeBtn.onclick = close;
}

// --- GLOBAL POPUP OVERRIDE ---
// This kills most popups before they even start
(function() {
    const originalOpen = window.open;
    window.open = function() {
        return { blur: () => {}, focus: () => {}, close: () => {} }; 
    };
})();
