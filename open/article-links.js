/* Public-domain article fallback. IDs choose an existing reader, never access. */
(function (root) {
  'use strict';
  const token = /^[a-zA-Z0-9][a-zA-Z0-9._~-]{0,179}$/;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const sources = new Set(['shop_the_feed', 'weekly_edit', 'guide', 'premium']);
  // Keep the app's local return-route boundary, including nested Saved/Discover
  // positions. This metadata never chooses the article or grants access.
  function safeReturn(value, depth = 0) {
    if (typeof value !== 'string' || !value || value.length > 8192 || depth > 4) return;
    const candidate = value.trim();
    const unsafe = text => /[\\\u0000-\u001f\u007f]/.test(text);
    if (!candidate.startsWith('/') || candidate.startsWith('//') || unsafe(candidate)) return;
    try {
      let decoded = candidate.split(/[?#]/, 1)[0];
      for (;;) {
        if (decoded.startsWith('//') || unsafe(decoded) || decoded.split('/').some(part => part === '.' || part === '..')) return;
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      }
      const url = new URL(candidate, 'https://cgw.internal');
      if (url.origin !== 'https://cgw.internal') return;
      if (url.hash) {
        if (url.pathname.startsWith('/content/')) {
          if (!uuid.test(url.pathname.slice('/content/'.length)) || !/^(?:look-(?:0|[1-9][0-9]?)|outfit-ideas-look-(?:0[1-9]|[1-9][0-9]))$/.test(url.hash.slice(1))) return;
        } else {
          const fragment = decodeURIComponent(url.hash.slice(1));
          if (unsafe(fragment) || /[%/#<>]/.test(fragment)) return;
          url.hash = '';
        }
      }
      const nested = url.searchParams.getAll('returnTo');
      if (nested.length > 1 || nested.length === 1 && !safeReturn(nested[0], depth + 1)) return;
      return url.pathname + url.search + url.hash;
    } catch (_) { return; }
  }
  function articleDestination(value) {
    if (typeof value !== 'string' || value.length > 4096 || /[\\\u0000-\u001f\u007f]/.test(value)) return;
    try {
      const url = new URL(value);
      if (url.origin !== 'https://coolgirlwears.app' || url.username || url.password || url.port) return;
      const rawPath = value.split(/[?#]/, 1)[0].replace(/^https:\/\/[^/]+/, '');
      if (rawPath !== url.pathname || rawPath.includes('%')) return;
      const query = new URLSearchParams();
      if (url.pathname === '/shop-the-feed') {
        const posts = url.searchParams.getAll('post');
        if (posts.length !== 1 || !uuid.test(posts[0])) return;
        return 'cgw://content/' + posts[0].toLowerCase() + '?articleSource=shop_the_feed';
      }
      const match = /^\/(content|article|section|week)\/([^/]+)$/.exec(url.pathname);
      if (!match || !token.test(match[2]) || match[2] === '.' || match[2] === '..') return;
      const source = url.searchParams.get('articleSource');
      if (sources.has(source)) query.set('articleSource', source);
      const returns = url.searchParams.getAll('returnTo');
      const origin = returns.length === 1 ? safeReturn(returns[0]) : undefined;
      if (origin) query.set('returnTo', origin);
      const edition = url.searchParams.get('edition');
      if (match[1] === 'section' && edition && token.test(edition)) query.set('edition', edition);
      const offsets = url.searchParams.getAll('y');
      if (match[1] === 'content' && offsets.length === 1 && /^\d{1,8}$/.test(offsets[0]) && Number(offsets[0]) <= 10000000) query.set('y', offsets[0]);
      const anchor = match[1] === 'content' && /^(?:look-(?:0|[1-9][0-9]?)|outfit-ideas-look-(?:0[1-9]|[1-9][0-9]))$/.test(url.hash.slice(1)) ? url.hash : '';
      const search = query.toString();
      return 'cgw://' + url.pathname.slice(1) + (search ? '?' + search : '') + anchor;
    } catch (_) { return; }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { articleDestination, safeReturn };
  if (!root.document || !root.location) return;
  const button = root.document.getElementById('open-app');
  const destination = articleDestination(root.location.href);
  if (!button || !destination) return;
  button.setAttribute('href', destination);
  button.hidden = false;
  const isiOS = /iPhone|iPad|iPod/.test(root.navigator.userAgent) ||
    (root.navigator.platform === 'MacIntel' && root.navigator.maxTouchPoints > 1);
  if (!isiOS || root.document.visibilityState !== 'visible' || root.document.prerendering) return;
  // A blocked automatic handoff leaves the real Open CGW link available.
  // No timer, installation guess, or automatic App Store navigation.
  try { root.location.assign(destination); } catch (_) { /* Manual link remains. */ }
}(typeof window === 'undefined' ? globalThis : window));
