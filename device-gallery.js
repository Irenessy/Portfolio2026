(() => {
// Each project has a different fold of the same blue ribbon.
function createLightField(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const presets = [
    [-.15, .58, .17, 1.0], [.14, 1.18, .32, 1.7], [-.43, .82, .08, 2.6],
    [.25, .44, .40, 3.8], [-.24, 1.37, .22, 5.2],
  ];
  let current = presets[0].slice();
  let frame = 0;
  let width = 1, height = 1;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const narrow = width <= 700;
    const cx = width * (narrow ? .52 : .75);
    const cy = height * (narrow ? .27 : .51);
    const radius = width * (narrow ? .62 : .36);
    const ry = (narrow ? Math.min(265,height * .52) : height) * .36;
    const [tilt, twist, lift, phase] = current;
    const glow = ctx.createRadialGradient(cx,cy,0,cx,cy,radius * 1.5);
    glow.addColorStop(0,'rgba(71,135,196,.2)');
    glow.addColorStop(.62,'rgba(34,81,142,.13)');
    glow.addColorStop(1,'rgba(32,75,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,width,height);
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(tilt);
    const lines = 38;
    for (let j=0; j<lines; j++) {
      const f = j/(lines-1);
      const edge = j===0 || j===lines-1;
      const ridge = Math.pow(Math.cos(f * Math.PI * 2 + phase) * .5 + .5, 2);
      ctx.strokeStyle = edge ? 'rgba(160,218,255,.58)' : 'rgba('+Math.round(65+ridge*77)+','+Math.round(113+ridge*76)+',235,'+(.14+ridge*.4)+')';
      ctx.lineWidth = edge ? 1.3 : .8;
      ctx.beginPath();
      for(let k=0;k<=156;k++) {
        const t=k/156*Math.PI*2;
        const fold=Math.sin(t*2+phase);
        const edgeShift=(f-.5)*twist;
        const x=radius*(Math.cos(t)*(1+edgeShift*.26)+fold*lift*.36);
        const y=ry*(Math.sin(t)*(.83+edgeShift*.6)+fold*(.46+edgeShift)+Math.cos(t+phase)*edgeShift*.85);
        if(k===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
  function size() {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1,box.width); height = Math.max(1,box.height);
    const dpr = Math.min(2,window.devicePixelRatio || 1);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  new ResizeObserver(size).observe(canvas);
  return (index) => {
    cancelAnimationFrame(frame);
    const from = current.slice(), to = presets[index];
    if (reduce.matches) { current=to.slice(); draw(); return; }
    const start = performance.now();
    function advance(time) {
      const t=Math.min(1,(time-start)/840);
      const eased=t*t*(3-2*t);
      current=to.map((value,i)=>from[i]+(value-from[i])*eased);
      draw();
      if(t<1) frame=requestAnimationFrame(advance);
    }
    frame=requestAnimationFrame(advance);
  };
}


const gallery = document.querySelector('[data-device-gallery="collection"]');
if (gallery) {
  const slides = [...gallery.querySelectorAll('.device-slide')];
  const rail = gallery.querySelector('.device-tabs');
  const tabs = [...rail.querySelectorAll('button')];
  const stage = gallery.querySelector('.device-stage');
  const indicator = gallery.querySelector('.exhibit-position b');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = 0;
  let requested = 0;
  let revision = 0;
  let effects = [];
  document.body.classList.add('has-device-gallery');
  const changeLight = createLightField(stage.querySelector('canvas'));

  function markTab(reveal = false) {
    const tab = tabs[visible];
    rail.style.setProperty('--tab-start', tab.offsetLeft + 'px');
    rail.style.setProperty('--tab-width', tab.offsetWidth + 'px');
    if (reveal && (tab.offsetLeft < rail.scrollLeft || tab.offsetLeft + tab.offsetWidth > rail.scrollLeft + rail.clientWidth)) {
      rail.scrollTo({left:tab.offsetLeft - (rail.clientWidth-tab.offsetWidth)/2, behavior:reduce.matches ? 'instant' : 'smooth'});
    }
  }

  function show(index) {
    visible = index;
    slides.forEach((slide,i) => {
      slide.hidden = i !== index;
      tabs[i].setAttribute('aria-pressed', String(i === index));
    });
    markTab(true);
    indicator.textContent=String(index+1).padStart(2,'0');
    gallery.style.setProperty('--fraction', (index+1)/slides.length);
  }
  function animate(node, keyframes, timing) {
    const anim = node.animate(keyframes,timing);
    effects.push(anim);
    return anim;
  }
  async function select(index) {
    const next=(index+slides.length)%slides.length;
    if (next===requested) return;
    requested=next;
    const token=++revision;
    effects.forEach(effect=>effect.cancel());
    effects=[];
    const previous=visible;
    const distance=(next-previous+slides.length)%slides.length;
    const direction=distance>slides.length/2 ? -1 : 1;
    const nextImage = slides[next].querySelector('.device-shell img');
    nextImage.loading = 'eager';
    changeLight(next);
    if(reduce.matches || !stage.animate) {show(next); return;}
    if(next!==previous){
      const outgoing = slides[previous].querySelector('.device-shell');
      const out=animate(outgoing,[
        {opacity:1,transform:getComputedStyle(outgoing).transform},
        {opacity:.18,transform:`perspective(1100px) translateX(${-direction*29}px) rotateY(${-direction*11}deg) scale(.96)`}
      ],{duration:160,easing:'ease-in',fill:'both'});
      animate(slides[previous].querySelector('.exhibit-copy'),[{opacity:1},{opacity:0}],{duration:135,fill:'both'});
      await out.finished.catch(()=>{});
      if(token!==revision) return;
      effects.forEach(effect=>effect.cancel());
      effects=[];
    }
    show(next);
    const incoming=slides[next];
    const incomingShell = incoming.querySelector('.device-shell');
    animate(incomingShell,[
      {opacity:.2,transform:`perspective(1100px) translateX(${direction*42}px) rotateY(${direction*15}deg) scale(.95)`},
      {opacity:1,transform:getComputedStyle(incomingShell).transform}
    ],{duration:435,easing:'cubic-bezier(.16,.8,.23,1)'});
    animate(incoming.querySelector('.exhibit-copy'),[
      {opacity:0,transform:'translateY(13px)',clipPath:'inset(0 0 12% 0)'},{opacity:1,transform:'translateY(0)',clipPath:'inset(0)'}
    ],{duration:460,easing:'cubic-bezier(.18,.78,.23,1)'});
  }

  const entryProject = new URLSearchParams(location.search).get('project');
  const entryIndex = slides.findIndex(slide => slide.id === 'collection-' + entryProject);
  if (entryIndex > 0) {
    requested = entryIndex;
    show(entryIndex);
    changeLight(entryIndex);
  }

  if ('IntersectionObserver' in window && !reduce.matches && stage.animate) {
    const entrance = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      entrance.disconnect();
      if (revision) return;
      animate(slides[visible].querySelector('.device-shell'), [
        {opacity:.15, transform:'perspective(1100px) translateY(32px) rotateY(-17deg) scale(.94)'},
        {opacity:1}
      ], {duration:680, easing:'cubic-bezier(.16,.8,.23,1)'});
    }, {threshold:.24});
    entrance.observe(stage);
  }

  tabs.forEach((tab,index)=>tab.addEventListener('click',()=>select(index)));
  gallery.querySelectorAll('[data-shift]').forEach(button=>{
    button.addEventListener('click',()=>select(requested+Number(button.dataset.shift)));
  });
  gallery.addEventListener('keydown',event=>{
    if(!event.target.closest('.device-tabs,.device-controls')) return;
    const keys={ArrowLeft:(requested-1+slides.length)%slides.length,ArrowRight:(requested+1)%slides.length,Home:0,End:slides.length-1};
    if(!Object.hasOwn(keys,event.key)) return;
    event.preventDefault();
    select(keys[event.key]);
    if(rail.contains(event.target)) tabs[keys[event.key]].focus({preventScroll:true});
  });
  new ResizeObserver(()=>markTab()).observe(rail);
  document.fonts?.ready.then(()=>markTab());
  let gesture = null;
  let dragged = false;

  function resetGesture() {
    gesture = null;
    stage.classList.remove('is-dragging');
    stage.style.removeProperty('--drag-x');
  }

  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (event.target.closest("a, button")) return;
    dragged = false;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
  });
  stage.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        resetGesture();
        return;
      }
      gesture.horizontal = true;
      dragged = true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
    }
    event.preventDefault();
    const limit = stage.clientWidth * .3;
    stage.style.setProperty('--drag-x', `${Math.max(-limit, Math.min(limit, dx * .65))}px`);
  });
  stage.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const threshold = Math.min(60, Math.max(36, stage.clientWidth * .12));
    const dy = event.clientY - gesture.y;
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.2) {
      dragged = true;
      select(requested + (dx < 0 ? 1 : -1));
    }
    resetGesture();
  });
  stage.addEventListener('pointercancel', resetGesture);
  stage.addEventListener('lostpointercapture', resetGesture);
  stage.addEventListener('dragstart', event => event.preventDefault());
  stage.addEventListener('click', event => {
    if (!dragged || event.detail === 0 || event.target.closest('a, button')) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  // Horizontal trackpad gestures use the same carousel as touch and drag.
  let wheelDistance = 0;
  let wheelLast = 0;
  let wheelSwitched = false;
  stage.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
    if (Math.abs(dx) <= Math.abs(event.shiftKey ? 0 : event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelLast > 180) {
      wheelDistance = 0;
      wheelSwitched = false;
    }
    wheelLast = now;
    if (wheelSwitched) return;
    wheelDistance += dx * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientWidth : 1);
    if (Math.abs(wheelDistance) < 45) return;
    select(requested + (wheelDistance > 0 ? 1 : -1));
    wheelSwitched = true;
  }, { passive: false });
}

})();
