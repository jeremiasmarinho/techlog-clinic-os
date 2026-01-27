/**
 * js/site/main.js
 * Animações e Scroll da Landing Page
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 2. Animação de Entrada (Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0', 'translate-y-10');
                observer.unobserve(entry.target); // Anima só uma vez
            }
        });
    }, { threshold: 0.1 });

    // Aplica a todos os cards
    document.querySelectorAll('.glass-card').forEach(card => {
        card.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
        observer.observe(card);
    });
});