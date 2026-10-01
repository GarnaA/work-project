(() => {
  const root = document.documentElement;
  const body = document.body;
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#siteMenu');
  const header = document.querySelector('#siteHeader');
  const video = document.querySelector('.hero-video');

  window.addEventListener('load', () => {
    root.classList.remove('preload');
    requestAnimationFrame(() => root.classList.add('hero-ready'));
  }, { once: true });

  setTimeout(() => {
    root.classList.remove('preload');
    root.classList.add('hero-ready');
  }, 900);

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

  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('scrolled', y > 40);
      header.classList.toggle('hidden', y > lastY && y > 420);
    }
    lastY = y;
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncVideo = () => {
    if (!video) return;
    if (reduceMotion.matches) {
      video.pause();
      video.currentTime = 0;
    } else {
      video.play().catch(() => {});
    }
  };
  reduceMotion.addEventListener('change', syncVideo);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncVideo();
  });
  if (video) video.addEventListener('canplay', syncVideo);
  syncVideo();

  if (!reduceMotion.matches && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * .1;
        const y = (event.clientY - rect.top - rect.height / 2) * .1;
        element.style.transform = `translate(${x}px, ${y}px)`;
      });
      element.addEventListener('pointerleave', () => {
        element.style.transform = '';
      });
    });
  }

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
