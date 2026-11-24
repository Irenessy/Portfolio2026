(() => {
  const archive = document.querySelector('[data-visual-archive]');
  if (!archive) return;

  const tabs = Array.from(archive.querySelectorAll('.drawer-tab'));
  const faces = Array.from(archive.querySelectorAll('.drawer-face'));
  const works = tabs.map(tab => document.getElementById(tab.dataset.drawer));
  const box = archive.querySelector('.drawer-box');
  let current = -1;
  let initialized = false;

  function display(index) {
    if (initialized && index === current) return;
    const oldIndex = current;
    const motion = initialized && !matchMedia('(prefers-reduced-motion: reduce)').matches && !!box.animate;
    const animate = motion && matchMedia('(min-width:701px)').matches;
    const windowFrame = archive.querySelector('.drawer-window');
    windowFrame.querySelector('.turning-paper')?.remove();
    const outgoing = oldIndex < 0 ? archive.querySelector('.drawer-cover') : faces[oldIndex];
    const leaf = motion ? outgoing.cloneNode(true) : null;
    // Capture the old series' paper and ink before applying the next series.
    const surfaceStyle = getComputedStyle(outgoing);
    const paper = surfaceStyle.background;
    const ink = surfaceStyle.color;
    const previous = animate ? tabs.map(tab => tab.getBoundingClientRect().left) : [];
    tabs.forEach(tab => tab.getAnimations().forEach(animation => animation.cancel()));
    current = index;
    archive.classList.toggle('is-open', index >= 0);
    archive.style.setProperty('--past-count', Math.max(0, index));
    archive.style.setProperty('--future-count', tabs.length - Math.max(0, index));
    if (index >= 0) archive.dataset.series = tabs[index].dataset.drawer;
    else delete archive.dataset.series;
    tabs.forEach((tab, position) => {
      const active = position === index;
      tab.classList.toggle('is-turned', index >= 0 && position < index);
      tab.style.setProperty('--tab-position', position);
      tab.style.setProperty('--tab-from-end', tabs.length - position - 1);
      tab.setAttribute('aria-expanded', String(active));
      faces[position].classList.toggle('is-active', active);
      faces[position].setAttribute('aria-hidden', String(!active));
      works[position].hidden = !active;
    });
    if (animate) tabs.forEach((tab, position) => {
      const distance = previous[position] - tab.getBoundingClientRect().left;
      if (Math.abs(distance) < 2 || position === current) return;
      tab.animate([
        { translate: `${distance}px 0`, rotate: `y ${distance > 0 ? -35 : 35}deg` },
        { translate: '0px 0', rotate: 'y 0deg' },
      ], { duration: 700, easing: 'cubic-bezier(.22,.78,.2,1)' });
    });
    if (motion) {
      const surface = index < 0 ? archive.querySelector('.drawer-cover') : faces[index];
      const fromLeft = oldIndex > index;
      leaf.removeAttribute('data-face');
      leaf.inert = true;
      leaf.classList.add('turning-paper');
      leaf.setAttribute('aria-hidden','true');
      Object.assign(leaf.style,{background:paper,color:ink,transformOrigin:fromLeft?'right center':'left center'});
      windowFrame.append(leaf);
      const sign = fromLeft ? 1 : -1;
      const turn = leaf.animate([
        {transform:'perspective(1500px) rotateY(0deg)',filter:'brightness(1)',opacity:1},
        {offset:.54,transform:'perspective(1500px) rotateY('+ sign*38 +'deg)',filter:'brightness(.83)',opacity:.9},
        {transform:'perspective(1500px) rotateY('+ sign*89 +'deg)',filter:'brightness(.69)',opacity:0}
      ],{duration:510,easing:'cubic-bezier(.35,.03,.28,1)',fill:'forwards'});
      turn.finished.then(()=>leaf.remove(),()=>leaf.remove());
      for (const layer of surface.querySelectorAll('.drawer-art,.drawer-illustration,.drawer-face-copy,.drawer-fan,.drawer-cover-copy')) {
        layer.getAnimations().forEach(effect => effect.cancel());
        const resting = getComputedStyle(layer);
        const restingOpacity = Number(resting.opacity);
        const restingTransform = resting.transform;
        layer.style.transformOrigin = fromLeft ? 'left center' : 'right center';
        layer.animate([
          {filter:'blur(4px)',opacity:restingOpacity*.38,transform:'perspective(1250px) rotateY(' + (fromLeft ? -16 : 16) + 'deg)'},
          {filter:'blur(1px)',opacity:restingOpacity*.88,offset:.48},
          {filter:'blur(0)',opacity:restingOpacity,transform:restingTransform}
        ],{duration:560,easing:'cubic-bezier(.22,.76,.2,1)'});
      }
      if (index >= 0) {
        const tray = works[index].querySelector('.drawer-prints');
        tray.getAnimations().forEach(effect => effect.cancel());
        tray.animate([{opacity:.36,filter:'blur(2px)'},{opacity:1,filter:'blur(0)'}],{duration:420,easing:'ease-out'});
      }
    }
    initialized = true;
  }

  function fromLocation() {
    display(tabs.findIndex(tab => tab.hash === location.hash));
  }

  function syncLocation(tab) {
    const fallback = document.getElementById('visual') ? '#visual' : location.pathname + location.search;
    history.replaceState(history.state, '', tab ? tab.hash : fallback);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  function close(tab) {
    syncLocation(null);
    tab.focus({ preventScroll: true });
    if (box.getBoundingClientRect().bottom < 150) {
      box.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (index === current) close(tab);
      else syncLocation(tab);
    });
    tab.addEventListener('keydown', event => {
      const next = { ArrowLeft: index - 1, ArrowUp: index - 1, ArrowRight: index + 1, ArrowDown: index + 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (typeof next !== 'number') return;
      event.preventDefault();
      tabs[(next + tabs.length) % tabs.length].focus();
    });
    works[index].querySelector('.drawer-return').addEventListener('click', () => close(tab));
  });

  fromLocation();
  archive.classList.add('is-indexed');
  window.addEventListener('hashchange', fromLocation);
})();
