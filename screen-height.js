// Keeps the home page's first screen still while the page scrolls.
// In-app browsers (Instagram, Facebook and others) make the page's screen taller and shorter as
// their bar hides and shows during a scroll, and every CSS screen-height unit (vh, svh, dvh, lvh)
// follows it. The first screen's photo is sized from the screen height, so without this it grows,
// re-crops and pushes the page down under the reader's finger.
// This measures 100svh once when the page opens (the same value the CSS starts from, so nothing
// moves at load) and holds it in --screen-h. It measures again only when the width changes
// (turning the phone) or, on a mouse-and-keyboard screen, on any window resize.
(function () {
  if (!document.querySelector('.welcome')) return;
  var root = document.documentElement;
  var lastWidth = -1;

  function hold() {
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
    lastWidth = window.innerWidth;
    if (h > 0) root.style.setProperty('--screen-h', h + 'px');
  }

  hold();

  var followEveryResize = window.matchMedia
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  window.addEventListener('resize', function () {
    if (followEveryResize || window.innerWidth !== lastWidth) hold();
  });
})();
