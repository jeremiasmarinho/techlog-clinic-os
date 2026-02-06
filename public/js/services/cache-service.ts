/**
 * ============================================
 * CACHE SERVICE
 * Gerenciamento de cache com localStorage
 * ============================================
 */

import type { CacheItem } from '../types/models';

const CACHE_PREFIX = 'medcrm_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Define item no cache
 */
export function set<T = unknown>(key: string, value: T, ttl: number = DEFAULT_TTL): void {
    try {
        const cacheKey = CACHE_PREFIX + key;
        const item: CacheItem<T> = {
            value,
            timestamp: Date.now(),
            ttl,
        };
        localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch {
        // silently fail
    }
}

/**
 * Obtém item do cache
 */
export function get<T = unknown>(key: string): T | null {
    try {
        const cacheKey = CACHE_PREFIX + key;
        const item = localStorage.getItem(cacheKey);

        if (!item) return null;

        const { value, timestamp, ttl }: CacheItem<T> = JSON.parse(item);
        const now = Date.now();

        if (now - timestamp > ttl) {
            remove(key);
            return null;
        }

        return value;
    } catch {
        return null;
    }
}

/**
 * Remove item do cache
 */
export function remove(key: string): void {
    try {
        const cacheKey = CACHE_PREFIX + key;
        localStorage.removeItem(cacheKey);
    } catch {
        // silently fail
    }
}

/**
 * Limpa todo o cache da aplicação
 */
export function clear(): void {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch {
        // silently fail
    }
}

/**
 * Verifica se item existe e está válido no cache
 */
export function has(key: string): boolean {
    return get(key) !== null;
}

/**
 * Wrapper para cache com fallback para API
 */
export async function getOrFetch<T = unknown>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = DEFAULT_TTL
): Promise<T> {
    const cached = get<T>(key);
    if (cached !== null) {
        return cached;
    }

    const data = await fetcher();
    set(key, data, ttl);

    return data;
}
