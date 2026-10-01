import { initPreload, initReveal, initMotion } from './animations.js';

(() => {
  const body = document.body;
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#siteMenu');
  const header = document.querySelector('#siteHeader');

  initPreload();

  const closeMenu = (returnFocus = false) => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    body.classList.remove('menu-open');
    if (returnFocus) toggle.focus();
  };

  if (toggle && menu) {
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
      body.classList.toggle('menu-open', open);
    });
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu(true);
    });
    window.matchMedia('(min-width: 1181px)').addEventListener('change', (event) => {
      if (event.matches) closeMenu();
    });
  }

  if (header) {
    const topThreshold = 80;
    const scrollSlack = 10;
    let scrollAnchor = 0;

    window.addEventListener('scroll', () => {
      const y = window.scrollY;

      if (y <= topThreshold) {
        header.classList.remove('hidden', 'scrolled');
        scrollAnchor = y;
      } else if (y > scrollAnchor + scrollSlack) {
        header.classList.add('hidden');
        scrollAnchor = y;
      } else if (y < scrollAnchor - scrollSlack) {
        header.classList.remove('hidden');
        header.classList.add('scrolled');
        scrollAnchor = y;
      }
    }, { passive: true });
  }

  initReveal();
  initMotion();

  const form = document.querySelector('#leadForm');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const subject = encodeURIComponent('Запит на проєкт — ITLEO Ukraine');
      const message = encodeURIComponent(
        `Ім’я: ${data.get('name') || ''}\n` +
        `Контакт: ${data.get('contact') || ''}\n` +
        `Компанія / сайт: ${data.get('company') || ''}\n\n` +
        `Завдання:\n${data.get('message') || ''}`
      );
      window.location.href = `mailto:hello@itleo.com.ua?subject=${subject}&body=${message}`;
    });
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
