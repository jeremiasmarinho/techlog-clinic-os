/**
 * ============================================
 * API SERVICE
 * Serviço centralizado para chamadas de API
 * ============================================
 */

/**
 * Obtém token JWT do sessionStorage
 * @returns {string|null} Token JWT ou null
 */
export function getToken() {
    return sessionStorage.getItem('MEDICAL_CRM_TOKEN');
}

/**
 * Verifica se usuário está autenticado
 * @returns {boolean} True se autenticado
 */
export function isAuthenticated() {
    return !!getToken();
}

/**
 * Redireciona para login se não autenticado
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        alert('Sessão inválida. Faça login novamente.');
        window.location.href = '/login.html';
    }
}

/**
 * Realiza requisição GET
 * @param {string} endpoint - Endpoint da API (ex: '/api/leads')
 * @param {object} options - Opções adicionais
 * @returns {Promise<any>} Resposta da API
 */
export async function get(endpoint, options = {}) {
    const token = getToken();
    
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * Realiza requisição POST
 * @param {string} endpoint - Endpoint da API
 * @param {object} data - Dados a enviar
 * @param {object} options - Opções adicionais
 * @returns {Promise<any>} Resposta da API
 */
export async function post(endpoint, data, options = {}) {
    const token = getToken();
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: JSON.stringify(data),
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * Realiza requisição PUT
 * @param {string} endpoint - Endpoint da API
 * @param {object} data - Dados a enviar
 * @param {object} options - Opções adicionais
 * @returns {Promise<any>} Resposta da API
 */
export async function put(endpoint, data, options = {}) {
    const token = getToken();
    
    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: JSON.stringify(data),
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * Realiza requisição DELETE
 * @param {string} endpoint - Endpoint da API
 * @param {object} options - Opções adicionais
 * @returns {Promise<any>} Resposta da API
 */
export async function del(endpoint, options = {}) {
    const token = getToken();
    
    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * API específica para Leads
 */
export const LeadsAPI = {
    /**
     * Lista todos os leads
     * @returns {Promise<Array>} Lista de leads
     */
    async getAll() {
        return get('/api/leads');
    },
    
    /**
     * Obtém lead por ID
     * @param {number} id - ID do lead
     * @returns {Promise<object>} Dados do lead
     */
    async getById(id) {
        return get(`/api/leads/${id}`);
    },
    
    /**
     * Cria novo lead
     * @param {object} leadData - Dados do lead
     * @returns {Promise<object>} Lead criado
     */
    async create(leadData) {
        return post('/api/leads', leadData);
    },
    
    /**
     * Atualiza lead existente
     * @param {number} id - ID do lead
     * @param {object} leadData - Dados atualizados
     * @returns {Promise<object>} Lead atualizado
     */
    async update(id, leadData) {
        return put(`/api/leads/${id}`, leadData);
    },
    
    /**
     * Remove lead
     * @param {number} id - ID do lead
     * @returns {Promise<object>} Confirmação
     */
    async delete(id) {
        return del(`/api/leads/${id}`);
    }
};

/**
 * API específica para Configurações da Clínica
 */
export const ClinicAPI = {
    /**
     * Obtém configurações da clínica
     * @returns {Promise<object>} Configurações
     */
    async getSettings() {
        return get('/api/clinic/settings');
    },
    
    /**
     * Atualiza configurações da clínica
     * @param {object} settings - Novas configurações
     * @returns {Promise<object>} Configurações atualizadas
     */
    async updateSettings(settings) {
        return put('/api/clinic/settings', settings);
    }
};

/**
 * API específica para Métricas
 */
export const MetricsAPI = {
    /**
     * Obtém métricas do dashboard
     * @returns {Promise<object>} Métricas
     */
    async getDashboard() {
        return get('/api/metrics/dashboard');
    }
};
