/**
 * ============================================
 * TESTES UNITÁRIOS - CACHE SERVICE (TypeScript)
 * ============================================
 */

// Mock localStorage com beforeEach para compatibilidade com resetMocks: true
let store: Record<string, string> = {};

const localStorageBase = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    get length(): number {
        return Object.keys(store).length;
    },
    key: jest.fn(),
};

// Proxy para que Object.keys(localStorage) retorne as keys do store
const localStorageMock = new Proxy(localStorageBase, {
    ownKeys(): string[] {
        return [...Object.keys(store), ...Object.keys(localStorageBase)];
    },
    getOwnPropertyDescriptor(
        target: typeof localStorageBase,
        prop: string
    ): PropertyDescriptor | undefined {
        if (prop in store) {
            return { configurable: true, enumerable: true, value: store[prop] };
        }
        return Object.getOwnPropertyDescriptor(target, prop);
    },
});

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

import { set, get, remove, clear, has, getOrFetch } from '../../public/js/services/cache-service';

beforeEach(() => {
    store = {};
    localStorageBase.getItem.mockImplementation((key: string) => store[key] ?? null);
    localStorageBase.setItem.mockImplementation((key: string, value: string) => {
        store[key] = value;
    });
    localStorageBase.removeItem.mockImplementation((key: string) => {
        delete store[key];
    });
    localStorageBase.clear.mockImplementation(() => {
        store = {};
    });
    localStorageBase.key.mockImplementation((index: number) => Object.keys(store)[index] ?? null);
});

describe('CacheService - set/get', () => {
    test('deve salvar e recuperar valor do cache', () => {
        set('test-key', { name: 'João' });
        const result = get<{ name: string }>('test-key');
        expect(result).toEqual({ name: 'João' });
    });

    test('deve salvar e recuperar string', () => {
        set('msg', 'hello world');
        expect(get<string>('msg')).toBe('hello world');
    });

    test('deve salvar e recuperar número', () => {
        set('count', 42);
        expect(get<number>('count')).toBe(42);
    });

    test('deve salvar e recuperar array', () => {
        set('items', [1, 2, 3]);
        expect(get<number[]>('items')).toEqual([1, 2, 3]);
    });

    test('deve retornar null para chave inexistente', () => {
        expect(get('nonexistent')).toBeNull();
    });

    test('deve respeitar TTL - item expirado retorna null', () => {
        // Mock Date.now para simular passagem de tempo
        const realDateNow = Date.now;
        let currentTime = 1000000;
        Date.now = jest.fn(() => currentTime);

        set('expired', 'value', 100); // TTL de 100ms

        // Avança o tempo além do TTL
        currentTime += 200;

        const result = get('expired');
        expect(result).toBeNull();

        Date.now = realDateNow;
    });
});

describe('CacheService - remove', () => {
    test('deve remover item do cache', () => {
        set('to-remove', 'value');
        expect(get('to-remove')).toBe('value');

        remove('to-remove');
        expect(get('to-remove')).toBeNull();
    });

    test('não deve lançar erro ao remover chave inexistente', () => {
        expect(() => remove('nonexistent')).not.toThrow();
    });
});

describe('CacheService - clear', () => {
    test('deve limpar todos os itens do cache da aplicação', () => {
        set('key1', 'value1');
        set('key2', 'value2');

        clear();

        expect(get('key1')).toBeNull();
        expect(get('key2')).toBeNull();
    });
});

describe('CacheService - has', () => {
    test('deve retornar true para item existente e válido', () => {
        set('exists', 'value');
        expect(has('exists')).toBe(true);
    });

    test('deve retornar false para item inexistente', () => {
        expect(has('nonexistent')).toBe(false);
    });
});

describe('CacheService - getOrFetch', () => {
    test('deve retornar valor do cache se disponível', async () => {
        set('cached-data', { id: 1, name: 'Test' });

        const fetcher = jest.fn().mockResolvedValue({ id: 2, name: 'From API' });
        const result = await getOrFetch('cached-data', fetcher);

        expect(result).toEqual({ id: 1, name: 'Test' });
        expect(fetcher).not.toHaveBeenCalled();
    });

    test('deve buscar e cachear quando não existe no cache', async () => {
        const fetcher = jest.fn().mockResolvedValue({ id: 1, name: 'From API' });
        const result = await getOrFetch('new-data', fetcher);

        expect(result).toEqual({ id: 1, name: 'From API' });
        expect(fetcher).toHaveBeenCalledTimes(1);

        // Deve estar no cache agora
        expect(get('new-data')).toEqual({ id: 1, name: 'From API' });
    });
});
