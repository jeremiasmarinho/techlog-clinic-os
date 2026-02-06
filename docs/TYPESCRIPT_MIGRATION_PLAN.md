# 📘 Plano de Migração Frontend para TypeScript

## 📊 Situação Atual

- **Backend (src/)**: ✅ 100% TypeScript (47 arquivos)
- **Frontend (public/js/)**: ❌ 100% JavaScript (53 arquivos)
- **Total de linhas no frontend**: ~17.000 linhas de código

## 🎯 Objetivos da Migração

1. **Consistência**: Mesma linguagem em todo o projeto
2. **Detecção precoce de erros**: TypeScript identifica problemas antes da execução
3. **Melhor IDE support**: Autocomplete, refactoring, navegação
4. **Documentação viva**: Tipos servem como documentação
5. **Manutenção facilitada**: Refatorações seguras e automáticas
6. **Copilot mais eficaz**: IA gera código mais preciso com contexto de tipos

## 🗂️ Análise da Estrutura Atual

### Arquivos por Categoria

```
public/js/
├── services/        # 5 arquivos (API, cache, notifications, etc.)
├── utils/           # 6 arquivos (formatters, masks, date-utils, etc.)
├── components/      # 12 arquivos (UI components reutilizáveis)
├── crm/            # 16 arquivos (páginas e módulos do CRM)
├── saas/           # 2 arquivos (admin SaaS)
├── site/           # 2 arquivos (landing page)
├── chat/           # 1 arquivo (widget de chat)
└── outros          # 9 arquivos (kanban, theme-manager, etc.)
```

### Arquivos Maiores (prioridade de migração)

| Arquivo                            | Linhas | Complexidade | Prioridade |
| ---------------------------------- | ------ | ------------ | ---------- |
| `crm/kanban.js`                    | 2.388  | Alta         | 🔴 Crítica |
| `crm/settings.js`                  | 1.083  | Média        | 🟡 Alta    |
| `crm/agenda.js`                    | 1.077  | Alta         | 🔴 Crítica |
| `components/date-range-picker.js`  | 835    | Média        | 🟡 Alta    |
| `crm/agenda-slots.js`              | 823    | Alta         | 🟡 Alta    |
| `services/appointments-service.js` | 692    | Média        | 🟢 Média   |
| `crm/patients.js`                  | 653    | Média        | 🟢 Média   |

## 📋 Estratégia de Migração (5 Fases)

### **Fase 1: Infraestrutura e Setup** (1-2 dias)

**Objetivo**: Preparar ambiente para suportar TypeScript no frontend

#### Tarefas:

1. ✅ Criar `tsconfig.frontend.json` com configurações específicas
2. ✅ Instalar dependências necessárias
   ```bash
   npm install --save-dev esbuild @types/node
   ```
3. ✅ Configurar build pipeline com esbuild
4. ✅ Adicionar scripts npm para build frontend
5. ✅ Configurar ESLint para TypeScript no frontend
6. ✅ Atualizar `.gitignore` para arquivos compilados

#### Arquivos a criar:

- `tsconfig.frontend.json` - Configuração TypeScript para frontend
- `build-frontend.js` - Script de build com esbuild
- `public/js/types/` - Diretório para tipos compartilhados

#### Configuração sugerida `tsconfig.frontend.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "outDir": "./public/dist",
    "rootDir": "./public/js",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "allowJs": true,
    "checkJs": false,
    "noEmit": false,
    "sourceMap": true,
    "removeComments": false
  },
  "include": ["public/js/**/*"],
  "exclude": ["node_modules", "public/dist"]
}
```

---

### **Fase 2: Utils e Services** (3-5 dias)

**Objetivo**: Migrar camada base (utils e services) que não têm dependências complexas

#### Ordem de migração:

1. **Utils (6 arquivos)** - Começar por serem funções puras
   - [x] `utils/string-utils.js` → `string-utils.ts`
   - [x] `utils/currency-utils.js` → `currency-utils.ts`
   - [x] `utils/date-utils.js` → `date-utils.ts`
   - [x] `utils/formatters.js` → `formatters.ts`
   - [x] `utils/masks.js` → `masks.ts`
   - [x] `utils/clinic-config.js` → `clinic-config.ts`

2. **Services (5 arquivos)** - Camada de API
   - [x] `services/cache-service.js` → `cache-service.ts`
   - [x] `services/notification-service.js` → `notification-service.ts`
   - [x] `services/api-service.js` → `api-service.ts` (core)
   - [x] `services/clinic-service.js` → `clinic-service.ts`
   - [x] `services/appointments-service.js` → `appointments-service.ts`

#### Exemplo de migração:

**Antes (JavaScript)**:

```javascript
// utils/date-utils.js
export function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}
```

**Depois (TypeScript)**:

```typescript
// utils/date-utils.ts
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}
```

---

### **Fase 3: Componentes UI** (4-6 dias)

**Objetivo**: Migrar componentes reutilizáveis da interface

#### Componentes a migrar (12 arquivos):

- [x] `components/clinic-header.js`
- [x] `components/sidebar.js`
- [x] `components/confirmation-modal.js`
- [x] `components/dashboard-kpi.js`
- [x] `components/date-range-picker.js` (835 linhas - dividir?)
- [x] `components/kanban-column.js`
- [x] `components/lead-card.js`
- [x] `components/patient-row.js`
- [x] `components/metrics-calculator.js`
- [x] `components/metrics-renderer.js`
- Outros componentes menores

#### Criar tipos compartilhados:

```typescript
// public/js/types/models.ts
export interface Patient {
  id: number;
  name: string;
  phone: string;
  clinic_id: number;
  status: PatientStatus;
  created_at: string;
}

export type PatientStatus = 'waiting' | 'triage' | 'consultation' | 'finished';

export interface Lead {
  id: number;
  name: string;
  phone: string;
  status: LeadStatus;
  // ...
}

export type LeadStatus = 'novo' | 'em_atendimento' | 'agendado' | 'finalizado';
```

---

### **Fase 4: Módulos CRM** (5-7 dias)

**Objetivo**: Migrar módulos do CRM (parte mais complexa)

#### Módulos por ordem de complexidade:

**4.1. Módulos auxiliares primeiro**:

- [x] `crm/modules/kanban-utils.js`
- [x] `crm/modules/patients-utils.js`
- [x] `crm/modules/dashboard-api.js`
- [x] `crm/modules/kanban-api.js`
- [x] `crm/modules/patients-api.js`

**4.2. Módulos de renderização**:

- [x] `crm/modules/patients-render.js`
- [x] `crm/modules/dashboard-charts.js`
- [x] `crm/modules/dashboard-reports.js`

**4.3. Módulos de interação**:

- [x] `crm/modules/kanban-card.js`
- [x] `crm/modules/kanban-drag-drop.js`
- [x] `crm/modules/patients-filter.js`

**4.4. Páginas principais** (mais complexas):

- [x] `crm/auth.js`
- [x] `crm/login.js`
- [x] `crm/dialogs.js`
- [x] `crm/calendar.js`
- [x] `crm/dashboard.js`
- [x] `crm/patients.js`
- [x] `crm/whatsapp-templates.js`
- [x] `crm/admin.js`
- [x] `crm/agenda-slots.js`
- [x] `crm/agenda.js` (1.077 linhas)
- [x] `crm/settings.js` (1.083 linhas)
- [x] `crm/kanban.js` (2.388 linhas - DIVIDIR!)

#### Estratégia para arquivos grandes:

**`crm/kanban.js` (2.388 linhas)** - Dividir em:

```
crm/kanban/
├── index.ts              # Entry point
├── kanban-state.ts       # Estado e gerenciamento
├── kanban-render.ts      # Renderização de colunas
├── kanban-events.ts      # Event handlers
├── kanban-drag-drop.ts   # Drag and drop
└── kanban-api.ts         # Chamadas API
```

---

### **Fase 5: Páginas e Finalização** (2-3 dias)

**Objetivo**: Migrar páginas restantes e finalizar

#### Arquivos restantes:

- [x] `kanban.js` (404 linhas)
- [x] `admin-dashboard.js`
- [x] `theme-manager.js`
- [x] `saas/admin.js` (635 linhas)
- [x] `saas/clinics.js` (484 linhas)
- [x] `site/main.js`
- [x] `site/agendar.js`
- [x] `chat/widget.js`

#### Atualizar HTML files:

- Mudar imports de `.js` para `.js` compilado
- Ou usar bundler que gera bundle único

---

## 🛠️ Ferramentas e Scripts

### Build Pipeline com esbuild

```javascript
// build-frontend.js
const esbuild = require('esbuild');
const glob = require('glob');

const entryPoints = glob.sync('public/js/**/*.ts');

esbuild
  .build({
    entryPoints,
    bundle: false,
    outdir: 'public/dist',
    format: 'esm',
    target: 'es2020',
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
  })
  .catch(() => process.exit(1));
```

### Scripts npm a adicionar:

```json
{
  "scripts": {
    "build:frontend": "node build-frontend.js",
    "build:all": "npm run build && npm run build:frontend",
    "watch:frontend": "node build-frontend.js --watch",
    "dev:full": "concurrently \"npm run dev\" \"npm run watch:frontend\""
  }
}
```

---

## 📅 Timeline Estimado

| Fase                   | Duração        | Arquivos        | Status      |
| ---------------------- | -------------- | --------------- | ----------- |
| Fase 1: Setup          | 1-2 dias       | 0 → Setup       | ⏳ Pendente |
| Fase 2: Utils/Services | 3-5 dias       | 11 arquivos     | ⏳ Pendente |
| Fase 3: Components     | 4-6 dias       | 12 arquivos     | ⏳ Pendente |
| Fase 4: CRM Modules    | 5-7 dias       | 21 arquivos     | ⏳ Pendente |
| Fase 5: Finalização    | 2-3 dias       | 9 arquivos      | ⏳ Pendente |
| **Total**              | **15-23 dias** | **53 arquivos** | ⏳ Pendente |

---

## ✅ Checklist de Migração (por arquivo)

Para cada arquivo JavaScript → TypeScript:

- [ ] Criar arquivo `.ts` correspondente
- [ ] Adicionar tipos para funções e variáveis
- [ ] Adicionar interfaces para objetos complexos
- [ ] Corrigir erros de tipo
- [ ] Testar funcionalidade (manual ou E2E)
- [ ] Remover arquivo `.js` original
- [ ] Atualizar imports em outros arquivos
- [ ] Rodar `npm run build:frontend` e verificar
- [ ] Commit incremental

---

## 🚨 Riscos e Mitigações

| Risco                   | Impacto | Mitigação                                |
| ----------------------- | ------- | ---------------------------------------- |
| Quebrar funcionalidade  | Alto    | Testes E2E após cada fase                |
| Tempo de migração longo | Médio   | Migração gradual, manter JS funcionando  |
| Erros de tipo complexos | Médio   | Usar `any` temporariamente se necessário |
| Build time aumentar     | Baixo   | Usar esbuild (muito rápido)              |

---

## 🧪 Estratégia de Testes

1. **Testes E2E existentes**: Rodar após cada fase

   ```bash
   npm run test:e2e
   ```

2. **Testes manuais**: Verificar principais fluxos
   - Login
   - Kanban drag & drop
   - Agenda
   - Dashboard

3. **Type checking**: Antes de cada commit
   ```bash
   npm run type-check
   ```

---

## 📝 Convenções de Código TypeScript

### Nomenclatura:

- **Interfaces**: PascalCase, prefixo `I` opcional

  ```typescript
  interface Patient { ... }
  // ou
  interface IPatient { ... }
  ```

- **Types**: PascalCase

  ```typescript
  type PatientStatus = 'waiting' | 'triage';
  ```

- **Enums**: PascalCase
  ```typescript
  enum LeadStatus {
    New = 'novo',
    InProgress = 'em_atendimento',
  }
  ```

### Strict Mode:

- Usar `strict: true` no tsconfig
- Evitar `any` exceto em casos de migração temporária
- Usar `unknown` quando tipo é realmente desconhecido

### Documentação:

```typescript
/**
 * Formata data para padrão brasileiro
 * @param date - Data em string ou objeto Date
 * @returns Data formatada (dd/mm/yyyy)
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}
```

---

## 🎯 Próximos Passos Imediatos

1. **Aprovar este plano** ✅
2. **Iniciar Fase 1** (Setup)
3. **Criar branch**: `feature/typescript-migration-phase-1`
4. **Implementar infraestrutura**
5. **Primeira migração**: `utils/string-utils.js`
6. **Validar pipeline**
7. **Prosseguir com Fase 2**

---

## 📚 Recursos e Referências

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [esbuild Documentation](https://esbuild.github.io/)
- [Migrating from JavaScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)

---

**Criado em**: 2026-02-06  
**Última atualização**: 2026-02-06  
**Status**: 📋 Aguardando aprovação
