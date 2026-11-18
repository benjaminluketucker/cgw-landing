/* One public link resolver and one best-effort handoff per history entry. */
(function (root) {
  'use strict';
  if (!root.document || !root.location) return;
  const button = root.document.getElementById('open-app');
  if (!button) return;
  let destination;
  try {
    const url = new URL(root.location.href);
    if (url.origin !== 'https://coolgirlwears.app') return;
    const path = url.pathname.replace(/\/$/, '').replace(/\.html$/, '');
    if (path === '/open/weekly-edit') {
      const editions = url.searchParams.getAll('edition');
      if (!editions.length) destination = 'cgw://'; // Existing current-Weekly entry.
      else if (editions.length === 1 && /^[a-z0-9][a-z0-9._~-]{0,179}$/i.test(editions[0]) && !['.', '..'].includes(editions[0])) destination = 'cgw://week/' + editions[0];
    } else if (path === '/open/shop-the-feed') {
      const posts = url.searchParams.getAll('post');
      if (!posts.length) destination = 'cgw://shop-the-feed';
      else destination = root.CGWArticleLinks?.articleDestination('https://coolgirlwears.app/shop-the-feed' + url.search);
    } else if (path === '/open/discover') destination = 'cgw://discover';
    else destination = root.CGWArticleLinks?.articleDestination(url.href);
  } catch (_) { return; }
  if (!destination) return; // Never replace an invalid identity with Home.
  button.setAttribute('href', destination);
  const banner = root.document.querySelector('meta[name="apple-itunes-app"]');
  if (banner) banner.setAttribute('content', 'app-id=6812481375, app-argument=' + destination);
  const isiOS = /iPhone|iPad|iPod/.test(root.navigator.userAgent) ||
    (root.navigator.platform === 'MacIntel' && root.navigator.maxTouchPoints > 1);
  if (!isiOS) return;
  button.hidden = false;
  if (root.document.visibilityState !== 'visible' || root.document.prerendering) return;
  // Mark before navigation. Refresh/back/return cannot cause a launch loop.
  // If history is unavailable, keep the explicit Open link instead.
  try {
    const state = root.history.state;
    if (state?.cgwAppHandoff === destination) return;
    if (state !== null && (typeof state !== 'object' || Array.isArray(state))) return;
    root.history.replaceState({ ...state, cgwAppHandoff: destination }, '');
    root.location.assign(destination);
  } catch (_) { /* Browser may require the retained Open tap. */ }
}(typeof window === 'undefined' ? globalThis : window));
