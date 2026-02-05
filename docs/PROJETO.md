# 📋 TechLog Clinic OS - Documentação Principal

> **Última atualização:** 05/02/2026  
> **Versão:** 2.0.0

---

## 🎯 Visão Geral

O **TechLog Clinic OS** é um sistema SaaS para gestão de clínicas médicas, focado em:

- **Simplicidade** - Interface intuitiva, sem curva de aprendizado
- **Modernidade** - Design glassmorphism com temas dark/light
- **Multi-tenant** - Cada clínica tem seus dados isolados
- **Performance** - Respostas < 200ms

---

## 🛠️ Stack Tecnológica

| Camada             | Tecnologia                                     |
| ------------------ | ---------------------------------------------- |
| **Frontend**       | HTML5, Tailwind CSS, JavaScript ES6+           |
| **Backend**        | Node.js, Express, TypeScript                   |
| **Banco de Dados** | SQLite3 (development), PostgreSQL (production) |
| **Testes**         | Jest (unit/integration), Playwright (E2E)      |
| **Deploy**         | PM2, GitHub Actions CI/CD                      |

---

## 📁 Estrutura do Projeto

```
techlog-api/
├── src/                    # Backend TypeScript
│   ├── controllers/        # Lógica dos endpoints
│   ├── routes/             # Definição de rotas
│   ├── middleware/         # Auth, tenant, error handling
│   ├── repositories/       # Acesso ao banco de dados
│   ├── services/           # Lógica de negócio
│   ├── validators/         # Validação com Zod
│   ├── database/           # Conexão SQLite
│   └── config/             # Constantes e configurações
│
├── public/                 # Frontend
│   ├── css/                # Estilos (design-system.css, themes.css)
│   ├── js/                 # JavaScript modular
│   │   ├── components/     # Web Components (lead-card, modal)
│   │   ├── crm/            # Módulos do CRM (kanban, settings)
│   │   └── services/       # API clients
│   └── *.html              # Páginas
│
├── tests/                  # Testes
│   ├── e2e/                # Playwright E2E
│   └── integration/        # Jest integration
│
├── migrations/             # Migrações SQL
├── scripts/                # Scripts de utilidade
├── uploads/                # Arquivos enviados (logos, etc)
└── docs/                   # Esta documentação
```

---

## 🚀 Quick Start

### Desenvolvimento

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar em modo desenvolvimento
npm run dev

# 3. Acessar
open http://localhost:3001
```

### Produção

```bash
# Build
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js
```

---

## 🔐 Autenticação

O sistema usa JWT para autenticação:

```
POST /api/auth/login
{
  "email": "admin@clinica.com",
  "password": "senha123"
}
```

Retorna um token que deve ser enviado em todas as requisições:

```
Authorization: Bearer <token>
```

### Credenciais de Teste

| Email             | Senha    | Clínica       |
| ----------------- | -------- | ------------- |
| admin@clinica.com | admin123 | Clínica Teste |

---

## 🎨 Sistema de Temas

### Arquitetura CSS

```
/css/design-system.css    # Variáveis CSS e componentes base
        ↓
/css/themes.css           # Importa design-system + ajustes
        ↓
<link> nos HTMLs          # Deve vir APÓS estilos inline
```

### Como funciona

1. **ThemeManager** (`/js/theme-manager.js`) gerencia alternância
2. Tema salvo em `localStorage` e sincronizado com backend
3. Aplica `data-theme="light|dark"` no `<html>`
4. CSS responde com seletores `[data-theme="light"]`

### Cores principais (Light Mode)

| Variável         | Cor     | Uso             |
| ---------------- | ------- | --------------- |
| `--bg-primary`   | #f0f4f8 | Fundo geral     |
| `--bg-secondary` | #ffffff | Cards           |
| `--primary`      | #0891b2 | Botões, links   |
| `--text-primary` | #1a2b3d | Texto principal |

---

## 📊 Módulos do Sistema

### 1. Kanban (CRM de Pacientes)

**Arquivo:** `/public/admin.html`  
**JavaScript:** `/public/js/crm/kanban.js`

Colunas:

- Novos → Em Atendimento → Agendados → Finalizados

### 2. Agenda

**Arquivo:** `/public/agenda.html`  
**Componente:** FullCalendar.js

### 3. Arquivo (Histórico)

**Arquivo:** `/public/arquivo.html`  
**Funcionalidade:** Leads arquivados com motivo

### 4. Relatórios

**Arquivo:** `/public/relatorios.html`  
**Métricas:** Faturamento, conversão, performance

### 5. Configurações

**Arquivo:** `/public/settings.html`  
**JavaScript:** `/public/js/crm/settings.js`

Funcionalidades:

- Identidade visual (logo, cores)
- Usuários e permissões
- Horários de funcionamento
- Planos de saúde
- Preferências do sistema

---

## 🧪 Testes

### Rodar testes unitários/integração

```bash
npm test
```

### Rodar testes E2E

```bash
npm run test:e2e
```

### Testes importantes

| Arquivo                                     | Descrição         |
| ------------------------------------------- | ----------------- |
| `tests/e2e/40-theme-visual-effects.spec.ts` | Temas light/dark  |
| `tests/e2e/settings-logo.spec.ts`           | Upload de logo    |
| `tests/integration/Financial.test.ts`       | Módulo financeiro |
| `tests/LeadController.test.ts`              | CRUD de leads     |

---

## 🔧 Scripts Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com hot reload

# Build
npm run build            # Compila TypeScript

# Testes
npm test                 # Jest (unit + integration)
npm run test:e2e         # Playwright E2E

# Database
npm run db:reset         # Reset completo do banco
npm run db:seed          # Popular com dados fake

# Lint
npm run lint             # ESLint
npm run lint:fix         # ESLint com auto-fix
```

---

## 📝 Convenções de Código

### TypeScript

- Usar `interface` para objetos, `type` para unions
- Sempre tipar retornos de função
- Preferir `const` sobre `let`

### CSS

- Variáveis CSS para cores (nunca hardcode)
- Mobile-first com breakpoints Tailwind
- Usar `!important` apenas em overrides de tema

### Git

```bash
# Formato do commit
<tipo>: <descrição curta>

# Tipos
feat:     Nova funcionalidade
fix:      Correção de bug
refactor: Refatoração
docs:     Documentação
test:     Testes
chore:    Manutenção
```

---

## 🚨 Troubleshooting

### Estilos não aplicando no Light Mode

1. Verificar se `themes.css` está carregando APÓS estilos inline
2. Usar DevTools → Elements → verificar `data-theme` no `<html>`
3. Aumentar especificidade com `html[data-theme="light"]`

### Erro de autenticação 401

1. Verificar token no localStorage
2. Token pode ter expirado (24h)
3. Fazer login novamente

### Build falhando

```bash
# Limpar e rebuildar
rm -rf dist/
npm run build
```

---

## 🔗 Links Úteis

- **Repo:** https://github.com/jeremiasmarinho/techlog-clinic-os
- **Tailwind:** https://tailwindcss.com/docs
- **Playwright:** https://playwright.dev/docs

---

## 📌 Próximos Passos (TODO)

### Prioridade Alta

- [ ] Corrigir estilos light mode (lead cards, badges)
- [ ] Adicionar testes E2E para todos os fluxos críticos
- [ ] Implementar backup automático do banco

### Prioridade Média

- [ ] Melhorar responsividade mobile
- [ ] Adicionar gráficos no dashboard
- [ ] Implementar notificações push

### Prioridade Baixa

- [ ] Integração com Google Calendar
- [ ] App mobile (React Native)
- [ ] Chat interno entre usuários

---

_Documentação gerada em 05/02/2026_
