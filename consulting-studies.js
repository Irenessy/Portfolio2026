(() => {
  document.querySelectorAll('[data-dependency-board]').forEach(board => {
    const buttons = [...board.querySelectorAll('[data-dependency]')];
    const panels = [...board.querySelectorAll('[data-dependency-panel]')];
    buttons.forEach(button => button.addEventListener('click', () => {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      panels.forEach(panel => { panel.hidden = panel.dataset.dependencyPanel !== button.dataset.dependency; });
    }));
  });
  const experiment = document.querySelector('.cost-experiment');
  if (!experiment) return;
  const locale = document.documentElement.lang;
  const labels = locale === 'en'
    ? ['Route B has the lower cost per click.', 'Route A has the lower media cost per registration.']
    : locale === 'zh-CN'
      ? ['只比较点击，链路 B 的单价更低。', '按每个注册计算，链路 A 的媒体成本更低。']
      : ['只比較點擊，鏈路 B 的單價更低。', '按每個註冊計算，鏈路 A 的媒體成本更低。'];
  experiment.querySelectorAll('[data-cost-mode]').forEach(button => button.addEventListener('click', () => {
    const registration = button.dataset.costMode === 'registration';
    experiment.querySelectorAll('[data-cost-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const values = registration ? [3 / .9 / .1, 2 / .5 / .1] : [3, 2];
    experiment.querySelector('[data-cost-value="a"]').textContent = `¥${values[0].toFixed(registration ? 1 : 0)}`;
    experiment.querySelector('[data-cost-value="b"]').textContent = `¥${values[1].toFixed(registration ? 1 : 0)}`;
    experiment.querySelector('[data-cost-caption]').textContent = labels[registration ? 1 : 0];
    experiment.dataset.metric = registration ? 'registration' : 'click';
  }));
})();
