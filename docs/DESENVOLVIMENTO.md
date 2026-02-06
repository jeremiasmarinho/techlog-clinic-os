# 🔧 Guia de Desenvolvimento - TechLog Clinic OS

> Instruções detalhadas para desenvolvimento e manutenção

---

## 📋 Checklist Antes de Começar

- [ ] Node.js 18+ instalado
- [ ] Git configurado
- [ ] VS Code com extensões recomendadas
- [ ] Acesso ao repositório GitHub

---

## 🚀 Setup Inicial

```bash
# 1. Clonar repositório
git clone git@github.com:jeremiasmarinho/techlog-clinic-os.git
cd techlog-clinic-os

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# 4. Iniciar em desenvolvimento
npm run dev

# 5. Verificar se está funcionando
curl http://localhost:3001/api/health
```

---

## 🏗️ Arquitetura de Código

### Backend (src/)

```
Request → Route → Middleware → Controller → Service → Repository → DB
```

| Camada         | Responsabilidade      | Exemplo                |
| -------------- | --------------------- | ---------------------- |
| **Route**      | Define endpoints      | `GET /api/leads`       |
| **Middleware** | Auth, logging, tenant | Verifica JWT           |
| **Controller** | Orquestra fluxo       | Valida e chama service |
| **Service**    | Lógica de negócio     | Regras de agendamento  |
| **Repository** | Acesso a dados        | SQL queries            |

### Frontend (public/js/)

```
Página HTML → Módulo JS → API Service → Backend
```

| Pasta         | Conteúdo                               |
| ------------- | -------------------------------------- |
| `components/` | Web Components reutilizáveis           |
| `crm/`        | Módulos específicos (kanban, settings) |
| `services/`   | Clientes de API                        |

---

## 🎨 Sistema de Estilos

### Hierarquia CSS

```
1. Tailwind CDN (classes utilitárias)
2. design-system.css (variáveis e componentes)
3. themes.css (importa design-system + overrides)
4. Estilos inline nos HTMLs
5. themes.css novamente (no final do head para override)
```

### Adicionando Estilos Light Mode

```css
/* Em themes.css - usar alta especificidade */
html[data-theme='light'] .meu-componente {
  background: #ffffff !important;
  color: #1a2b3d !important;
}
```

### Variáveis CSS Importantes

```css
/* Dark Mode (padrão) */
--bg-primary: #0f172a;
--text-primary: #f8fafc;
--primary: #06b6d4;

/* Light Mode */
--bg-primary: #f0f4f8;
--text-primary: #1a2b3d;
--primary: #0891b2;
```

---

## 🧪 Testes

### Estrutura de Testes

```
tests/
├── integration/          # Jest - API endpoints
├── e2e/                  # Playwright - Fluxos completos
│   ├── 01-login.spec.ts
│   ├── 02-kanban.spec.ts
│   └── ...
└── *.test.ts             # Jest - Unit tests
```

### Rodando Testes

```bash
# Todos os testes Jest
npm test

# Com coverage
npm test -- --coverage

# Apenas um arquivo
npm test -- LeadController.test.ts

# E2E com interface
npm run test:e2e -- --ui

# E2E específico
npx playwright test tests/e2e/40-theme-visual-effects.spec.ts
```

### Criando Novo Teste E2E

```typescript
import { test, expect } from '@playwright/test';

test.describe('Minha Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin.html');
  });

  test('deve fazer algo', async ({ page }) => {
    await page.goto('/minha-pagina.html');
    await expect(page.locator('.elemento')).toBeVisible();
  });
});
```

---

## 🔐 Multi-Tenant

### Como Funciona

1. Login retorna `clinic_id` no JWT
2. Middleware extrai `clinic_id` do token
3. Todas as queries filtram por `clinic_id`

### Adicionando Nova Tabela Multi-Tenant

```sql
CREATE TABLE minha_tabela (
  id INTEGER PRIMARY KEY,
  clinic_id INTEGER NOT NULL,
  -- outros campos
  FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);
```

```typescript
// No repository
async findAll(clinicId: number) {
  return db.all('SELECT * FROM minha_tabela WHERE clinic_id = ?', [clinicId]);
}
```

---

## 📦 Deploy

### Pré-Deploy Checklist

- [ ] Testes passando (`npm test`)
- [ ] Build sem erros (`npm run build`)
- [ ] Lint ok (`npm run lint`)
- [ ] Commit com mensagem descritiva

### Deploy Manual

```bash
# 1. Build
npm run build

# 2. Push
git add .
git commit -m "feat: minha feature"
git push origin main

# 3. No servidor
cd /home/techlog-api
git pull
npm install
pm2 restart techlog-api
```

### Deploy Automático (CI/CD)

O GitHub Actions roda automaticamente em push para `main`:

1. Lint
2. Build
3. Testes
4. Deploy (se tudo passou)

---

## 🐛 Debug

### Logs do Servidor

```bash
# PM2 logs
pm2 logs techlog-api

# Ou em desenvolvimento
npm run dev  # Console mostra tudo
```

### Debug Frontend

```javascript
// Adicione temporariamente
console.log('Debug:', variavel);

// Ou use breakpoints no DevTools
debugger;
```

### Verificar Estado do Banco

```bash
# SQLite CLI
sqlite3 database.dev.sqlite

# Comandos úteis
.tables
.schema leads
SELECT * FROM leads LIMIT 5;
```

---

## 📝 Fluxo de Trabalho Git

### Branch Naming

```
feature/nome-da-feature
fix/descricao-do-bug
refactor/area-refatorada
```

### Commit Messages

```bash
# Formato
<tipo>: <descrição>

# Exemplos
feat: adiciona upload de logo nas configurações
fix: corrige estilos do light mode
refactor: extrai lógica de kanban para service
test: adiciona testes E2E para tema
docs: atualiza documentação do projeto
```

### Pull Request

1. Criar branch: `git checkout -b feature/minha-feature`
2. Desenvolver com commits pequenos
3. Push: `git push origin feature/minha-feature`
4. Abrir PR no GitHub
5. Aguardar review
6. Merge após aprovação

---

## 🔧 Configurações VS Code Recomendadas

### Extensões

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- SQLite Viewer

### settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 🤖 GitHub Copilot

### Configuração do Copilot Chat

O projeto possui configuração customizada para o GitHub Copilot em `.github/copilot-instructions.md`.

Essas instruções ajudam o Copilot a:
- Entender a arquitetura em camadas (Controller → Service → Repository)
- Seguir os padrões de código estabelecidos
- Usar as constantes centralizadas
- Aplicar as regras de validação e segurança
- Gerar código consistente com o restante do projeto

### Como Usar o Copilot

1. **No VS Code:**
   - Instale a extensão GitHub Copilot
   - Use Ctrl+I (ou Cmd+I no Mac) para abrir o chat inline
   - O Copilot automaticamente lerá as instruções do projeto

2. **No GitHub:**
   - Acesse github.com/copilot/agents
   - Selecione o repositório techlog-clinic-os
   - Faça perguntas sobre o código ou peça ajuda com implementações

3. **Dicas para Melhores Resultados:**
   - Seja específico sobre qual camada você está trabalhando
   - Mencione se precisa de Controller, Service ou Repository
   - Peça para seguir os padrões do arquivo COPILOT_GUIDELINES.md
   - Inclua o contexto de multi-tenant quando relevante

### Documentação

- **Instruções GitHub Copilot:** `.github/copilot-instructions.md`
- **Guidelines Completas:** `/COPILOT_GUIDELINES.md`
- **Arquitetura do Projeto:** `/docs/PROJETO.md`

---

## ⚠️ Problemas Comuns

### "Cannot find module"

```bash
npm install
npm run build
```

### "SQLITE_BUSY"

O banco está sendo usado por outro processo. Feche outras conexões.

### "Port 3001 already in use"

```bash
# Encontrar processo
lsof -i :3001

# Matar processo
kill -9 <PID>
```

### Estilos não aplicam

1. Hard refresh: Ctrl+Shift+R
2. Verificar ordem de carregamento do CSS
3. Inspecionar elemento e verificar quais estilos estão sendo sobrescritos

---

## 📞 Suporte

- **Issues:** Abrir no GitHub
- **Documentação:** `/docs/PROJETO.md`
- **Guidelines:** `/COPILOT_GUIDELINES.md`

---

_Última atualização: 05/02/2026_
