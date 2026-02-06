/**
 * Chat Widget - Agendamento via Chat Interativo
 * Máquina de estados para coleta de dados do paciente
 */

// Tipos do widget de chat
type ChatState =
    | 'IDLE'
    | 'WAITING_SPECIALTY'
    | 'WAITING_PAYMENT'
    | 'WAITING_PERIOD'
    | 'WAITING_DAY'
    | 'WAITING_NAME'
    | 'WAITING_PHONE'
    | 'FINISHED';

interface ChatOption {
    text: string;
    value: string;
}

interface UserLead {
    specialty: string;
    payment: string;
    period: string;
    day: string;
    name: string;
    phone: string;
}

declare global {
    interface Window {
        toggleChat: () => void;
        openChat: () => void;
        closeChat: () => void;
        sendMessage: () => void;
    }
}

// Estado do chat
let isChatOpen = false;
let hasInteraction = false;
let chatState: ChatState = 'IDLE';
let userLead: UserLead = {
    specialty: '',
    payment: '',
    period: '',
    day: '',
    name: '',
    phone: '',
};

/**
 * Salva o lead no sistema via API
 */
async function saveLeadToSystem(leadData: UserLead): Promise<void> {
    try {
        const type = `Consulta - ${leadData.specialty} - ${leadData.payment} - ${leadData.period} - ${leadData.day}`;

        const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: leadData.name,
                phone: leadData.phone,
                type: type,
                source: 'chat_widget',
            }),
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar lead');
        }
    } catch (error) {
        // Silently fail - the lead data is already shown in chat
    }
}

function updateState(newState: ChatState): void {
    chatState = newState;
}

function processUserInput(text: string): void {
    addUserMessage(text);

    switch (chatState) {
        case 'WAITING_NAME':
            userLead.name = text;
            updateState('WAITING_PHONE');
            addBotMessage('Ótimo! Agora me informe seu **telefone** com DDD:');
            break;

        case 'WAITING_PHONE':
            userLead.phone = text;
            updateState('FINISHED');

            addBotMessage(
                `Perfeito! Vou resumir seu agendamento:\n\n` +
                    `📋 **Especialidade:** ${userLead.specialty}\n` +
                    `💳 **Pagamento:** ${userLead.payment}\n` +
                    `🕐 **Período:** ${userLead.period}\n` +
                    `📅 **Dia:** ${userLead.day}\n` +
                    `👤 **Nome:** ${userLead.name}\n` +
                    `📱 **Telefone:** ${userLead.phone}\n\n` +
                    `✅ Entraremos em contato em breve para confirmar!`
            );

            saveLeadToSystem(userLead);
            break;

        default:
            addBotMessage('Por favor, selecione uma das opções acima. 👆');
            break;
    }
}

function handleOption(opt: string, parentDiv: HTMLElement): void {
    // Desabilitar botões após seleção
    const buttons = parentDiv.querySelectorAll('button');
    buttons.forEach((btn) => {
        (btn as HTMLButtonElement).disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    });

    addUserMessage(opt);

    switch (chatState) {
        case 'IDLE':
        case 'WAITING_SPECIALTY':
            userLead.specialty = opt;
            updateState('WAITING_PAYMENT');
            showOptions([
                { text: '💵 Particular', value: 'Particular' },
                { text: '🏥 Plano de Saúde', value: 'Plano de Saúde' },
            ]);
            addBotMessage('Qual a forma de pagamento?');
            break;

        case 'WAITING_PAYMENT':
            userLead.payment = opt;
            updateState('WAITING_PERIOD');
            showOptions([
                { text: '🌅 Manhã', value: 'Manhã' },
                { text: '🌇 Tarde', value: 'Tarde' },
                { text: '🤷 Qualquer', value: 'Qualquer horário' },
            ]);
            addBotMessage('Qual período você prefere?');
            break;

        case 'WAITING_PERIOD':
            userLead.period = opt;
            updateState('WAITING_DAY');
            showOptions([
                { text: '📅 Seg-Sex', value: 'Segunda a Sexta' },
                { text: '📅 Sábado', value: 'Sábado' },
                { text: '🤷 Qualquer', value: 'Qualquer dia' },
            ]);
            addBotMessage('Qual dia da semana?');
            break;

        case 'WAITING_DAY':
            userLead.day = opt;
            updateState('WAITING_NAME');
            addBotMessage('Qual seu **nome completo**?');
            break;

        default:
            break;
    }
}

function formatText(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

function addBotMessage(text: string): void {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'flex gap-2 items-start';
    div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm flex-shrink-0">🤖</div>
        <div class="bg-gray-700 rounded-lg rounded-tl-none px-4 py-2 max-w-[80%] text-sm text-gray-100">
            ${formatText(text)}
        </div>
    `;
    container.appendChild(div);
    scrollToBottom();
}

function addUserMessage(text: string): void {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'flex gap-2 items-start justify-end';
    div.innerHTML = `
        <div class="bg-cyan-600 rounded-lg rounded-tr-none px-4 py-2 max-w-[80%] text-sm text-white">
            ${formatText(text)}
        </div>
    `;
    container.appendChild(div);
    scrollToBottom();
}

function showOptions(options: ChatOption[]): void {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'flex flex-wrap gap-2 my-2 px-10';

    options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className =
            'bg-gray-600 hover:bg-cyan-600 text-white text-xs px-3 py-2 rounded-lg transition-colors';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => handleOption(opt.value, optionsDiv));
        optionsDiv.appendChild(btn);
    });

    container.appendChild(optionsDiv);
    scrollToBottom();
}

function showTyping(): void {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.id = 'typingIndicator';
    div.className = 'flex gap-2 items-start';
    div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm flex-shrink-0">🤖</div>
        <div class="bg-gray-700 rounded-lg rounded-tl-none px-4 py-2 text-sm text-gray-400">
            <span class="animate-pulse">Digitando...</span>
        </div>
    `;
    container.appendChild(div);
    scrollToBottom();
}

function removeTyping(): void {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function scrollToBottom(): void {
    const container = document.getElementById('chatMessages');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// Funções globais de controle do chat
window.toggleChat = function (): void {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;

    isChatOpen = !isChatOpen;
    chatContainer.classList.toggle('hidden', !isChatOpen);

    if (isChatOpen && !hasInteraction) {
        hasInteraction = true;
        chatState = 'WAITING_SPECIALTY';

        setTimeout(() => {
            showTyping();
            setTimeout(() => {
                removeTyping();
                addBotMessage(
                    'Olá! 👋 Sou o assistente virtual.\nVou ajudar você a **agendar sua consulta**.'
                );
                setTimeout(() => {
                    addBotMessage('Qual **especialidade** você precisa?');
                    showOptions([
                        { text: '🦷 Odontologia', value: 'Odontologia' },
                        { text: '👁️ Oftalmologia', value: 'Oftalmologia' },
                        { text: '🧠 Neurologia', value: 'Neurologia' },
                        { text: '❤️ Cardiologia', value: 'Cardiologia' },
                        { text: '🩺 Clínico Geral', value: 'Clínico Geral' },
                    ]);
                }, 500);
            }, 1000);
        }, 300);
    }
};

window.openChat = function (): void {
    isChatOpen = true;
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) chatContainer.classList.remove('hidden');
};

window.closeChat = function (): void {
    isChatOpen = false;
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) chatContainer.classList.add('hidden');
};

window.sendMessage = function (): void {
    const input = document.getElementById('chatInput') as HTMLInputElement | null;
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    processUserInput(text);
};
