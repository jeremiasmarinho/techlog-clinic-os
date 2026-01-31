/**
 * ============================================
 * CACHE SERVICE
 * Gerenciamento de cache com localStorage
 * ============================================
 */

const CACHE_PREFIX = 'medcrm_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Define item no cache
 * @param {string} key - Chave do cache
 * @param {any} value - Valor a armazenar
 * @param {number} ttl - Tempo de vida em ms (padrão: 5min)
 */
export function set(key, value, ttl = DEFAULT_TTL) {
    try {
        const cacheKey = CACHE_PREFIX + key;
        const item = {
            value,
            timestamp: Date.now(),
            ttl
        };
        localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
        console.warn('Cache set error:', error);
    }
}

/**
 * Obtém item do cache
 * @param {string} key - Chave do cache
 * @returns {any|null} Valor ou null se expirado/não existe
 */
export function get(key) {
    try {
        const cacheKey = CACHE_PREFIX + key;
        const item = localStorage.getItem(cacheKey);
        
        if (!item) return null;
        
        const { value, timestamp, ttl } = JSON.parse(item);
        const now = Date.now();
        
        // Verifica se expirou
        if (now - timestamp > ttl) {
            remove(key);
            return null;
        }
        
        return value;
    } catch (error) {
        console.warn('Cache get error:', error);
        return null;
    }
}

/**
 * Remove item do cache
 * @param {string} key - Chave do cache
 */
export function remove(key) {
    try {
        const cacheKey = CACHE_PREFIX + key;
        localStorage.removeItem(cacheKey);
    } catch (error) {
        console.warn('Cache remove error:', error);
    }
}

/**
 * Limpa todo o cache da aplicação
 */
export function clear() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.warn('Cache clear error:', error);
    }
}

/**
 * Verifica se item existe e está válido no cache
 * @param {string} key - Chave do cache
 * @returns {boolean} True se existe e está válido
 */
export function has(key) {
    return get(key) !== null;
}

/**
 * Wrapper para cache com fallback para API
 * @param {string} key - Chave do cache
 * @param {Function} fetcher - Função async que busca dados
 * @param {number} ttl - Tempo de vida em ms
 * @returns {Promise<any>} Dados (do cache ou API)
 */
export async function getOrFetch(key, fetcher, ttl = DEFAULT_TTL) {
    // Tenta pegar do cache
    const cached = get(key);
    if (cached !== null) {
        console.log(`✅ Cache hit: ${key}`);
        return cached;
    }
    
    // Busca da API
    console.log(`🔄 Cache miss: ${key} - fetching...`);
    const data = await fetcher();
    
    // Armazena no cache
    set(key, data, ttl);
    
    return data;
}
