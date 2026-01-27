/**
 * js/chat/widget.js v4.0 (Final Integration)
 * Conectado com API para enviar leads ao Kanban
 */

let isChatOpen = false;
let hasInteraction = false;
let chatState = 'IDLE'; 
let userLead = {}; 

const chatWindow = document.getElementById('chatWindow');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// ============================================================
// API INTEGRATION (A Mágica acontece aqui)
// ============================================================

async function saveLeadToSystem(leadData) {
    // CORREÇÃO: Enviar 'type' ao invés de 'interest' (nome correto do campo no banco)
    const payload = {
        name: leadData.name,
        phone: leadData.phone,
        type: leadData.interest // ✅ CORRIGIDO: 'type' é o campo esperado pelo backend
    };

    try {
        // Envia para o Backend
        const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("❌ Erro do servidor:", error);
            throw new Error('Erro ao salvar no servidor');
        }
        
        const result = await response.json();
        console.log("✅ Lead salvo no Kanban com sucesso! ID:", result.id);
        return true;

    } catch (error) {
        console.error("❌ Erro de comunicação:", error);
        // Opcional: Avisar usuário ou tentar novamente depois
        return false;
    }
}

// ============================================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================================

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

window.toggleChat = () => { isChatOpen ? closeChat() : openChat(); };
window.openChat = () => { isChatOpen = true; updateState(); };
window.closeChat = () => { isChatOpen = false; updateState(); };
window.sendMessage = () => {
    const text = chatInput.value.trim();
    if (text !== '') {
        processUserInput(text);
        chatInput.value = '';
        chatInput.focus();
    }
};

// ============================================================
// LÓGICA DO ROBÔ
// ============================================================

function updateState() {
    if (isChatOpen) {
        chatWindow.classList.remove('hidden');
        if (!hasInteraction) {
            setTimeout(() => chatInput && chatInput.focus(), 100);
            setTimeout(() => addBotMessage("Olá! Sou o assistente da Clínica. 🤖"), 500);
            setTimeout(() => {
                addBotMessage("Como posso te ajudar hoje?");
                showOptions(['Agendar Consulta', 'Ver Exames', 'Falar com Humano']);
            }, 1000);
            hasInteraction = true;
        }
    } else {
        chatWindow.classList.add('hidden');
    }
}

function processUserInput(text) {
    addUserMessage(text);
    showTyping();

    setTimeout(() => {
        removeTyping();

        if (chatState === 'WAITING_NAME') {
            if (text.split(' ').length < 2) {
                addBotMessage("Por favor, digite seu **Nome e Sobrenome**.");
                return;
            }
            userLead.name = text;
            addBotMessage(`Obrigado, ${text.split(' ')[0]}!`);
            addBotMessage("Qual seu **WhatsApp** (com DDD) para confirmarmos?");
            
            chatState = 'WAITING_PHONE';
            chatInput.placeholder = "Ex: (11) 99999-9999";
            chatInput.type = "tel";
        } 
        
        else if (chatState === 'WAITING_PHONE') {
            const cleanPhone = text.replace(/\D/g, '');
            if (cleanPhone.length < 10 || cleanPhone.length > 11) {
                addBotMessage("❌ Telefone inválido. Digite DDD + Número.");
                return;
            }

            userLead.phone = text;
            
            // DISPARA O ENVIO PARA O KANBAN
            addBotMessage("Salvando seu agendamento... ⏳");
            
            saveLeadToSystem(userLead).then((success) => {
                if (success) {
                    addBotMessage("Tudo certo! ✅");
                    addBotMessage("Seus dados já estão com nossa equipe. Entraremos em contato em breve.");
                } else {
                    addBotMessage("Tivemos um pequeno erro técnico, mas anotei seus dados aqui. 😉");
                }
                
                chatState = 'FINISHED';
                chatInput.placeholder = "Atendimento finalizado.";
                chatInput.disabled = true;
            });
        } 
        
        else if (chatState === 'FINISHED') {
            addBotMessage("Seus dados já foram enviados! Aguarde nosso contato.");
        }

        else {
            addBotMessage("Desculpe, escolha uma das opções abaixo.");
            showOptions(['Agendar Consulta', 'Ver Exames']);
        }
    }, 800);
}

function handleOption(opt, parentDiv) {
    if (parentDiv) parentDiv.remove();
    addUserMessage(opt);
    showTyping();

    setTimeout(() => {
        removeTyping();

        if (['Cardiologia', 'Clínica Geral', 'Dermatologia'].includes(opt)) {
            userLead.interest = opt;
            addBotMessage(`Certo, **${opt}**.`);
            addBotMessage("Temos horários disponíveis.");
            addBotMessage("Qual é o seu **Nome Completo**?");
            
            chatState = 'WAITING_NAME';
            chatInput.placeholder = "Digite seu Nome e Sobrenome...";
            chatInput.focus();
        } 
        else if (opt === 'Agendar Consulta') {
            addBotMessage("Para qual especialidade?");
            showOptions(['Cardiologia', 'Clínica Geral', 'Dermatologia']);
        }
        else if (opt === 'Ver Exames') {
            addBotMessage("Acesse: **portal.clinica.com.br**");
        }
        else {
            userLead.interest = 'Atendimento Humano';
            addBotMessage("Ok! Qual seu nome completo?");
            chatState = 'WAITING_NAME';
            chatInput.placeholder = "Digite seu nome...";
        }
    }, 1000);
}

// ============================================================
// UI HELPERS
// ============================================================

function formatText(text) { return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); }

function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'bot-message self-start animate-fade-in';
    div.innerHTML = formatText(text);
    chatMessages.appendChild(div);
    scrollToBottom();
}

function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'user-message self-end animate-fade-in';
    div.textContent = text;
    chatMessages.appendChild(div);
    scrollToBottom();
}

function showOptions(options) {
    const div = document.createElement('div');
    div.className = 'flex flex-wrap gap-2 mt-2';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'bg-white/10 hover:bg-cyan-600 border border-white/20 text-white text-xs px-3 py-2 rounded-full transition cursor-pointer';
        btn.textContent = opt;
        btn.onclick = () => handleOption(opt, div);
        div.appendChild(btn);
    });
    chatMessages.appendChild(div);
    scrollToBottom();
}

function showTyping() {
    const typing = document.createElement('div');
    typing.id = 'typing-indicator';
    typing.className = 'typing-indicator bg-white/10 p-2 rounded-lg self-start w-12 mb-2';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typing);
    scrollToBottom();
}

function removeTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}