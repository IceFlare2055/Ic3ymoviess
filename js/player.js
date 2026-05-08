import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';
import { progress, history } from './storage.js';

function trackProgress(key) {
  const handler = (e) => {
    if (!e.origin.includes('vidking.net')) return;
    if (typeof e.data !== 'string') return;
    try {
      const msg = JSON.parse(e.data);
      if (msg.type !== 'PLAYER_EVENT') return;
      const { event, currentTime, duration, progress: pct } = msg.data;
      if (['timeupdate', 'pause', 'ended', 'seeked'].includes(event) && currentTime > 5) {
        progress.set(key, {
          t: Math.floor(currentTime),
          d: Math.floor(duration),
          p: +pct.toFixed(1),
        });
      }
    } catch {}
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

export function openPlayer(src, progressKey) {
  const existing = document.querySelector('.player-overlay');
  if (existing && existing._close) existing._close();
  else existing?.remove();

  // --- THE REDIRECT LOCK ---
  // If an ad tries to hijack the tab, this forces a "Stay on Page" prompt.
  window.onbeforeunload = () => "Do you want to leave?";

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  iframe.setAttribute('frameborder', '0');
  iframe.src = src;

  // --- THE CLICK SNATCHER ---
  // This helps prevent "invisible" ad layers from triggering when you click the player
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer; background: transparent;');
  
  adShield.onmousedown = (e) => {
    // If it's the very first click, remove the shield
    if (document.querySelector('.ad-shield')) {
        adShield.remove();
        iframe.focus();
    }
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  const cleanup = progressKey ? trackProgress(progressKey) : () => {};

  const close = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    cleanup();
    iframe.src = '';
    overlay.remove();
    window.onbeforeunload = null; // Turn off the lock when we close the player
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

// --- LIVE TV ---
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

// --- ANTI-POPUP GLOBAL SCRIPT ---
// This runs constantly to kill any window.open attempt
(function() {
    const originalOpen = window.open;
    window.open = function() {
        console.log("Ad Blocked");
        return { 
            blur: () => {}, 
            focus: () => {}, 
            close: () => {} 
        }; 
    };
})();
