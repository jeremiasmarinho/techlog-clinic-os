/**
 * js/site/main.ts
 * Animações e Scroll da Landing Page
 */

// Declaração global para toggleFaq (usada no HTML via onclick)
declare global {
    interface Window {
        toggleFaq: (element: HTMLElement) => void;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Suave
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e: Event) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (!href) return;
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 2. Animação de Entrada (Intersection Observer)
    const observer = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                    observer.unobserve(entry.target); // Anima só uma vez
                }
            });
        },
        { threshold: 0.1 }
    );

    // Aplica a todos os cards
    document.querySelectorAll('.glass-card').forEach((card) => {
        card.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
        observer.observe(card);
    });
});

// 3. Toggle FAQ (Accordion)
function toggleFaq(element: HTMLElement): void {
    const answer = element.querySelector('.faq-answer') as HTMLElement | null;
    const icon = element.querySelector('.faq-icon') as HTMLElement | null;
    if (!answer || !icon) return;

    const isOpen = !answer.classList.contains('hidden');

    if (isOpen) {
        // Fechar
        answer.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Abrir
        answer.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    }
}

window.toggleFaq = toggleFaq;
