(() => {
  const opening = document.querySelector('.portfolio-opening');
  const header = document.querySelector('.header');
  const pin = opening.querySelector('.opening-pin');
  const scenes = [...opening.querySelectorAll('.opening-scene')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const centers = [0.08, 0.36, 0.62];
  const clamp = value => Math.max(0, Math.min(value, 1));

  let scheduled = false;
  let headerHeight = 0;
  let distance = 1;
  let coverRadius = 0;
  let currentProgress = null;
  let lastTime = 0;

  function ease(progress, start, end) {
    const amount = clamp((progress - start) / (end - start));
    return amount * amount * (3 - 2 * amount);
  }

  function paint(time = performance.now()) {
    scheduled = false;
    if (motion.matches) return;

    const target = clamp((headerHeight - opening.getBoundingClientRect().top) / distance);
    // Once past the opening, document scrolling should no longer update every scene.
    if (target === 1 && currentProgress === 1 && opening.hasAttribute('data-complete')) return;
    const elapsed = Math.min(64, time - lastTime || 16);
    lastTime = time;
    if (currentProgress === null || target === 1 || target === 0) currentProgress = target;
    else currentProgress += (target - currentProgress) * (1 - Math.exp(-elapsed / 65));
    const progress = currentProgress;
    const first = ease(progress, 0.17, 0.31);
    const second = ease(progress, 0.41, 0.55);
    const covered = ease(progress, 0.69, 0.87);
    const reveal = ease(progress, 0.87, 0.99);
    // Fade each chapter through the midpoint before the next project's images appear.
    const alpha = [Math.max(0, 1 - first * 2), first < 1 ? Math.max(0, first * 2 - 1) : Math.max(0, 1 - second * 2), Math.max(0, second * 2 - 1)];
    const active = alpha.indexOf(Math.max(...alpha));

    opening.style.setProperty('--opening-progress', progress.toFixed(4));
    opening.style.setProperty('--wipe-radius', `${covered * coverRadius}px`);
    opening.style.setProperty('--reveal-radius', `${reveal * coverRadius}px`);
    opening.style.setProperty('--opening-scene-visibility', (1 - ease(progress, 0.81, 0.89)).toFixed(4));
    opening.toggleAttribute('data-wiping', covered > 0);
    const revealing = progress >= 0.86;
    opening.toggleAttribute('data-destination', revealing);
    document.body.style.setProperty('--entry-offset', revealing ? `${-Math.max(0, distance * (1 - target))}px` : '0px');
    opening.toggleAttribute('data-complete', target >= 1);
    opening.style.setProperty('--wipe-x', matchMedia('(max-width:720px)').matches ? '52%' : '76%');
    opening.style.setProperty('--wipe-y', matchMedia('(max-width:720px)').matches ? '64%' : '47%');
    header.style.setProperty('--opening-flash', (ease(progress, 0.82, 0.87) * (1 - ease(progress, 0.90, 0.98))).toFixed(4));
    header.toggleAttribute('data-opening-flash', progress >= 0.846 && progress <= 0.94);

    scenes.forEach((scene, index) => {
      const offset = progress - centers[index];
      scene.style.setProperty('--scene-alpha', alpha[index].toFixed(4));
      scene.style.setProperty('--scene-shift', `${-offset * 145}px`);
      scene.style.setProperty('--scene-scale', 1 + offset * 0.42);
      scene.toggleAttribute('data-visible', alpha[index] > 0);
      scene.setAttribute('aria-hidden', String(index !== active || covered >= 1));
    });
    if (Math.abs(target - progress) > 0.0003) {
      scheduled = true;
      requestAnimationFrame(paint);
    }
  }

  function measure() {
    opening.classList.toggle('is-interactive', !motion.matches);
    if (motion.matches) {
      opening.removeAttribute('data-destination');
      document.body.style.setProperty('--entry-offset','0px');
      document.body.style.setProperty('--opening-overlap','0px');
      header.style.removeProperty('--opening-flash');
      header.removeAttribute('data-opening-flash');
      return;
    }

    headerHeight = header.offsetHeight;
    opening.style.setProperty('--opening-header', `${headerHeight}px`);
    document.body.style.setProperty('--opening-overlap', `${pin.offsetHeight}px`);
    distance = Math.max(1, opening.offsetHeight - pin.offsetHeight);
    coverRadius = Math.hypot(pin.clientWidth, pin.offsetHeight);
    opening.removeAttribute('data-complete');
    paint();
  }

  function onScroll() {
    if (scheduled || motion.matches) return;
    scheduled = true;
    requestAnimationFrame(paint);
  }

  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(header);
  addEventListener('resize', measure, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  motion.addEventListener('change', measure);
  measure();
})();
