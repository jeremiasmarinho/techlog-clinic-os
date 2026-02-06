# 🚀 Fase 2: Migração de Utils e Services - GUIA DE IMPLEMENTAÇÃO

## 📅 Data: 2026-02-06
## 🎯 Status: Pronto para Implementação

---

## 📋 Visão Geral da Fase 2

Esta fase envolve a migração de **11 arquivos** (6 utils + 5 services) de JavaScript para TypeScript, estabelecendo a base tipada para o restante do projeto.

### Objetivos
1. ✅ Migrar funções utilitárias puras (utils)
2. ✅ Migrar camada de serviços (services)
3. ✅ Adicionar tipos robustos
4. ✅ Manter 100% de compatibilidade com código existente
5. ✅ Validar com testes e build

---

## 📁 Arquivos a Migrar

### 1. Utils (6 arquivos) - Ordem de Prioridade

#### **A. string-utils.js** (122 linhas)
**Funções:**
- `formatPhone()` - Formatação de telefone BR
- `cleanPhone()` - Remove formatação
- `capitalize()` - Capitalização de texto
- `truncate()` - Trunca strings
- `slugify()` - Gera slugs
- `isValidEmail()` - Validação de email
- `isValidCPF()` - Validação de CPF

**Tipos a criar:**
```typescript
type PhoneNumber = string;
type Email = string;
type CPF = string;
type Slug = string;
```

---

#### **B. currency-utils.js** (75 linhas)
**Funções:**
- `formatCurrency()` - Formata para R$
- `parseCurrency()` - Parse de moeda
- `formatPercent()` - Formata porcentagem
- `calculateGrowth()` - Calcula crescimento

**Interface a criar:**
```typescript
interface GrowthMetrics {
  currentValue: number;
  previousValue: number;
  growthRate: number;
  isPositive: boolean;
  displayText: string;
}
```

---

#### **C. date-utils.js** (129 linhas)
**Funções:**
- `extractTimeFromDate()` - Extrai horário
- `formatDate()` - Formata data DD/MM/YYYY
- `formatDateTime()` - Data + hora
- `getTodayString()` - Data de hoje
- `getTomorrowString()` - Data de amanhã
- `getYesterdayString()` - Data de ontem
- `isToday()` - Verifica se é hoje
- `isTomorrow()` - Verifica se é amanhã

**Tipos a criar:**
```typescript
type DateString = string; // YYYY-MM-DD
type TimeString = string; // HH:MM
type DateTimeISO = string; // ISO 8601
```

---

#### **D. formatters.js** (404 linhas) ⚠️ **COMPLEXO**
**Funções principais:**
- Formatação de CPF/CNPJ
- Formatação de telefone
- Formatação de CEP
- Formatação de datas
- Máscaras diversas

**Abordagem:** Dividir em submódulos se necessário

---

#### **E. masks.js** (309 linhas) ⚠️ **COMPLEXO**
**Máscaras implementadas:**
- Telefone
- CPF/CNPJ
- CEP
- Cartão de crédito
- Valores monetários

**Nota:** Alta interação com DOM, cuidado com tipos de eventos

---

#### **F. clinic-config.js** (273 linhas)
**Funções:**
- Configuração de clínica
- Gerenciamento de estado
- Cache de configurações

---

### 2. Services (5 arquivos)

#### **A. cache-service.js** (~150 linhas)
**Responsabilidade:** Gerenciamento de cache local/session storage

**Interface principal:**
```typescript
interface CacheService {
  set<T>(key: string, value: T, ttl?: number): void;
  get<T>(key: string): T | null;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}
```

---

#### **B. notification-service.js** (~100 linhas)
**Responsabilidade:** Sistema de notificações toast

**Interface:**
```typescript
interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

#### **C. api-service.js** (~200 linhas) ⚠️ **CRÍTICO**
**Responsabilidade:** Client HTTP central, todas chamadas API

**Interface:**
```typescript
interface ApiService {
  get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  patch<T>(endpoint: string, data: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>>;
}

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}
```

---

#### **D. clinic-service.js** (273 linhas)
**Responsabilidade:** Operações relacionadas a clínicas

---

#### **E. appointments-service.js** (692 linhas) ⚠️ **MAIOR ARQUIVO**
**Responsabilidade:** Gestão de agendamentos

---

## 🛠️ Estratégia de Implementação

### Fase 2A: Utils Simples (Dia 1)
1. ✅ string-utils.js → string-utils.ts
2. ✅ currency-utils.js → currency-utils.ts  
3. ✅ date-utils.js → date-utils.ts
4. ✅ Testar build: `npm run build:frontend`

### Fase 2B: Utils Complexos (Dia 2)
1. ✅ clinic-config.js → clinic-config.ts
2. ✅ masks.js → masks.ts (considerar refatoração)
3. ✅ formatters.js → formatters.ts (considerar refatoração)
4. ✅ Testar build e validar

### Fase 2C: Services Core (Dia 3)
1. ✅ cache-service.js → cache-service.ts
2. ✅ notification-service.js → notification-service.ts
3. ✅ api-service.js → api-service.ts ⚠️ **CRÍTICO**
4. ✅ Testar integração

### Fase 2D: Services Domínio (Dia 4)
1. ✅ clinic-service.js → clinic-service.ts
2. ✅ appointments-service.js → appointments-service.ts
3. ✅ Validação E2E completa

---

## 📝 Checklist por Arquivo

Para cada arquivo migrado:

- [ ] Criar arquivo `.ts` correspondente
- [ ] Adicionar imports dos tipos de `types/index.ts`
- [ ] Adicionar anotações de tipo em:
  - [ ] Parâmetros de função
  - [ ] Retornos de função
  - [ ] Variáveis complexas
  - [ ] Constantes exportadas
- [ ] Adicionar JSDoc quando necessário
- [ ] Substituir `any` por tipos específicos quando possível
- [ ] Testar compilação: `npm run build:frontend`
- [ ] Validar funcionamento (se houver testes)
- [ ] Remover arquivo `.js` original
- [ ] Atualizar imports em arquivos dependentes (se houver)
- [ ] Commit incremental

---

## 🧪 Testes e Validação

### Comandos de Teste

```bash
# 1. Compilação TypeScript
npm run build:frontend

# 2. Type checking
npx tsc --noEmit -p tsconfig.frontend.json

# 3. Linting
npm run lint

# 4. Testes E2E (se aplicável)
npm run test:e2e
```

### Validação Manual

Para cada arquivo migrado:
1. Verificar se compila sem erros
2. Testar funções principais no console do navegador
3. Verificar autocomplete no VS Code
4. Confirmar que não há erros de tipo

---

## ⚠️ Pontos de Atenção

### 1. **Arquivos Grandes**
- `formatters.js` (404 linhas)
- `masks.js` (309 linhas)
- `appointments-service.js` (692 linhas)

**Ação:** Considerar dividir em múltiplos arquivos menores

### 2. **API Service é Crítico**
O `api-service.js` é usado por TODO o frontend. Qualquer erro aqui quebra tudo.

**Estratégia:**
- Migrar com muito cuidado
- Testar extensivamente
- Manter compatibilidade 100%

### 3. **Máscaras e DOM**
Arquivos de máscara interagem com eventos DOM. Tipos de eventos precisam ser precisos.

```typescript
// Exemplo
function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  target.value = applyMask(target.value);
}
```

---

## 📊 Métricas de Progresso

### Fase 2 - Utils e Services

| Categoria | Total | Migrado | Pendente | % |
|-----------|-------|---------|----------|---|
| Utils     | 6     | 0       | 6        | 0% |
| Services  | 5     | 0       | 5        | 0% |
| **Total** | **11**| **0**   | **11**   | **0%** |

**Linhas de código:**
- Utils: ~1.700 linhas
- Services: ~1.500 linhas
- **Total Fase 2: ~3.200 linhas**

---

## 🎯 Próximos Passos Imediatos

1. **Agora:** Começar com `string-utils.js`
2. **Depois:** Seguir ordem de prioridade
3. **Validar:** Após cada 2-3 arquivos
4. **Commit:** Incremental após validação

---

## 📚 Recursos

### Documentação TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [DOM Manipulation](https://www.typescriptlang.org/docs/handbook/dom-manipulation.html)

### Projeto
- **Plano completo:** `docs/TYPESCRIPT_MIGRATION_PLAN.md`
- **Tipos base:** `public/js/types/index.ts`
- **Config TS:** `tsconfig.frontend.json`

---

## ✅ Critérios de Sucesso da Fase 2

- [ ] Todos os 11 arquivos migrados para TypeScript
- [ ] Build passa sem erros: `npm run build:frontend`
- [ ] Lint passa: `npm run lint`
- [ ] Nenhum uso de `any` desnecessário (< 5% do código)
- [ ] Testes E2E passam (se aplicável)
- [ ] Documentação atualizada
- [ ] Commit e push realizados

---

**Preparado por:** @copilot  
**Data:** 2026-02-06  
**Status:** 📋 Pronto para execução
