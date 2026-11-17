// Keeps the home page's first screen the height of what the reader can see, and still while the page scrolls.
// In-app browsers (Instagram, Facebook and others) make the page's screen taller and shorter as
// their bar hides and shows during a scroll, and every CSS screen-height unit (vh, svh, dvh, lvh)
// follows it. The first screen's photo is sized from the screen height, so without this it grows,
// re-crops and pushes the page down under the reader's finger.
// This measures the visible height once when the page opens and holds it in --screen-h. The visible
// height is the smallest of 100svh, window.innerHeight and the visual viewport's height: Chrome on
// iPhone can report 100svh as the height with its bars hidden (WebKit bug 279998), and a page opened
// with the bars hidden measures the taller screen, which pushed the download button below the fold.
// While the page is at the very top, the held height only ever shrinks to a smaller visible height
// (the bars coming back), so the buttons stay on the first screen; it never grows, and it never changes
// mid-scroll, so nothing jumps. It measures afresh when the width changes (turning the phone) or, on a
// mouse-and-keyboard screen, on any window resize.
(function () {
  if (!document.querySelector('.welcome')) return;
  var root = document.documentElement;
  var vv = window.visualViewport;
  var held = 0;
  var lastWidth = -1;

  function svh() {
    var probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.top = '0';
    probe.style.left = '0';
    probe.style.width = '1px';
    probe.style.height = '100svh';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    document.body.appendChild(probe);
    var h = probe.getBoundingClientRect().height;
    document.body.removeChild(probe);
    return h;
  }

  function visible() {
    var h = svh();
    var all = [h, window.innerHeight];
    // the visual viewport is the visible area only when the reader hasn't zoomed in
    if (vv && Math.abs(vv.scale - 1) < 0.01) all.push(vv.height);
    for (var i = 0; i < all.length; i++) {
      if (all[i] > 0 && (!(h > 0) || all[i] < h)) h = all[i];
    }
    return h;
  }

  function set(h) {
    held = h;
    root.style.setProperty('--screen-h', h + 'px');
  }

  function hold() {
    lastWidth = window.innerWidth;
    var h = visible();
    if (h > 0) set(h);
  }

  // the bars came back (or the first measure was too tall) while the reader is at the top: shrink to fit
  function tighten() {
    if (window.scrollY > 0) return;
    var h = visible();
    if (h > 0 && h < held - 0.5) set(h);
  }

  hold();

  var followEveryResize = window.matchMedia
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function onResize() {
    if (followEveryResize || window.innerWidth !== lastWidth) hold();
    else tighten();
  }
  window.addEventListener('resize', onResize);
  if (vv) vv.addEventListener('resize', onResize);
  window.addEventListener('load', tighten);
  // back button: the page comes back from the browser's cache with the bars in whatever state they are now
  window.addEventListener('pageshow', function (e) { if (e.persisted) tighten(); });
})();
