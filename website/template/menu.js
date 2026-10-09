(function () {
  var btn = document.querySelector('.nav-toggle');
  var menu = document.getElementById('site-menu');
  if (!btn || !menu) return;

  function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
  }

  btn.addEventListener('click', function () {
    setOpen(menu.hidden);
  });

  if (window.location.hash === '#menu') setOpen(true);

  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      btn.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 700 && !menu.hidden) setOpen(false);
  });
})();
