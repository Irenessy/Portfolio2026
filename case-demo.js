for (const demo of document.querySelectorAll('[data-demo]')) {
  const states = new Map([...demo.querySelectorAll('[data-state]')].map(item => [item.dataset.state, item]));
  const back = demo.querySelector('[data-back]');
  const reset = demo.querySelector('[data-reset]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 'start';
  let history = [];
  function display(next, focus) {
    const old = states.get(current);
    const active = states.get(next);
    old.hidden = true;
    active.hidden = false;
    current = next;
    back.disabled = !history.length;
    reset.disabled = current === 'start';
    if (focus) active.querySelector('h3').focus({preventScroll:true});
    if (reduce.matches || !active.animate) return;
    active.querySelector('.demo-insight').animate([{opacity:.45,translate:'0 5px'},{opacity:1,translate:'0 0'}],{duration:220});
    if (demo.dataset.demo === 'eurostar') {
      const opening = next === 'open';
      active.querySelector('.demo-transfer').animate([
        {gridTemplateRows:opening?'0fr':'1fr'}, {gridTemplateRows:opening?'1fr':'0fr'}
      ],{duration:340,easing:'cubic-bezier(.2,.75,.2,1)'});
    } else {
      active.querySelector('.demo-image').animate([{opacity:.58,scale:'.982'}, {opacity:1,scale:'1'}],{duration:260,easing:'ease-out'});
    }
  }
  demo.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if (!button || button.disabled) return;
    if (button === reset) {history=[];display('start',true);return;}
    if (button === back) {if(history.length)display(history.pop(),true);return;}
    const next=button.dataset.dest;
    if (!states.has(next)) return;
    if (next==='start') history=[]; else history.push(current);
    display(next,true);
  });
}
