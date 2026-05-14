document.addEventListener('DOMContentLoaded', () => {
  // Thème
  const themeToggle = document.querySelector('.theme-toggle');
  const navLogo = document.getElementById('navLogo');
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  };
  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    if (themeToggle) themeToggle.querySelector('i').className = t === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    if (navLogo) navLogo.src = t === 'dark' ? 'ico/CEAOB.webp' : 'ico/CEAON.webp';
  };
  applyTheme(getInitialTheme());
  if (themeToggle) themeToggle.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // Hamburger
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('#nav-menu-list');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', navMenu.classList.contains('active'));
    });
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
