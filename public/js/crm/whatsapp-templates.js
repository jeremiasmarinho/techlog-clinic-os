// ============================================
// WhatsApp Templates - Shared Helper
// ============================================

/**
 * Generate WhatsApp message templates for a lead/patient
 * @param {Object} lead - Lead/patient data with name, phone, appointment_date, doctor
 * @returns {Object} - Object with template configurations
 */
function getWhatsAppTemplates(lead) {
    const name = lead.name;
    const phone = lead.phone.replace(/\D/g, '');
    
    let appointmentInfo = '';
    if (lead.appointment_date) {
        const date = new Date(lead.appointment_date);
        appointmentInfo = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    return {
        primeiroContato: {
            label: '📞 Primeiro Contato',
            url: `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá *${name}*! 👋\n\nAqui é da *Clínica [Nome]*.\n\nVi que você tem interesse em agendar uma consulta. Posso te ajudar?\n\nEstou à disposição! 😊`)}`
        },
        lembrete: {
            label: '📅 Lembrete de Consulta',
            url: `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá *${name}*! 👋\n\nPassando para lembrar da sua consulta${appointmentInfo ? ` agendada para *${appointmentInfo}*` : ''}.\n\nTudo confirmado? Se precisar remarcar, é só avisar! 😊`)}`
        },
        posAtendimento: {
            label: '⭐ Pós-Atendimento',
            url: `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá *${name}*! 😊\n\nEsperamos que tenha gostado do atendimento.\n\nSua opinião é muito importante para nós! Poderia avaliar nosso serviço?\n\nObrigado pela confiança! 🙏`)}`
        },
        confirmar: {
            label: '✅ Confirmar Agendamento',
            url: `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá *${name}*, tudo bem?\n\nGostaria de confirmar seu agendamento${appointmentInfo ? ` para *${appointmentInfo}*` : ''}.\n\nAguardo sua confirmação! 😊`)}`
        }
    };
}

/**
 * Open WhatsApp menu with template options
 * @param {HTMLElement} buttonElement - The button that was clicked
 * @param {Object} lead - Lead/patient data
 * @param {HTMLElement} containerElement - Container element to append menu to
 */
function openWhatsAppMenu(buttonElement, lead, containerElement) {
    // Check if menu is already open for this container
    const existingMenu = containerElement.querySelector('.whatsapp-menu');
    if (existingMenu) {
        // Toggle: close the menu if it's already open
        existingMenu.remove();
        containerElement.style.zIndex = '';
        return;
    }
    
    // Close any other open menus
    document.querySelectorAll('.whatsapp-menu').forEach(menu => {
        const parent = menu.parentElement;
        menu.remove();
        if (parent) parent.style.zIndex = '';
    });
    
    const templates = getWhatsAppTemplates(lead);
    
    // Create menu
    const menu = document.createElement('div');
    menu.className = 'whatsapp-menu absolute right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[220px]';
    menu.innerHTML = `
        ${Object.values(templates).map(template => `
            <a href="${template.url}" target="_blank" 
               class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 transition">
                ${template.label}
            </a>
        `).join('')}
    `;
    
    // Position menu relative to button
    const buttonRect = buttonElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    
    menu.style.position = 'absolute';
    menu.style.top = (buttonRect.bottom - containerRect.top + 5) + 'px';
    menu.style.right = '10px';
    menu.style.zIndex = '9999';
    
    // Ensure container has relative position and high z-index when menu is open
    containerElement.style.position = 'relative';
    containerElement.style.zIndex = '1000';
    containerElement.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            // Don't close if clicking inside the menu
            if (!menu.contains(e.target) && e.target !== buttonElement) {
                menu.remove();
                containerElement.style.zIndex = '';
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}
