// URL utility functions for proper GitHub Pages deployment
export const getBaseUrl = () => {
  // For GitHub Pages deployment
  if (window.location.hostname === 'nmamit-annika.github.io') {
    return '/Echocity1';
  }
  // For local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '';
  }
  // Fallback
  return '/Echocity1';
};

export const getFullUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${baseUrl}${cleanPath}`;
};

export const getAppUrl = (path: string = '/app') => {
  return getFullUrl(path);
};

// Debug function to log URL information
export const debugUrls = () => {
  console.log('URL Debug Info:', {
    hostname: window.location.hostname,
    origin: window.location.origin,
    pathname: window.location.pathname,
    baseUrl: getBaseUrl(),
    appUrl: getAppUrl(),
    communityUrl: getAppUrl('/community')
  });
};