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
