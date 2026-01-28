# Módulos CRM - Documentação

Esta pasta contém módulos JavaScript refatorados do sistema Medical CRM, organizados por funcionalidade para melhor manutenibilidade e testabilidade.

## Estrutura de Módulos

### 📊 Kanban (Board de Leads)

- **`kanban-utils.js`** - Funções utilitárias (formatação, cálculos, parsing)
- **`kanban-drag-drop.js`** - Lógica de drag & drop para movimentação de cards
- **`kanban-card.js`** - Criação e renderização de cards de leads
- **`kanban-api.js`** - Interações com API (CRUD de leads)

### 👥 Patients (Gerenciamento de Pacientes)

- **`patients-utils.js`** - Funções auxiliares (formatação, badges, notificações)
- **`patients-filter.js`** - Lógica de filtros e busca
- **`patients-render.js`** - Renderização da tabela de pacientes
- **`patients-api.js`** - Chamadas API (listagem, arquivamento)

### 📈 Dashboard (Métricas e Relatórios)

- **`dashboard-api.js`** - Carregamento de dados e cálculo de métricas
- **`dashboard-charts.js`** - Renderização de gráficos Chart.js
- **`dashboard-reports.js`** - Geração de relatórios para WhatsApp

### 💬 Dialogs (Diálogos Customizados)

- **`dialogs.js`** (standalone) - Sistema de alertas, confirmações e prompts estilizados

## Padrão de Uso

### Importação de Módulos

```javascript
// Importar funções específicas
import { formatPhone, getTimeAgo } from './modules/kanban-utils.js';
import { renderStatusChart } from './modules/dashboard-charts.js';

// Usar as funções
const formattedPhone = formatPhone('11999887766');
renderStatusChart(statusData);
```

### Organização no Arquivo Principal

Os arquivos principais (kanban.js, patients.js, dashboard.js) agora funcionam como **orquestradores**:

1. **Importam** os módulos necessários
2. **Gerenciam** o estado da aplicação
3. **Coordenam** a interação entre módulos
4. **Expõem** funções globais quando necessário (onclick handlers)

Exemplo de estrutura:

```javascript
// kanban.js (orquestrador)
import { formatPhone } from './modules/kanban-utils.js';
import { dragStart, dragEnd, drop } from './modules/kanban-drag-drop.js';
import { createLeadCard } from './modules/kanban-card.js';
import { loadLeads, deleteLead } from './modules/kanban-api.js';

// Estado global
let currentLeads = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadLeads().then(leads => {
        currentLeads = leads;
        renderLeads();
    });
});

// Coordenação
function renderLeads() {
    currentLeads.forEach(lead => {
        const card = createLeadCard(lead, dragStart, dragEnd);
        document.getElementById('column').appendChild(card);
    });
}
```

## Benefícios da Refatoração

### ✅ Manutenibilidade
- Cada módulo tem uma responsabilidade única (Single Responsibility Principle)
- Mais fácil localizar e corrigir bugs
- Alterações isoladas não afetam outras partes

### ✅ Testabilidade
- Funções puras e isoladas facilitam testes unitários
- Mock de dependências é mais simples
- Cobertura de testes pode ser incremental

### ✅ Reusabilidade
- Funções utilitárias podem ser usadas em múltiplos contextos
- Redução de código duplicado
- Componentes podem ser compartilhados entre páginas

### ✅ Legibilidade
- Código organizado e bem documentado
- Nomes descritivos de módulos e funções
- Separação clara de concerns

### ✅ Performance
- Lazy loading de módulos quando necessário
- Tree shaking automático com bundlers
- Menos código carregado por página

## Convenções de Nomenclatura

### Arquivos
- `{feature}-{responsibility}.js` (ex: `kanban-utils.js`)
- Sempre em kebab-case
- Nome descritivo da funcionalidade

### Funções Exportadas
- camelCase para funções (ex: `formatPhone`)
- Nomes verbais e descritivos
- Prefixos: `render*`, `load*`, `calculate*`, `generate*`

### Constantes
- UPPER_SNAKE_CASE para constantes globais
- camelCase para variáveis de módulo

## Próximos Passos

### Backend
- [ ] Adicionar camada de serviço (Service Layer)
- [ ] Separar lógica de negócio dos controllers
- [ ] Criar módulos de validação reutilizáveis

### Frontend
- [ ] Adicionar testes unitários (Jest/Vitest)
- [ ] Implementar Web Components para UI reutilizável
- [ ] Adicionar TypeScript para type safety

### DevOps
- [ ] Configurar bundler (Vite/Rollup)
- [ ] Adicionar minificação de código
- [ ] Implementar CI/CD para testes automatizados

## Compatibilidade

Os módulos usam **ES6 Modules** (import/export), que são suportados em:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

Para navegadores mais antigos, use um bundler como Webpack ou Vite.

## Contribuindo

Ao adicionar novos módulos:

1. Siga o padrão de nomenclatura
2. Documente as funções exportadas
3. Mantenha módulos pequenos (< 200 linhas)
4. Uma responsabilidade por módulo
5. Adicione exemplos de uso no README
