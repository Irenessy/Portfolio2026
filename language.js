const languageMenu = document.querySelector('.language-menu');
const languageSummary = languageMenu.querySelector('summary');
const languageLinks = [...languageMenu.querySelectorAll('[data-locale]')].map(link => ({
  link,
  href: link.getAttribute('href'),
}));

function preserveSection() {
  const section = window.location.hash;
  const project = new URLSearchParams(location.search).get('project');
  const selection = document.querySelector('[data-device-gallery]') && project ? '?project=' + encodeURIComponent(project) : '';
  for (const { link, href } of languageLinks) {
    link.setAttribute('href', href + selection + section);
  }
}

preserveSection();
window.addEventListener('hashchange', preserveSection);

document.addEventListener('click', event => {
  if (!languageMenu.contains(event.target)) languageMenu.open = false;
});

languageMenu.addEventListener('keydown', event => {
  if (event.key === 'Escape' && languageMenu.open) {
    languageMenu.open = false;
    languageSummary.focus();
  }
});
