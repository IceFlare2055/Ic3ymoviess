import { player as embed } from './config.js';
import { mk } from './components.js';
import { icon } from './icons.js';
import { progress, history } from './storage.js';

/**
 * Tracks video progress via postMessage from the provider
 */
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

/**
 * Main Player Function
 */
export function openPlayer(src, progressKey) {
  const existing = document.querySelector('.player-overlay');
  if (existing && existing._close) existing._close();
  else existing?.remove();

  // --- ANTI-REDIRECT MEASURE ---
  // Blocks the iframe from forcing your main window to a new URL
  const preventRedirect = () => "Are you sure you want to leave?";
  window.onbeforeunload = preventRedirect;

  const overlay = mk('div', 'player-overlay');
  const closeBtn = mk('button', 'player-close', icon('x', 20));
  const iframe = document.createElement('iframe');

  iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  iframe.setAttribute('frameborder', '0');
  
  // We do NOT use the sandbox attribute here to avoid the "Sandbox Detected" error
  iframe.src = src;

  // --- AD-SHIELD TRICK ---
  // Invisible layer that "steals" the first click (and the first ad pop-up)
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer; background: transparent;');
  
  adShield.onclick = (e) => {
    e.stopPropagation();
    adShield.remove(); // Shield vanishes so you can hit the real Play button
    iframe.focus();   // Focuses the player so internal shortcuts might work
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  const cleanup = progressKey ? trackProgress(progressKey) : () => {};

  // --- KEYBOARD SHORTCUTS ---
  const onKey = (e) => {
    // Escape to close or exit fullscreen
    if (e.key === 'Escape') {
      if (document.fullscreenElement) document.exitFullscreen();
      else close();
    }
    
    // 'F' for Fullscreen
    if (e.code === 'KeyF') {
      if (!document.fullscreenElement) {
        overlay.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }

    // Spacebar focus
    if (e.code === 'Space') {
        iframe.focus();
    }
  };

  const close = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    cleanup();
    iframe.src = '';
    overlay.remove();
    window.onbeforeunload = null; // Disable redirect protection on close
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('blur', onBlur);
  };

  // --- FOCUS PROTECTION ---
  // Snaps focus back to your site if an ad tries to pull it away
  const onBlur = () => setTimeout(() => window.focus(), 10);
  window.addEventListener('blur', onBlur);

  overlay._close = close;
  closeBtn.onclick = close;
  document.addEventListener('keydown', onKey);
}

/**
 * Movie Specific Opener
 */
export function openMoviePlayer(item) {
  history.add(item, 'movie');
  const key = `movie_${item.id}`;
  const saved = progress.get(key);
  const opts = saved?.t > 10 ? { timestamp: saved.t } : {};
  openPlayer(embed.movie(item.id, opts), key);
}

/**
 * Episode Specific Opener
 */
export function openEpisodePlayer(itemId, s, e) {
  const key = `tv_${itemId}_s${s}_e${e}`;
  const saved = progress.get(key);
  const opts = saved?.t > 10 ? { timestamp: saved.t } : {};
  openPlayer(embed.tv(itemId, s, e, opts), key);
}

/**
 * Live Stream Player (HLS)
 */
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
