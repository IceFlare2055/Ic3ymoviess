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

  // The Shield we added earlier to eat the first ad
  const adShield = mk('div', 'ad-shield');
  adShield.setAttribute('style', 'position:absolute; inset:0; z-index:10; cursor:pointer; background: transparent;');
  adShield.onclick = (e) => {
    e.stopPropagation();
    adShield.remove();
    iframe.focus(); // Focus the player after the ad-shield is gone
  };

  overlay.append(iframe, adShield, closeBtn);
  document.body.appendChild(overlay);

  // --- KEYBOARD SHORTCUTS FIX START ---
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    
    // We send a message to the iframe to tell it what to do
    // Note: This only works if the provider (Vidking) supports these commands
    const win = iframe.contentWindow;
    if (e.code === 'Space') {
      e.preventDefault();
      win.postMessage(JSON.stringify({ type: 'PLAYER_COMMAND', data: 'togglePause' }), '*');
    }
    if (e.code === 'KeyF') {
      if (!document.fullscreenElement) overlay.requestFullscreen();
      else document.exitFullscreen();
    }
    if (e.code === 'ArrowRight') win.postMessage(JSON.stringify({ type: 'PLAYER_COMMAND', data: 'seekForward' }), '*');
    if (e.code === 'ArrowLeft') win.postMessage(JSON.stringify({ type: 'PLAYER_COMMAND', data: 'seekBackward' }), '*');
  };
  // --- KEYBOARD SHORTCUTS FIX END ---

  const cleanup = progressKey ? trackProgress(progressKey) : () => {};
  const close = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    cleanup();
    iframe.src = '';
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };

  overlay._close = close;
  closeBtn.onclick = close;
  document.addEventListener('keydown', onKey);
}
