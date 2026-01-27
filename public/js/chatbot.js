// ==========================================
// CHATBOT STATE MANAGEMENT
// ==========================================

let chatState = {
    step: 0,              // 0: Name, 1: Type, 2: Phone, 3: Submit
    name: '',
    type: '',
    phone: '',
    initialized: false
};

const CHATBOT_API_URL = '/api/leads';

// ==========================================
// CHAT WINDOW CONTROLS
// ==========================================

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const isHidden = chatWindow.classList.contains('hidden');
    
    if (isHidden) {
        openChat();
    } else {
        closeChat();
    }
}

function openChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.remove('hidden');
    
    // Initialize chat conversation on first open
    if (!chatState.initialized) {
        initializeChat();
        chatState.initialized = true;
    }
}

function closeChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.add('hidden');
}

// ==========================================
// CHAT INITIALIZATION
// ==========================================

function initializeChat() {
    setTimeout(() => {
        addBotMessage('Olá! 👋 Bem-vindo à Sua Clínica Aqui.');
        setTimeout(() => {
            addBotMessage('Sou sua assistente virtual e vou ajudá-lo a agendar sua consulta ou exame de forma rápida e fácil.');
            setTimeout(() => {
                addBotMessage('Para começar, qual é o seu <strong>nome completo</strong>?');
                showTextInput('Digite seu nome aqui...');
            }, 1800);
        }, 1600);
    }, 600);
}

// ==========================================
// MESSAGE DISPLAY FUNCTIONS
// ==========================================

function addBotMessage(text, showTyping = true) {
    const messagesContainer = document.getElementById('chatMessages');
    
    if (showTyping) {
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.id = 'typingIndicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingIndicator);
        scrollToBottom();
        
        // Remove typing indicator and show message after delay
        setTimeout(() => {
            typingIndicator.remove();
            appendMessage(text, 'bot');
        }, 900);
    } else {
        appendMessage(text, 'bot');
    }
}

function addUserMessage(text) {
    appendMessage(text, 'user');
}

function appendMessage(text, type) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'bot' ? 'bot-message' : 'user-message';
    messageDiv.innerHTML = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ==========================================
// INPUT DISPLAY FUNCTIONS
// ==========================================

function showTextInput(placeholder) {
    const inputContainer = document.getElementById('chatInput');
    inputContainer.innerHTML = `
        <form onsubmit="handleNameInput(event)" class="flex items-center gap-2">
            <input 
                type="text" 
                id="userNameInput" 
                placeholder="${placeholder}"
                class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-full focus:border-green-600 focus:outline-none transition"
                required
                autofocus
            >
            <button 
                type="submit"
                class="bg-green-600 hover:bg-green-700 text-white w-11 h-11 rounded-full flex items-center justify-center transition shadow-md"
            >
                <i class="fas fa-paper-plane"></i>
            </button>
        </form>
    `;
}

function showTypeButtons() {
    const inputContainer = document.getElementById('chatInput');
    inputContainer.innerHTML = `
        <div class="grid grid-cols-2 gap-2">
            <button 
                onclick="selectType('primeira_consulta', '🌟 Primeira Consulta')" 
                class="option-button bg-yellow-50 hover:bg-yellow-100 text-gray-800 font-semibold py-3 px-3 rounded-lg border-2 border-yellow-300 text-sm"
            >
                🌟 1ª Consulta
            </button>
            <button 
                onclick="selectType('retorno', '🔄 Retorno')" 
                class="option-button bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-3 px-3 rounded-lg border-2 border-gray-300 text-sm"
            >
                🔄 Retorno
            </button>
            <button 
                onclick="selectType('recorrente', '♾️ Sessão Recorrente')" 
                class="option-button bg-indigo-50 hover:bg-indigo-100 text-gray-800 font-semibold py-3 px-3 rounded-lg border-2 border-indigo-300 text-sm"
            >
                ♾️ Sessão
            </button>
            <button 
                onclick="selectType('exame', '🔬 Exame')" 
                class="option-button bg-purple-50 hover:bg-purple-100 text-gray-800 font-semibold py-3 px-3 rounded-lg border-2 border-purple-300 text-sm"
            >
                🔬 Exame
            </button>
        </div>
    `;
}

function showPhoneInput() {
    const inputContainer = document.getElementById('chatInput');
    inputContainer.innerHTML = `
        <form onsubmit="handlePhoneInput(event)" class="flex items-center gap-2">
            <input 
                type="tel" 
                id="userPhoneInput" 
                placeholder="(00) 00000-0000"
                maxlength="15"
                class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-full focus:border-green-600 focus:outline-none transition"
                required
                autofocus
            >
            <button 
                type="submit"
                class="bg-green-600 hover:bg-green-700 text-white w-11 h-11 rounded-full flex items-center justify-center transition shadow-md"
            >
                <i class="fas fa-paper-plane"></i>
            </button>
        </form>
    `;
    
    // Apply phone mask
    const phoneInput = document.getElementById('userPhoneInput');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        } else if (value.length > 0) {
            value = value.replace(/^(\d*)/, '($1');
        }
        
        e.target.value = value;
    });
}

function showLoadingState() {
    const inputContainer = document.getElementById('chatInput');
    inputContainer.innerHTML = `
        <div class="text-center py-4 text-gray-500">
            <i class="fas fa-spinner fa-spin text-2xl text-green-600"></i>
            <p class="text-sm mt-2">Enviando seus dados...</p>
        </div>
    `;
}

function showRestartButton() {
    const inputContainer = document.getElementById('chatInput');
    inputContainer.innerHTML = `
        <button 
            onclick="restartChat()" 
            class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
            <i class="fas fa-redo"></i>
            <span>Nova Conversa</span>
        </button>
    `;
}

// ==========================================
// STEP HANDLERS
// ==========================================

// Step 0: Handle Name Input
function handleNameInput(event) {
    event.preventDefault();
    const input = document.getElementById('userNameInput');
    const name = input.value.trim();
    
    if (!name) return;
    
    chatState.name = name;
    addUserMessage(name);
    
    setTimeout(() => {
        addBotMessage(`Prazer em conhecê-lo, <strong>${chatState.name}</strong>! 😊`);
        setTimeout(() => {
            addBotMessage('Agora me diga: <strong>o que você precisa agendar?</strong>');
            chatState.step = 1;
            showTypeButtons();
        }, 1600);
    }, 600);
}

// Step 1: Handle Type Selection
function selectType(type, label) {
    chatState.type = type;
    addUserMessage(label);
    
    setTimeout(() => {
        addBotMessage('Ótima escolha! 👍');
        setTimeout(() => {
            addBotMessage('Para confirmarmos seu agendamento, qual é o seu <strong>número de WhatsApp</strong>?');
            chatState.step = 2;
            showPhoneInput();
        }, 1600);
    }, 600);
}

// Step 2: Handle Phone Input
function handlePhoneInput(event) {
    event.preventDefault();
    const input = document.getElementById('userPhoneInput');
    const phone = input.value.trim();
    
    if (!phone || phone.length < 14) {
        alert('⚠️ Por favor, digite um número de telefone válido com DDD.');
        return;
    }
    
    chatState.phone = phone.replace(/\D/g, '');
    addUserMessage(phone);
    
    setTimeout(() => {
        addBotMessage('Perfeito! ✅ Só um momento enquanto confirmo sua solicitação...');
        chatState.step = 3;
        showLoadingState();
        
        // Submit to API
        submitLeadToAPI();
    }, 600);
}

// ==========================================
// API INTEGRATION
// ==========================================

async function submitLeadToAPI() {
    try {
        const response = await fetch(CHATBOT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: chatState.name,
                phone: chatState.phone,
                type: chatState.type,
                status: 'novo'
            })
        });

        if (!response.ok) {
            throw new Error('Falha ao enviar dados para o servidor');
        }

        // Success messages
        setTimeout(() => {
            addBotMessage('✅ <strong>Tudo certo!</strong> Sua solicitação foi enviada com sucesso para nossa recepção.', false);
            setTimeout(() => {
                addBotMessage('📞 Em breve nossa equipe entrará em contato pelo WhatsApp para confirmar seu horário.', false);
                setTimeout(() => {
                    addBotMessage('Obrigado por escolher a Sua Clínica Aqui! Até breve! 😊', false);
                    showRestartButton();
                }, 1800);
            }, 1800);
        }, 1800);

    } catch (error) {
        console.error('Erro ao enviar lead:', error);
        setTimeout(() => {
            addBotMessage('❌ Ops! Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente ou ligue para (11) 3456-7890.', false);
            showRestartButton();
        }, 1800);
    }
}

// ==========================================
// RESTART CHAT
// ==========================================

function restartChat() {
    // Reset state
    chatState = {
        step: 0,
        name: '',
        type: '',
        phone: '',
        initialized: true  // Keep as initialized
    };
    
    // Clear messages
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('chatInput').innerHTML = '';
    
    // Restart conversation
    initializeChat();
}
