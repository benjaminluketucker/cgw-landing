/* Fixed destinations only: email query parameters cannot choose a URL. */
(function () {
  'use strict';
  const destinations = Object.freeze({
    '/open/weekly-edit': 'cgw://',
    '/open/shop-the-feed': 'cgw://shop-the-feed',
    '/open/discover': 'cgw://discover'
  });
  const path = window.location.pathname.replace(/\/$/, '').replace(/\.html$/, '');
  const destination = destinations[path];
  const button = document.getElementById('open-app');
  if (!destination || !button || button.getAttribute('href') !== destination) return;

  const isiOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isiOS) return;

  // A real link remains available when the browser requires a user gesture.
  // Do not infer installation from timers or automatically send anyone to the Store.
  button.hidden = false;
  if (document.visibilityState !== 'visible' || document.prerendering) return;
  try {
    window.location.assign(destination);
  } catch (_) {
    // The visible Open link also works when automatic navigation is blocked.
  }
}());
