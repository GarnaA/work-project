import { initPreload, initReveal, initMotion, initProjectReel } from './animations.js';

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const isPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  return /^[+()\d\s.-]+$/.test(value) && digits.length >= 10 && digits.length <= 15;
};

const fieldError = (name, value) => {
  if (name === 'name') {
    if (!value) return 'Вкажіть ім’я та прізвище';
    if (value.length < 2) return 'Ім’я має містити щонайменше 2 символи';
    return '';
  }

  if (name === 'contact') {
    if (!value) return 'Вкажіть email або телефон';
    if (value.includes('@')) return isEmail(value) ? '' : 'Вкажіть коректний email';
    if (/^[+()\d\s.-]+$/.test(value)) {
      return isPhone(value) ? '' : 'Вкажіть коректний номер телефону';
    }
    return 'Вкажіть коректний email або номер телефону';
  }

  return '';
};

const initContactForm = (form) => {
  const submit = form.querySelector('[type="submit"]');
  const fields = [...form.querySelectorAll('input, textarea')];

  const messageFor = (field) => fieldError(field.name, field.value.trim());

  const showError = (field) => {
    const message = field.dataset.touched ? messageFor(field) : '';
    const error = form.querySelector(`#${field.getAttribute('aria-describedby')}`);
    const invalid = Boolean(message);
    field.classList.toggle('is-invalid', invalid);
    field.setAttribute('aria-invalid', String(invalid));
    if (error && error.textContent !== message) error.textContent = message;
    return invalid;
  };

  const updateSubmit = () => {
    submit.disabled = fields.some((field) => messageFor(field));
  };

  const touch = (field) => {
    field.dataset.touched = 'true';
    showError(field);
    updateSubmit();
  };

  fields.forEach((field) => {
    field.addEventListener('input', () => touch(field));
    field.addEventListener('blur', () => touch(field));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = fields.filter((field) => {
      field.dataset.touched = 'true';
      return showError(field);
    });
    updateSubmit();
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

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

  updateSubmit();
};

const initAccordion = (root) => {
  const items = [...root.querySelectorAll('.principle-item')];
  if (!items.length) return;

  const panelOf = (item) => item.querySelector('.principle-panel');

  const setOpen = (item, open) => {
    const panel = panelOf(item);
    if (item.classList.contains('is-active') === open) return;
    item.classList.toggle('is-active', open);
    item.querySelector('button').setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    if (open) {
      panel.style.height = `${panel.scrollHeight}px`;
      return;
    }
    panel.style.height = `${panel.scrollHeight}px`;
    void panel.offsetHeight;
    panel.style.height = '0px';
  };

  items.forEach((item) => {
    const panel = panelOf(item);
    if (item.classList.contains('is-active')) {
      panel.style.transition = 'none';
      panel.style.height = `${panel.scrollHeight}px`;
      void panel.offsetHeight;
      panel.style.transition = '';
    } else {
      panel.style.height = '0px';
    }
    item.querySelector('button').addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-active');
      items.forEach((entry) => setOpen(entry, entry === item && willOpen));
    });
  });

  window.addEventListener('resize', () => {
    items.forEach((item) => {
      if (!item.classList.contains('is-active')) return;
      const panel = panelOf(item);
      panel.style.height = 'auto';
      panel.style.height = `${panel.scrollHeight}px`;
    });
  });
};

const initServices = () => {
  const root = document.querySelector('.service-stage');
  if (!root) return;

  const cards = [...root.querySelectorAll('.service-card')];
  const details = [...root.querySelectorAll('.service-detail')];
  let frame = 0;

  const select = (card) => {
    const next = details.find((detail) => detail.dataset.service === card.dataset.service);
    const current = details.find((detail) => detail.classList.contains('is-active'));
    if (!next || next === current) return;

    const token = ++frame;
    cards.forEach((entry) => {
      const active = entry === card;
      entry.classList.toggle('is-active', active);
      entry.setAttribute('aria-pressed', String(active));
    });

    const show = () => {
      if (token !== frame) return;
      details.forEach((detail) => {
        const active = detail === next;
        detail.classList.toggle('is-active', active);
        detail.classList.remove('is-leaving');
        detail.hidden = !active;
        if (active) detail.classList.remove('is-shown');
      });
      void next.offsetWidth;
      next.classList.add('is-shown');
    };

    if (current && current.classList.contains('is-shown')) {
      current.classList.remove('is-shown');
      current.classList.add('is-leaving');
      window.setTimeout(show, 300);
      return;
    }

    show();
  };

  cards.forEach((card) => card.addEventListener('click', () => select(card)));
};

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

  const scrollTop = document.querySelector('.scroll-top');
  const preferReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const topThreshold = 80;
  const scrollTopThreshold = 1650;

  if (header || scrollTop) {
    const scrollSlack = 10;
    let scrollAnchor = 0;

    const syncScrollUi = () => {
      const y = window.scrollY;

      if (header) {
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
      }

      if (scrollTop) {
        scrollTop.classList.toggle('is-visible', y > scrollTopThreshold);
      }
    };

    window.addEventListener('scroll', syncScrollUi, { passive: true });
    syncScrollUi();
  }

  if (scrollTop) {
    scrollTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: preferReducedMotion.matches ? 'auto' : 'smooth'
      });
    });
  }

  document.querySelectorAll('.principle-list').forEach(initAccordion);
  initServices();
  initReveal();
  initMotion();
  initProjectReel();

  const form = document.querySelector('#leadForm');
  if (form) initContactForm(form);

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
