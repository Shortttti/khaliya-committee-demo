// Demo public pages: local account flow only; no Firestore connection.
const $ = (selector, root = document) => root.querySelector(selector);

document.querySelector('[data-nav-toggle]')?.addEventListener('click', () => document.body.classList.toggle('nav-open'));
document.querySelectorAll('.site-nav a[href^="#"]').forEach(link => link.addEventListener('click', () => document.body.classList.remove('nav-open')));

if (document.body.classList.contains('public-page')) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = [...document.querySelectorAll('.hero-copy,.hero-visual,.trust-inner,.section-heading,.feature-card,.workflow-layout>*,.workflow-list li,.role-grid article,.security-inner>*,.closing-cta>*')];
  if (!reduced && 'IntersectionObserver' in window) {
    document.body.classList.add('motion-ready');
    targets.forEach((element, index) => {
      element.dataset.reveal = 'pending';
      element.style.setProperty('--reveal-delay', (index % 4) * 55 + 'ms');
    });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.dataset.reveal = 'visible';
        observer.unobserve(entry.target);
      }
    }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(element => observer.observe(element));
  }
}
