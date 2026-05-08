const WORKER_URL = 'https://zentro-tmdb.adarsha99999.workers.dev';

export const TMDB = {
  base: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'https://api.themoviedb.org/3' : WORKER_URL,
  get key() { try { return window._tmdbKey || localStorage.getItem('zentro_tmdb_key') || ''; } catch { return ''; } },
};

export let ready = Promise.resolve();
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  ready = import('./env.js').then(({ TMDB_KEY }) => { window._tmdbKey = TMDB_KEY; }).catch(() => {});
}

export const img = (path, size = 'w342') => path ? `https://wsrv.nl/?url=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2F${size}${encodeURIComponent(path)}&output=webp&q=80&n=-1` : null;

// --- SUPER PROVIDER ---
export const player = {
  // We use Vidsrc.me because it's the hardest to block and loads the fastest
  movie: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
  tv: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`
};
