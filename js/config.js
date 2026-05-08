const WORKER_URL = 'https://zentro-tmdb.adarsha99999.workers.dev';

export const TMDB = {
  base:
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? 'https://api.themoviedb.org/3'
      : WORKER_URL,

  get key() {
    try {
      return window._tmdbKey || localStorage.getItem('zentro_tmdb_key') || '';
    } catch {
      return '';
    }
  },
};

export let ready = Promise.resolve();

if (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
) {
  ready = import('./env.js')
    .then(({ TMDB_KEY }) => {
      window._tmdbKey = TMDB_KEY;
    })
    .catch(() => {});
}

export const img = (path, size = 'w342') =>
  path
    ? `https://wsrv.nl/?url=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2F${size}${encodeURIComponent(path)}&output=webp&q=80&n=-1`
    : null;

// --- UPDATED PLAYER SECTION ---
export const player = {
  // Switched to Vidsrc.to to stop seeker-bar redirects
  movie: (id, opts = {}) =>
    buildVid(`https://vidsrc.to/embed/movie/${id}`, opts),
  tv: (id, s, e, opts = {}) =>
    buildVid(`https://vidsrc.to/embed/tv/${id}/${s}/${e}`, opts),
};

function buildVid(base, extra = {}) {
  // Filters out empty options and builds the URL
  const params = new URLSearchParams();
  
  // Vidsrc.to specific: use 't' for timestamp if provided
  if (extra.timestamp) {
    params.append('t', extra.timestamp);
  }

  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}
