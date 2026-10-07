export function initPreload() {
  const root = document.documentElement;

  window.addEventListener('load', () => {
    root.classList.remove('preload');
    requestAnimationFrame(() => root.classList.add('hero-ready'));
  }, { once: true });

  setTimeout(() => {
    root.classList.remove('preload');
    root.classList.add('hero-ready');
  }, 900);
}

export function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

export function initProjectReel() {
  const root = document.querySelector('.project-reel');
  if (!root) return;

  const titles = [...root.querySelectorAll('.reel-title')];
  const shots = [...root.querySelectorAll('.reel-shot')];
  const metas = [...root.querySelectorAll('.reel-meta')];
  const steps = [...root.querySelectorAll('.reel-step')];
  const count = root.querySelector('.reel-count');
  const frame = root.querySelector('.reel-frame');
  const line = root.querySelector('.reel-progress-line');
  const prevBtn = root.querySelector('[data-dir="prev"]');
  const nextBtn = root.querySelector('[data-dir="next"]');
  const total = titles.length;
  if (total < 2 || !frame) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = Math.max(0, titles.findIndex((title) => title.classList.contains('is-current')));
  let busy = false;
  let drag = null;
  let suppressClick = false;
  let settle = 0;
  let lineReady = false;

  const pad = (value) => String(value).padStart(2, '0');
  const nameAt = (item) => item.querySelector('.reel-name').textContent.trim();

  const placeLine = () => {
    if (!line || !steps[index]) return;
    const step = steps[index];
    const next = steps[index + 1];
    const after = step.offsetLeft + step.offsetWidth;
    const room = next ? next.offsetLeft - after : 64;
    const x = after + (room > 48 ? 12 : 8);
    const apply = () => {
      line.style.transform = `translate(${x}px, -50%)`;
    };
    if (!lineReady) {
      line.style.transition = 'none';
      apply();
      void line.offsetWidth;
      line.style.transition = '';
      lineReady = true;
      return;
    }
    apply();
  };

  const sync = () => {
    const prev = (index - 1 + total) % total;
    const next = (index + 1) % total;
    prevBtn.querySelector('.reel-dir-name').textContent = nameAt(titles[prev]);
    nextBtn.querySelector('.reel-dir-name').textContent = nameAt(titles[next]);
    prevBtn.setAttribute('aria-label', `Попередній проєкт: ${nameAt(titles[prev])}`);
    nextBtn.setAttribute('aria-label', `Наступний проєкт: ${nameAt(titles[next])}`);
    titles.forEach((title, item) => {
      const on = item === index;
      title.setAttribute('aria-hidden', String(!on));
      title.tabIndex = on ? 0 : -1;
    });
    shots.forEach((shot, item) => {
      shot.setAttribute('aria-hidden', String(item !== index));
    });
    metas.forEach((meta, item) => {
      meta.setAttribute('aria-hidden', String(item !== index));
    });
    steps.forEach((step, item) => {
      const on = item === index;
      step.classList.toggle('is-active', on);
      if (on) step.setAttribute('aria-current', 'true');
      else step.removeAttribute('aria-current');
    });
    placeLine();
  };

  const clearMotion = (item) => {
    titles[item].classList.remove('is-current', 'is-leaving');
    shots[item].classList.remove('is-current', 'is-leaving', 'is-out-next', 'is-out-prev', 'is-from-right', 'is-from-left');
    shots[item].style.transform = '';
    shots[item].style.transition = '';
    metas[item].classList.remove('is-current', 'is-leaving');
  };

  const go = (direction, target = null) => {
    if (!direction || busy) return;
    const from = index;
    const to = target === null ? (index + direction + total) % total : target;
    if (to === from) return;
    index = to;
    settle += 1;

    if (reduceMotion.matches) {
      clearMotion(from);
      titles[to].classList.add('is-current');
      shots[to].classList.add('is-current');
      metas[to].classList.add('is-current');
      count.textContent = `${pad(to + 1)} / ${pad(total)}`;
      sync();
      return;
    }

    busy = true;
    titles[from].classList.remove('is-current');
    titles[from].classList.add('is-leaving');
    metas[from].classList.remove('is-current');
    metas[from].classList.add('is-leaving');

    const outgoing = shots[from];
    const fromDrag = outgoing.style.transform !== '';
    outgoing.classList.remove('is-current');
    outgoing.classList.add('is-leaving', direction > 0 ? 'is-out-next' : 'is-out-prev');
    if (fromDrag) {
      outgoing.style.transition = 'opacity .64s ease, transform .64s cubic-bezier(.22, .61, .36, 1)';
      void outgoing.offsetWidth;
      outgoing.style.transform = '';
    }

    const incoming = shots[to];
    incoming.style.transition = 'none';
    incoming.classList.add(direction > 0 ? 'is-from-right' : 'is-from-left');
    void incoming.offsetWidth;
    incoming.style.transition = '';
    void incoming.offsetWidth;
    incoming.classList.add('is-current');
    incoming.classList.remove('is-from-right', 'is-from-left');
    titles[to].classList.add('is-current');
    metas[to].classList.add('is-current');

    count.classList.add('is-out');
    window.setTimeout(() => {
      count.textContent = `${pad(to + 1)} / ${pad(total)}`;
      count.classList.remove('is-out');
    }, 180);
    sync();

    window.setTimeout(() => {
      const shot = shots[from];
      shot.style.transition = 'none';
      titles[from].style.transition = 'none';
      metas[from].style.transition = 'none';
      shot.classList.remove('is-leaving', 'is-out-next', 'is-out-prev');
      titles[from].classList.remove('is-leaving');
      metas[from].classList.remove('is-leaving');
      shot.style.transform = '';
      void shot.offsetWidth;
      shot.style.transition = '';
      titles[from].style.transition = '';
      metas[from].style.transition = '';
      busy = false;
    }, 660);
  };

  const easeBack = (shot) => {
    const token = ++settle;
    const finish = (event) => {
      if (event && event.propertyName !== 'transform') return;
      if (token !== settle) return;
      shot.removeEventListener('transitionend', finish);
      shot.style.transition = '';
      shot.style.transform = '';
    };
    shot.addEventListener('transitionend', finish);
    shot.style.transition = 'transform .45s cubic-bezier(.22, .61, .36, 1)';
    shot.style.transform = 'translateX(0)';
    window.setTimeout(finish, 480);
  };

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  steps.forEach((step) => {
    step.addEventListener('click', () => {
      const to = Number(step.dataset.index);
      if (Number.isNaN(to) || to === index) return;
      go(to > index ? 1 : -1, to);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return;
    const active = document.activeElement;
    if (!root.matches(':hover') && !root.contains(active)) return;
    event.preventDefault();
    go(event.key === 'ArrowRight' ? 1 : -1);
  });

  const setHistoryLock = (locked) => {
    document.documentElement.classList.toggle('reel-x', locked);
  };

  root.addEventListener('pointerenter', () => setHistoryLock(true));
  root.addEventListener('pointerleave', () => setHistoryLock(false));

  root.addEventListener('wheel', (event) => {
    setHistoryLock(true);
    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    if (absX === 0 || absX <= absY) return;
    event.preventDefault();
    if ((drag && drag.active) || absX < 16) return;
    go(event.deltaX > 0 ? 1 : -1);
  }, { passive: false });

  frame.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || busy) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dx: 0,
      active: false
    };
  });

  frame.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id || busy) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag = null;
        return;
      }
      drag.active = true;
      settle += 1;
      shots[index].style.transition = 'none';
      try { frame.setPointerCapture(event.pointerId); } catch {}
    }
    drag.dx = dx;
    const follow = Math.max(-72, Math.min(72, dx * 0.45));
    shots[index].style.transform = `translateX(${follow}px)`;
  });

  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const state = drag;
    drag = null;
    if (!state.active) return;
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 350);
    const shot = shots[index];
    if (Math.abs(state.dx) >= 56) {
      go(state.dx < 0 ? 1 : -1);
      return;
    }
    easeBack(shot);
  };

  frame.addEventListener('pointerup', endDrag);
  frame.addEventListener('pointercancel', endDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  frame.addEventListener('click', (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);

  if (typeof ResizeObserver !== 'undefined' && line) {
    new ResizeObserver(() => placeLine()).observe(line.parentElement);
  }

  sync();
}

export function initMotion() {
  const video = document.querySelector('.hero-video');
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
}
