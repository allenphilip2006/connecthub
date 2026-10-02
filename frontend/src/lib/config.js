const DEFAULT_DEV_API = 'http://localhost:62223';
export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_DEV_API).replace(/\/$/, '');
export const API_URL = `${API_BASE_URL}/api`;
export const WS_URL = `${API_BASE_URL}/ws`;
export const mediaUrl = (path) => {
  if (!path) return null;
  if (typeof path === 'string' && path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
export default { API_BASE_URL, API_URL, WS_URL, mediaUrl };
