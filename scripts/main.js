import { initPreload, initReveal, initMotion, initProjectReel } from './animations.js';

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const isPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  return /^[+()\d\s.-]+$/.test(value) && digits.length >= 10 && digits.length <= 15;
};

const looksLikeWebsite = (value) => (
  /^https?:\/\//i.test(value) ||
  /^www\./i.test(value) ||
  /^[^\s]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(value)
);

const isWebsite = (value) => {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.includes('.') && !url.hostname.endsWith('.');
  } catch {
    return false;
  }
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

  if (name === 'company') {
    if (!value || !looksLikeWebsite(value)) return '';
    return isWebsite(value) ? '' : 'Вкажіть коректну адресу сайту';
  }

  if (name === 'message') {
    if (!value) return 'Опишіть, що потрібно створити';
    if (value.length < 10) return 'Повідомлення має містити щонайменше 10 символів';
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

const initPrinciples = () => {
  const root = document.querySelector('.principles');
  if (!root) return;

  const items = [...root.querySelectorAll('.principle-item')];
  const detail = root.querySelector('.principle-detail');
  const panel = detail.querySelector('p');

  const select = (item) => {
    items.forEach((entry) => {
      const active = entry === item;
      entry.classList.toggle('is-active', active);
      entry.setAttribute('aria-pressed', String(active));
    });
    detail.classList.remove('is-shown');
    panel.textContent = item.querySelector('p').textContent;
    detail.setAttribute('aria-labelledby', item.id);
    void detail.offsetWidth;
    detail.classList.add('is-shown');
  };

  items.forEach((item) => item.addEventListener('click', () => select(item)));
  select(items.find((item) => item.classList.contains('is-active')) || items[0]);
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

  initPrinciples();
  initServices();
  initReveal();
  initMotion();
  initProjectReel();

  const form = document.querySelector('#leadForm');
  if (form) initContactForm(form);

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
