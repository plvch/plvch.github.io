/* plvch site — theme toggle.
   The initial data-theme is set by a tiny inline <head> script (no flash);
   localStorage key 'oi-theme' is shared with the essays so the choice
   carries across the whole domain. */
(function () {
  var root = document.documentElement;

  function getTheme() { return root.getAttribute('data-theme') || 'light'; }

  function syncButtons() {
    var t = getTheme();
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      var active = b.getAttribute('data-theme-btn') === t;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-theme-btn');
      root.setAttribute('data-theme', t);
      try { localStorage.setItem('oi-theme', t); } catch (e) {}
      syncButtons();
    });
  });

  syncButtons();
})();
