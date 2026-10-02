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

export function initWorkCarousel() {
  const root = document.querySelector('.work-carousel');
  if (!root) return;

  const viewport = root.querySelector('.work-viewport');
  const track = root.querySelector('.work-track');
  const originals = [...track.children];
  if (originals.length < 2) return;

  const cloneCard = (card) => {
    const copy = card.cloneNode(true);
    copy.dataset.clone = 'true';
    copy.setAttribute('aria-hidden', 'true');
    copy.tabIndex = -1;
    return copy;
  };

  const clonesBefore = originals.map(cloneCard);
  const clonesAfter = originals.map(cloneCard);
  track.prepend(...clonesBefore);
  track.append(...clonesAfter);
  track.querySelectorAll('img').forEach((img) => { img.draggable = false; });

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let offset = 0;
  let period = 0;
  let step = 0;
  let hovering = false;
  let focused = false;
  let dragging = false;
  let animating = false;
  let visible = false;
  let last = 0;
  let animId = 0;
  let pointer = null;

  const measure = () => {
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    period = originals[0].offsetLeft - clonesBefore[0].offsetLeft;
    step = originals[0].offsetWidth + gap;
  };

  const wrap = () => {
    if (!period) return;
    while (offset <= -period * 2) offset += period;
    while (offset > -period) offset -= period;
  };

  const render = () => {
    track.style.transform = `translate3d(${offset}px,0,0)`;
  };

  const autoplay = () => !reduceMotion.matches && !document.hidden && visible && !hovering && !focused && !dragging && !animating;

  const tick = (now) => {
    if (!last) last = now;
    const dt = Math.min(48, now - last);
    last = now;
    if (autoplay()) {
      offset -= 110 * (dt / 1000);
      wrap();
      render();
    }
    requestAnimationFrame(tick);
  };

  const move = (direction) => {
    if (!period) return;
    const delta = direction * step;
    if (offset + delta > -period) offset -= period;
    if (offset + delta < -period * 2) offset += period;
    const from = offset;
    const target = from + delta;
    if (reduceMotion.matches) {
      offset = target;
      wrap();
      render();
      return;
    }
    const id = ++animId;
    const start = performance.now();
    animating = true;
    const run = (now) => {
      if (id !== animId) return;
      const t = Math.min(1, (now - start) / 650);
      offset = from + (target - from) * (1 - (1 - t) ** 3);
      render();
      if (t < 1) requestAnimationFrame(run);
      else {
        wrap();
        render();
        animating = false;
      }
    };
    requestAnimationFrame(run);
  };

  root.querySelectorAll('.work-arrow').forEach((button) => {
    button.addEventListener('click', () => move(button.dataset.dir === 'prev' ? 1 : -1));
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(-1);
    }
  });

  root.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') hovering = true;
  });
  root.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'touch') hovering = false;
  });
  root.addEventListener('focusin', (event) => {
    focused = true;
    const card = event.target.closest?.('.case');
    if (!card || card.dataset.clone || !period) return;
    let left = card.offsetLeft + offset;
    while (left + card.offsetWidth <= 0) {
      offset += period;
      left += period;
    }
    while (left >= viewport.clientWidth) {
      offset -= period;
      left -= period;
    }
    wrap();
    render();
  });
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget)) focused = false;
  });

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, offset, moved: false };
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!dragging) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        pointer = null;
        return;
      }
      dragging = true;
      pointer.moved = true;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(event.pointerId);
    }
    offset = pointer.offset + dx;
    wrap();
    render();
  });
  const endDrag = (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const moved = pointer.moved;
    pointer = null;
    dragging = false;
    viewport.classList.remove('is-dragging');
    if (moved) {
      const stopClick = (click) => {
        click.preventDefault();
        click.stopPropagation();
        viewport.removeEventListener('click', stopClick, true);
      };
      viewport.addEventListener('click', stopClick, true);
    }
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  document.addEventListener('visibilitychange', () => { last = 0; });
  reduceMotion.addEventListener('change', () => { last = 0; });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(viewport);
  new ResizeObserver(() => {
    const ratio = period ? offset / period : -1;
    measure();
    if (!period) return;
    offset = ratio * period;
    wrap();
    render();
  }).observe(viewport);

  measure();
  offset = -period;
  render();
  requestAnimationFrame(tick);
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
