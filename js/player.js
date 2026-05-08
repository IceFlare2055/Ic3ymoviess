import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';
import { progress, history } from './storage.js';

// --- PROGRESS TRACKING ---
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

// --- CORE PLAYER ENGINE ---
export function openPlayer(src, progressKey) {
  const existing = document.querySelector('.player-overlay');
  if (existing && existing._close) existing._close();
  else existing?.remove();

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  iframe.setAttribute('frameborder', '0');
  iframe.src = src;

  // AD-SHIELD: Invisible layer that vanishes on click
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

// --- BUTTON TRIGGERS ---
// These MUST be here for the buttons on your page to work!
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
  const info = mk('div', 'live-fs-info', `<span class="live-fs-badge">${icon('circle', 8, { fill: 'currentColor' })} LIVE</span><span class="live-fs-title">${title || ''}</span>`);

  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;

  overlay.append(video, closeBtn, loading, info);
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
      const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        loading.remove();
        video.play().catch(() => {});
      });
      video._hls = hls;
    } else {
      loading.innerHTML = 'HLS not supported';
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
// --- GLOBAL REDIRECT & POPUP GUARD ---
(function() {
    // 1. Block any attempt to open a new window/tab
    window.open = function() {
        console.log("Global Guard: Blocked a popup attempt.");
        return null; 
    };

    // 2. Block the "Back Button" hijacking
    const noop = () => {};
    window.history.pushState = noop;
    window.history.replaceState = noop;

    // 3. The "Stay on Page" Lock
    // This triggers a browser popup if an ad tries to force the page to a new URL
    window.addEventListener('beforeunload', (event) => {
        // Only show the warning if the player overlay is currently open
        if (document.querySelector('.player-overlay')) {
            event.preventDefault();
            event.returnValue = ''; // Required for Chrome
        }
    });
})();
