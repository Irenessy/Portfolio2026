const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const entrance = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('has-entered');
      entrance.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.projects .card, .portfolio-case .study, .about').forEach(element => entrance.observe(element));
}

const galleryLinks = Array.from(document.querySelectorAll('.portfolio-case main a[href$=".webp"]:not(.archive-open), .drawer-prints a[href$=".webp"]'));
const language = document.documentElement.lang;
const galleryLabels = {
  'zh-Hant': ['設計稿預覽', '關閉', '上一張', '下一張'],
  'zh-CN': ['设计稿预览', '关闭', '上一张', '下一张'],
  en: ['Design preview', 'Close', 'Previous', 'Next'],
};

if (galleryLinks.length && typeof HTMLDialogElement !== 'undefined') {
  const [title, closeText, previousText, nextText] = galleryLabels[language];
  const gallery = document.createElement('dialog');
  gallery.className = 'design-gallery';
  gallery.setAttribute('aria-label', title);
  gallery.innerHTML = `
    <div class="gallery-inner">
      <div class="gallery-top"><strong></strong><div><button type="button" data-zoom aria-pressed="false"></button><button type="button" data-close autofocus></button></div></div>
      <div class="gallery-image"><img alt=""></div>
      <div class="gallery-bottom">
        <button type="button" data-previous></button>
        <p aria-live="polite"></p>
        <button type="button" data-next></button>
      </div>
    </div>`;
  document.body.append(gallery);

  gallery.querySelector('strong').textContent = title;
  const close = gallery.querySelector('[data-close]');
  const previous = gallery.querySelector('[data-previous]');
  const next = gallery.querySelector('[data-next]');
  const photo = gallery.querySelector('img');
  const imageArea = gallery.querySelector('.gallery-image');
  const caption = gallery.querySelector('.gallery-bottom p');
  close.textContent = closeText;
  previous.textContent = previousText;
  next.textContent = nextText;

  const zoom = gallery.querySelector('[data-zoom]');
  const zoomLabels = {
    'zh-Hant':['放大細節','顯示全圖'], 'zh-CN':['放大细节','显示全图'], en:['Zoom in','Fit image']
  }[language];
  let zoomed = false;
  let imageMotion;
  function setZoom(value) {
    zoomed = value;
    imageArea.classList.toggle('is-zoomed', value);
    zoom.setAttribute('aria-pressed', String(value));
    zoom.textContent = zoomLabels[value ? 1 : 0];
    imageArea.scrollTop = imageArea.scrollLeft = 0;
  }
  zoom.addEventListener('click', () => setZoom(!zoomed));
  let group = [];
  let position = 0;
  let trigger = null;

  function displayImage(direction = 0) {
    const link = group[position];
    const name = link.querySelector('img')?.alt || link.getAttribute('aria-label') || title;
    setZoom(false);
    imageMotion?.cancel();
    photo.onload = () => {
      if (direction && !reducedMotion.matches && photo.animate) {
        imageMotion = photo.animate([{opacity:.55,transform:'translateX(' + (direction * 12) + 'px)'},{opacity:1,transform:'none'}],
          {duration:210,easing:'cubic-bezier(.2,.7,.3,1)'});
      }
    };
    photo.src = link.href;
    photo.alt = name;
    imageArea.scrollTop = 0;
    caption.textContent = `${position + 1} / ${group.length} · ${name}`;
    previous.disabled = position === 0;
    next.disabled = position === group.length - 1;
    if (document.activeElement === previous && previous.disabled) next.focus();
    if (document.activeElement === next && next.disabled) previous.focus();
  }

  function navigateImage(direction) {
    const target = position + direction;
    if (target < 0 || target >= group.length) return;
    position = target;
    displayImage(direction);
  }

  galleryLinks.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const scope = link.closest('.drawer-prints, .fred-lane, .case-section, .rail-review') || link.closest('main');
    group = galleryLinks.filter(item => scope.contains(item));
    position = group.indexOf(link);
    trigger = link;
    displayImage();
    gallery.showModal();
    document.documentElement.classList.add('gallery-open');
  }));

  let startPoint = null;
  imageArea.addEventListener('pointerdown', event => {
    startPoint = !zoomed && event.isPrimary && event.button === 0 ? {x:event.clientX,y:event.clientY,id:event.pointerId} : null;
    if (startPoint) imageArea.setPointerCapture(event.pointerId);
  });
  imageArea.addEventListener('pointerup', event => {
    if (!startPoint || event.pointerId !== startPoint.id) return;
    const dx = event.clientX-startPoint.x, dy = event.clientY-startPoint.y;
    startPoint = null;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)*1.4) navigateImage(dx < 0 ? 1 : -1);
  });
  imageArea.addEventListener('pointercancel', () => {startPoint = null;});
  photo.draggable = false;
  previous.addEventListener('click', () => navigateImage(-1));
  next.addEventListener('click', () => navigateImage(1));
  close.addEventListener('click', () => gallery.close());
  gallery.addEventListener('click', event => {
    if (event.target === gallery) gallery.close();
  });
  gallery.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    navigateImage(event.key === 'ArrowLeft' ? -1 : 1);
  });
  gallery.addEventListener('close', () => {
    document.documentElement.classList.remove('gallery-open');
    imageMotion?.cancel();
    trigger?.focus({ preventScroll: true });
  });
}

const chapters = document.querySelector('.case-content > .on-page');
if (chapters) {
  const header = document.querySelector('.header');
  const links = [...chapters.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  let frame = 0;
  let active = -1;
  function update() {
    frame = 0;
    const edge = header.offsetHeight + chapters.offsetHeight + 18;
    let index = -1;
    sections.forEach((section,i) => {
      if (section && section.getBoundingClientRect().top <= edge) index = i;
    });
    if (index === active) return;
    active = index;
    links.forEach((link,i) => {
      if (i === index) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    const link = links[index];
    if (link && chapters.scrollWidth > chapters.clientWidth) {
      const rect = link.getBoundingClientRect(), rail = chapters.getBoundingClientRect();
      if (rect.left < rail.left || rect.right > rail.right) {
        chapters.scrollTo({left:chapters.scrollLeft+rect.left-rail.left-8,behavior:reducedMotion.matches?'instant':'smooth'});
      }
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function measure() {
    const content = chapters.parentElement;
    content.style.setProperty('--chapter-top',header.offsetHeight+'px');
    content.style.setProperty('--chapter-height',chapters.offsetHeight+'px');
    schedule();
  }
  const sizes = new ResizeObserver(measure);
  sizes.observe(header); sizes.observe(chapters);
  window.addEventListener('scroll',schedule,{passive:true});
  measure();
}
