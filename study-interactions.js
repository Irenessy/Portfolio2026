const tutor = document.querySelector('[data-xiaofei]');
if (tutor) {
  const chat = tutor.querySelector('.x-chat');
  const log = tutor.querySelector('.x-dialogue');
  const form = tutor.querySelector('.x-composer');
  const input = form.querySelector('input');
  const send = form.querySelector('button');
  const summon = tutor.querySelector('.x-call');
  const back = tutor.querySelector('[data-xback]');
  const reset = tutor.querySelector('[data-xreset]');
  const initial = { step:'exercise', round:0, messages:[], draft:'' };
  const history = [];
  let state = initial;

  function show(next, focus) {
    state = next;
    const talking = ['ask','hint','detail'].includes(state.step);
    chat.hidden = !talking;
    summon.hidden = talking;
    tutor.dataset.step = state.step;
    for (const panel of tutor.querySelectorAll('[data-xside]')) panel.hidden = panel.dataset.xside !== state.step;
    input.value = state.draft;
    send.disabled = !input.value.trim();
    back.disabled = history.length === 0;
    reset.disabled = state === initial;
    if (talking) {
      const fragment = document.createDocumentFragment();
      for (const message of [{who:'bot', text:log.dataset.welcome}, ...state.messages]) {
        const bubble = document.createElement('p');
        bubble.className = 'chat-line ' + message.who;
        bubble.textContent = message.text;
        fragment.append(bubble);
      }
      log.replaceChildren(fragment);
      log.scrollTop = log.scrollHeight;
    }
    if (focus === 'chat') (talking ? input : summon).focus({preventScroll:true});
    if (focus === 'guide') tutor.querySelector('[data-xside]:not([hidden]) h3').focus({preventScroll:true});
  }

  function advance(patch, focus) {
    history.push({...state, draft:input.value});
    show({...state, draft:input.value, ...patch}, focus);
  }

  input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.isComposing || event.keyCode === 229)) event.preventDefault();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (text) advance({messages:[...state.messages,{who:'student',text}], draft:''}, 'chat');
  });
  tutor.addEventListener('click', event => {
    const btn = event.target.closest('button');
    if (!btn || btn.disabled || form.contains(btn)) return;
    if (btn === reset) { history.length = 0; show(initial,'guide'); return; }
    if (btn === back) { if (history.length) show(history.pop(),'guide'); return; }
    const next = btn.hasAttribute('data-close-chat') ? 'practice' : btn.dataset.step;
    const focus = btn.closest('.x-tablet') ? 'chat' : 'guide';
    if (btn.hasAttribute('data-focus-question')) {input.focus();return;}
    if (next === 'hint' || next === 'detail') {
      const [q,a] = state.round ? [log.dataset.follow,log.dataset.hint] : [log.dataset.question,log.dataset.reply];
      advance({step:next,round:state.round+1,messages:[...state.messages,{who:'student',text:q},{who:'bot',text:a}]},focus);
    } else if (next) {
      const step = next === 'ask' ? ['ask','hint','detail'][state.round] : next;
      advance({step},focus);
    }
  });
  tutor.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.isComposing && !chat.hidden) advance({step:'practice'},'chat');
  });
}

const rail = document.querySelector('[data-rail-demo]');
if (rail) {
  const body = rail.querySelector('#rail-connection');
  const controls = [...rail.querySelectorAll('[data-disclosure]')];
  const side = rail.querySelector('[data-open-label]');
  const scroller = rail.querySelector('.r-scroll');
  const route = rail.querySelector('.r-route');
  const selector = rail.querySelector('.r-select select');
  const dates = rail.querySelector('.r-days');
  const calendar = rail.querySelector('input[type=date]');
  const locale = document.documentElement.lang;
  const choices = [
    {leave:'14:01', arrive:'15:11', wait:35},
    {leave:'14:31', arrive:'15:41', wait:65}
  ];

  for (const button of controls) {
    button.addEventListener('click', () => {
      const open = body.hidden;
      body.hidden = !open;
      for (const control of controls) control.setAttribute('aria-expanded', String(open));
      side.textContent = open ? side.dataset.closeLabel : side.dataset.openLabel;
      if (button === side) {
        const rowOffset = controls[0].getBoundingClientRect().top - scroller.getBoundingClientRect().top;
        if (rowOffset < route.offsetHeight || rowOffset > scroller.clientHeight - 80) {
          scroller.scrollTop += rowOffset - route.offsetHeight;
        }
      }
    });
  }
  selector.addEventListener('change', () => {
    const choice = choices[selector.selectedIndex];
    for (const [key, value] of Object.entries(choice)) {
      rail.querySelectorAll('[data-' + key + ']').forEach(el => el.textContent = value);
    }
  });

  const iso = d => d.toISOString().slice(0,10);
  const dayFormat = new Intl.DateTimeFormat(locale, {weekday:'short', timeZone:'UTC'});
  const monthFormat = new Intl.DateTimeFormat(locale, {month:'short', timeZone:'UTC'});
  function selectDate(value) {
    const date = new Date(value + 'T12:00:00Z');
    if (isNaN(date) || value < calendar.min || value > calendar.max) return;
    calendar.value = value;
    rail.querySelector('[data-month]').textContent = monthFormat.format(date);
    if (![...dates.children].some(btn => btn.dataset.day === value)) {
      const group = document.createDocumentFragment();
      for (let offset = -1; offset <= 5; offset++) {
        const day = new Date(date);
        day.setUTCDate(day.getUTCDate() + offset);
        const key = iso(day);
        if (key < calendar.min || key > calendar.max) continue;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.day = key;
        btn.append(document.createElement('small'), document.createElement('b'));
        btn.firstChild.textContent = dayFormat.format(day);
        btn.lastChild.textContent = day.getUTCDate();
        group.append(btn);
      }
      dates.replaceChildren(group);
    }
    for (const button of dates.children) {
      button.setAttribute('aria-pressed', String(button.dataset.day === value));
      button.setAttribute('aria-label', button.dataset.day);
      if (button.dataset.day === value) dates.scrollLeft += button.getBoundingClientRect().left - dates.getBoundingClientRect().left - (dates.clientWidth-button.offsetWidth)/2;
    }
  }
  dates.addEventListener('click', event => {
    const button = event.target.closest('[data-day]');
    if (button) selectDate(button.dataset.day);
  });
  calendar.addEventListener('change', () => selectDate(calendar.value));
  selectDate(calendar.value);
}
