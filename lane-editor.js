function initLaneEditor(editor) {
  const tiles = Array.from(editor.querySelectorAll('[data-move]'));
  const lanes = Array.from(editor.querySelectorAll('[data-lane]'));
  const status = editor.querySelector('[role="status"]');
  const undo = editor.querySelector('[data-undo]');
  const reset = editor.querySelector('[data-restart]');
  const words = editor.dataset;
  const initialHint = status.textContent;
  const history = [];
  let picked = null;
  let drag = null;
  let over = null;
  let swallowPointerClick = false;

  function setPicked(tile) {
    picked = tile;
    tiles.forEach(item => item.setAttribute('aria-pressed', String(item === tile)));
    editor.classList.toggle('is-aiming', Boolean(tile || drag?.moving));
  }

  function highlight(lane) {
    if (over === lane) return;
    over?.classList.remove('is-over');
    over = lane;
    over?.classList.add('is-over');
  }

  function renderLane(lane, movement) {
    const tile = tiles.find(item => item.dataset.move === movement);
    lane.querySelector('.lane-glyph').replaceWith(tile.firstElementChild.cloneNode(true));
    lane.dataset.current = movement;
    lane.classList.toggle('is-changed', movement !== lane.dataset.initial);
    lane.title = lane.dataset.name + ' · ' + tile.getAttribute('aria-label');
    lane.setAttribute('aria-label', lane.title);
  }

  function updateHistoryButtons() {
    undo.disabled = history.length === 0;
    reset.disabled = !lanes.some(lane => lane.dataset.current !== lane.dataset.initial);
  }

  function apply(tile, lane) {
    const movement = tile.dataset.move;
    if (movement !== lane.dataset.current) {
      history.push({lane, before: lane.dataset.current});
      renderLane(lane, movement);
    }
    setPicked(null);
    status.textContent = words.lead + ' · ' + lane.title;
    updateHistoryButtons();
  }

  function hitLane(x, y) {
    const lane = document.elementFromPoint(x, y)?.closest('[data-lane]');
    return lane && editor.contains(lane) ? lane : null;
  }

  function endDrag() {
    if (!drag) return;
    const {tile, id, ghost} = drag;
    drag = null;
    ghost?.remove();
    tile.classList.remove('is-held');
    if (tile.hasPointerCapture(id)) tile.releasePointerCapture(id);
    highlight(null);
    editor.classList.toggle('is-aiming', Boolean(picked));
  }

  function cancel() {
    const active = drag || picked;
    if (drag) swallowPointerClick = true;
    endDrag();
    setPicked(null);
    if (active) status.textContent = words.cancel;
  }

  for (const tile of tiles) {
    tile.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary || drag) return;
      swallowPointerClick = false;
      drag = {tile, id: event.pointerId, x: event.clientX, y: event.clientY, moving: false};
      tile.setPointerCapture(event.pointerId);
    });
    tile.addEventListener('pointermove', event => {
      if (drag?.id !== event.pointerId) return;
      if (!drag.moving && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5) return;
      if (!drag.moving) {
        drag.moving = true;
        setPicked(null);
        tile.classList.add('is-held');
        drag.ghost = document.createElement('div');
        drag.ghost.className = 'lane-ghost';
        drag.ghost.setAttribute('aria-hidden', 'true');
        drag.ghost.append(tile.firstElementChild.cloneNode(true));
        document.body.append(drag.ghost);
      }
      drag.ghost.style.transform = 'translate(' + (event.clientX + 9) + 'px,' + (event.clientY - 48) + 'px)';
      highlight(hitLane(event.clientX, event.clientY));
    });
    tile.addEventListener('pointerup', event => {
      if (drag?.id !== event.pointerId) return;
      const moved = drag.moving || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 5;
      const lane = moved ? hitLane(event.clientX, event.clientY) : null;
      swallowPointerClick = moved;
      endDrag();
      if (lane) apply(tile, lane);
      else if (moved) {
        setPicked(null);
        status.textContent = words.cancel;
      }
    });
    for (const type of ['pointercancel', 'lostpointercapture']) {
      tile.addEventListener(type, event => { if (drag?.id === event.pointerId) cancel(); });
    }
    tile.addEventListener('click', event => {
      if (event.detail && swallowPointerClick) {
        swallowPointerClick = false;
        return;
      }
      setPicked(picked === tile ? null : tile);
      status.textContent = picked
        ? words.chosen + ' · ' + tile.getAttribute('aria-label') + ' · ' + words.pending
        : initialHint;
      if (picked && event.detail === 0) lanes[0].focus({preventScroll: true});
    });
    tile.addEventListener('contextmenu', event => event.preventDefault());
  }

  lanes.forEach(lane => lane.addEventListener('click', () => {
    if (picked) apply(picked, lane);
  }));
  undo.addEventListener('click', () => {
    const last = history.pop();
    if (!last) return;
    setPicked(null);
    renderLane(last.lane, last.before);
    status.textContent = words.undone + ' ' + last.lane.title;
    updateHistoryButtons();
  });
  reset.addEventListener('click', () => {
    setPicked(null);
    lanes.forEach(lane => renderLane(lane, lane.dataset.initial));
    history.length = 0;
    status.textContent = words.restored;
    updateHistoryButtons();
  });
  editor.addEventListener('keydown', event => {
    if (event.key === 'Escape' && (picked || drag)) {
      event.preventDefault();
      const source = drag?.tile || picked;
      cancel();
      source.focus({preventScroll: true});
    }
  });
}

document.querySelectorAll('[data-lane-editor]').forEach(initLaneEditor);
