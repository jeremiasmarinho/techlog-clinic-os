// ============================================
// WhatsApp Templates - Shared Helper
// ============================================

interface WhatsAppLead {
    name: string;
    phone: string;
    appointment_date?: string;
    doctor?: string;
}

interface WhatsAppTemplate {
    label: string;
    url: string;
}

interface WhatsAppTemplates {
    primeiroContato: WhatsAppTemplate;
    lembrete: WhatsAppTemplate;
    posAtendimento: WhatsAppTemplate;
    confirmar: WhatsAppTemplate;
}

/**
 * Generate WhatsApp message templates for a lead/patient
 */
function getWhatsAppTemplates(lead: WhatsAppLead): WhatsAppTemplates {
    const name: string = lead.name;
    const phone: string = lead.phone.replace(/\D/g, '');

    let appointmentDateLabel: string = '';
    let appointmentTimeLabel: string = '';
    let appointmentInfo: string = '';
    if (lead.appointment_date) {
        const date: Date = new Date(lead.appointment_date);
        appointmentDateLabel = date.toLocaleDateString('pt-BR');
        appointmentTimeLabel = date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
        appointmentInfo = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return {
        primeiroContato: {
            label: '📞 Primeiro Contato',
            url: `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá *${name}*! 👋\n\nAqui é da *Clínica [Nome]*.\n\nVi que você tem interesse em agendar uma consulta. Posso te ajudar?\n\nEstou à disposição! 😊`)}`,
        },
        lembrete: {
            label: '📅 Lembrete de Consulta',
            url: `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá *${name}*! 👋\n\nPassando para lembrar da sua consulta${appointmentInfo ? ` agendada para *${appointmentInfo}*` : ''}.\n\nTudo confirmado? Se precisar remarcar, é só avisar! 😊`)}`,
        },
        posAtendimento: {
            label: '⭐ Pós-Atendimento',
            url: `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá *${name}*! 😊\n\nEsperamos que tenha gostado do atendimento.\n\nSua opinião é muito importante para nós! Poderia avaliar nosso serviço?\n\nObrigado pela confiança! 🙏`)}`,
        },
        confirmar: {
            label: '✅ Confirmar Agendamento',
            url: `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá ${name}, confirmamos sua consulta${appointmentDateLabel ? ` para ${appointmentDateLabel}` : ''}${appointmentTimeLabel ? ` às ${appointmentTimeLabel}` : ''}.`)}`,
        },
    };
}

/**
 * Open WhatsApp menu with template options
 */
function openWhatsAppMenu(
    buttonElement: HTMLElement,
    lead: WhatsAppLead,
    containerElement: HTMLElement
): void {
    // Check if menu is already open for this container
    const existingMenu: HTMLElement | null = containerElement.querySelector('.whatsapp-menu');
    if (existingMenu) {
        // Toggle: close the menu if it's already open
        existingMenu.remove();
        containerElement.style.zIndex = '';
        return;
    }

    // Close any other open menus
    document.querySelectorAll('.whatsapp-menu').forEach((menu: Element) => {
        const parent: HTMLElement | null = menu.parentElement;
        menu.remove();
        if (parent) parent.style.zIndex = '';
    });

    const templates: WhatsAppTemplates = getWhatsAppTemplates(lead);

    // Create menu
    const menu: HTMLDivElement = document.createElement('div');
    menu.className =
        'whatsapp-menu absolute right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[220px]';
    menu.innerHTML = `
        ${Object.values(templates)
            .map(
                (template: WhatsAppTemplate) => `
            <a href="${template.url}" target="_blank" 
               class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition">
                ${template.label}
            </a>
        `
            )
            .join('')}
    `;

    // Position menu relative to button
    const buttonRect: DOMRect = buttonElement.getBoundingClientRect();
    const containerRect: DOMRect = containerElement.getBoundingClientRect();

    menu.style.position = 'absolute';
    menu.style.top = buttonRect.bottom - containerRect.top + 5 + 'px';
    menu.style.right = '10px';
    menu.style.zIndex = '9999';

    // Ensure container has relative position and high z-index when menu is open
    containerElement.style.position = 'relative';
    containerElement.style.zIndex = '1000';
    containerElement.appendChild(menu);

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e: MouseEvent): void {
            const target = e.target as Node;
            // Don't close if clicking inside the menu
            if (!menu.contains(target) && target !== buttonElement) {
                menu.remove();
                containerElement.style.zIndex = '';
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// Expose globals for cross-file access (IIFE isolation)
(window as unknown as Record<string, unknown>).openWhatsAppMenu = openWhatsAppMenu;
(window as unknown as Record<string, unknown>).getWhatsAppTemplates = getWhatsAppTemplates;
