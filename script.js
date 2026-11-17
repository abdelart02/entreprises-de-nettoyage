/* ==========================================================
   Éclat Pro — Interactions
   ========================================================== */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Thème clair / sombre ---------- */
  var toggle = document.getElementById('themeToggle');
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return media.matches ? 'dark' : 'light';
  }

  function updateToggleLabel() {
    var dark = currentTheme() === 'dark';
    toggle.setAttribute('aria-label', dark ? 'Activer le mode clair' : 'Activer le mode sombre');
    toggle.setAttribute('title', dark ? 'Mode clair' : 'Mode sombre');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#060d19' : '#0b1f3a');
  }

  toggle.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    updateToggleLabel();
  });

  // Suit le système tant que l'utilisateur n'a pas fait de choix manuel
  var onSystemChange = function () {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    if (!saved) { root.removeAttribute('data-theme'); updateToggleLabel(); }
  };
  if (media.addEventListener) media.addEventListener('change', onSystemChange);
  else if (media.addListener) media.addListener(onSystemChange);

  updateToggleLabel();

  /* ---------- Menu mobile ---------- */
  var menuBtn = document.getElementById('menuToggle');
  var nav = document.getElementById('nav');

  function closeMenu() {
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Ouvrir le menu');
  }

  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- En-tête au défilement + bouton haut ---------- */
  var header = document.getElementById('header');
  var toTop = document.getElementById('toTop');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    toTop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Lien actif dans la navigation ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a'));
  var sections = links
    .map(function (l) { return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);

  /* ---------- Apparition au défilement + compteurs ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = target + suffix; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        var counter = entry.target.querySelector('[data-count]');
        if (counter) animateCount(counter);
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      revealObs.observe(el);
    });

    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObs.observe(s); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    document.querySelectorAll('[data-count]').forEach(animateCount);
  }

  /* ---------- Formulaires (rappel + devis) ---------- */
  document.querySelectorAll('.js-form').forEach(function (form) {
  var status = form.querySelector('.form__status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;
    form.querySelectorAll('[required]').forEach(function (input) {
      var wrapper = input.closest('.field') || input.closest('.checkbox');
      var ok = input.type === 'checkbox' ? input.checked : input.checkValidity() && input.value.trim() !== '';
      if (wrapper) wrapper.classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });

    status.className = 'form__status';
    if (!valid) {
      status.textContent = 'Merci de compléter les champs obligatoires.';
      status.classList.add('is-error');
      var first = form.querySelector('.is-invalid input, .is-invalid textarea');
      if (first) first.focus();
      return;
    }

    // À connecter à votre service d'envoi (Formspree, backend, etc.)
    var btn = form.querySelector('button[type="submit"]');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';
    setTimeout(function () {
      form.reset();
      btn.disabled = false;
      btn.textContent = label;
      status.textContent = 'Merci ! Votre demande a bien été envoyée. Nous vous recontactons sous 24 h.';
      status.classList.add('is-success');
    }, 900);
  });

  form.addEventListener('input', function (e) {
    var wrapper = e.target.closest('.is-invalid');
    if (wrapper) wrapper.classList.remove('is-invalid');
  });
  });

  /* ---------- Année ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
