# E2E Testing Guide

## 🎯 Overview

Os testes E2E (End-to-End) agora usam um **banco de dados isolado** para evitar corrupção de dados de produção.

## 🗄️ Banco de Dados de Teste

### Isolamento Automático

- **Produção**: `clinic.db` (usado pelo servidor normal)
- **Testes**: `clinic.test.db` (criado automaticamente durante testes E2E)

### Dados de Teste

O banco de teste é criado com:
- ✅ 1 clínica: "Clínica Viva Saúde"
- ✅ 2 usuários:
  - `admin` / `Mudar123!` (super_admin)
  - `joao.silva` / `Mudar123!` (clinic_admin)
- ✅ 6 agendamentos para hoje (31/01/2026)
- ✅ 3 leads adicionais em vários status

## 🧪 Executando Testes E2E

### Comandos Disponíveis

```bash
# Executar todos os testes E2E (modo headless)
npm run test:e2e

# Executar com UI interativa do Playwright
npm run test:e2e:ui

# Executar com navegador visível (debugging)
npm run test:e2e:headed

# Executar em modo debug (pausa em cada passo)
npm run test:e2e:debug

# Ver relatório HTML dos últimos testes
npm run test:e2e:report

# Criar banco de teste manualmente (opcional)
npm run test:db:setup
```

### Executar Testes Específicos

```bash
# Testar apenas a agenda
npm run test:e2e -- tests/e2e/20-agenda-edit-modal.spec.ts

# Testar apenas o arquivamento
npm run test:e2e -- tests/e2e/21-agenda-archive.spec.ts

# Executar com mais workers (paralelismo)
npm run test:e2e -- --workers=4
```

## 🔄 Fluxo dos Testes

### 1. Global Setup (Antes de Todos os Testes)
- Remove banco de teste antigo (se existir)
- Executa `scripts/setup-test-db.ts`
- Cria `clinic.test.db` com dados limpos
- Define `TEST_MODE=true` no ambiente

### 2. Execução dos Testes
- Servidor detecta `TEST_MODE=true`
- Conecta automaticamente em `clinic.test.db`
- Testes executam sem afetar dados de produção

### 3. Global Teardown (Após Todos os Testes)
- Preserva `clinic.test.db` para inspeção
- Gera relatórios HTML e JSON
- Limpa variáveis de ambiente

## 🔍 Inspecionando Banco de Teste

Após executar os testes, você pode inspecionar o banco:

```bash
# Abrir banco de teste no SQLite
sqlite3 clinic.test.db

# Listar tabelas
.tables

# Ver agendamentos
SELECT * FROM leads WHERE appointment_date IS NOT NULL;

# Ver status dos leads
SELECT status, COUNT(*) FROM leads GROUP BY status;

# Sair
.exit
```

## 📊 Relatórios de Testes

### Relatório HTML

```bash
npm run test:e2e:report
```

Abre automaticamente `playwright-report/index.html` com:
- ✅ Lista de todos os testes
- 📸 Screenshots de falhas
- 🎬 Vídeos de testes falhados
- 📋 Traces para debugging

### Resultados JSON

Arquivo: `test-results/results.json`

Contém dados estruturados dos testes para CI/CD.

## 🚨 Importante

### ⚠️ Não Execute com Servidor de Produção Ativo

Se você tiver um servidor rodando **sem** `TEST_MODE=true`, ele usará `clinic.db` (produção).

Para evitar conflitos:

```bash
# Parar servidor de produção
pkill -f "node.*dist/server.js"

# Executar testes E2E (servidor de teste é iniciado automaticamente)
npm run test:e2e
```

### ✅ Servidor de Teste

Playwright inicia automaticamente um servidor de teste em `http://localhost:3001` com:
- `TEST_MODE=true`
- Conexão em `clinic.test.db`
- Dados isolados

## 🔧 Troubleshooting

### Problema: "Database is locked"

**Solução**: Feche todas as conexões com o banco

```bash
pkill -f sqlite3
rm -f clinic.test.db-wal clinic.test.db-shm
```

### Problema: "Port 3001 already in use"

**Solução**: Pare o servidor existente

```bash
pkill -f "node.*3001"
lsof -ti:3001 | xargs kill -9
```

### Problema: Testes falhando com dados incorretos

**Solução**: Recriar banco de teste

```bash
rm clinic.test.db
npm run test:db:setup
npm run test:e2e
```

### Problema: "Cannot find module 'global-setup'"

**Solução**: Rebuild o projeto

```bash
npm run build
npm run test:e2e
```

## 📝 Criando Novos Testes E2E

### Template Básico

```typescript
import { test, expect, Page } from '@playwright/test';
import { CREDENTIALS, loginAsAdmin } from './helpers';

test.describe('Nome da Funcionalidade', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        await loginAsAdmin(page);
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('Deve fazer algo específico', async () => {
        await page.goto('http://localhost:3001/sua-pagina.html');
        
        // Seu teste aqui
        const elemento = await page.$('#seu-elemento');
        expect(elemento).not.toBeNull();
    });
});
```

### Boas Práticas

1. **Use helpers.ts** para login e funções comuns
2. **Feche páginas** no `afterEach`
3. **Espere por elementos** antes de interagir
4. **Use seletores estáveis** (IDs, data attributes)
5. **Adicione console.log** para debugging
6. **Teste caminhos felizes E tristes**

## 🎓 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs do teste
2. Inspecione `clinic.test.db`
3. Execute com `--headed` para ver o navegador
4. Use `--debug` para pausar em cada passo
5. Revise screenshots/vídeos em `test-results/`
