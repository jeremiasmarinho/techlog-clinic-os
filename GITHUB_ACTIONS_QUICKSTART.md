# 🚀 Quick Start - GitHub Actions CI/CD

## ⚡ Comandos Essenciais

### 🔧 Localmente (Antes de fazer Push)

```bash
# 1. Verificar tipos TypeScript
npm run type-check

# 2. Verificar lint
npm run lint

# 3. Corrigir problemas de lint automaticamente
npm run lint:fix

# 4. Formatar código (Prettier)
npm run format

# 5. Rodar testes
npm test

# 6. Rodar tudo (simula CI completa)
npm run ci
```

### 📦 Instalar Dependências Faltantes

```bash
npm install --save-dev \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  prettier
```

---

## 🛡️ Configurar Branch Protection no GitHub

### Passo a Passo Visual

```
1. GitHub.com → Repositório
2. Settings → Branches
3. Add rule → Branch name: main
4. Marcar:
   ✅ Require pull request before merging
   ✅ Require status checks to pass before merging
      → Adicionar checks:
         • 🔍 Lint & Code Quality
         • 🧪 Unit & Integration Tests
         • 🎭 E2E Tests (Playwright)
         • 🏗️ Build Production
         • ✅ CI Success
   ✅ Require conversation resolution before merging
5. Create / Save
```

### ⚠️ Importante

**PRIMEIRO** faça um push com o workflow CI para a branch `main`.  
**DEPOIS** configure Branch Protection (senão os checks não aparecerão na lista).

---

## 📊 O Que a Pipeline Faz

```
┌─────────────────────────────────────────┐
│  PUSH/PR para main                      │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ 🔍 Lint       │   │ 🧪 Unit Tests │
│ - TypeScript  │   │ - Jest        │
│ - Prettier    │   │ - Coverage    │
└───────┬───────┘   └───────┬───────┘
        │                   │
        │           ┌───────────────┐
        │           │ 🎭 E2E Tests  │
        │           │ - Playwright  │
        │           └───────┬───────┘
        │                   │
        └─────────┬─────────┘
                  ▼
          ┌───────────────┐
          │ 🏗️ Build      │
          │ - TypeScript  │
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │ ✅ CI Success │
          │ Merge OK!     │
          └───────────────┘
```

---

## ✅ Cenário: Tudo Passou

```bash
$ git push origin feature/nova-funcionalidade

# No GitHub:
✅ Lint & Code Quality           (30s)
✅ Unit & Integration Tests      (1m 20s)
✅ E2E Tests (Playwright)        (2m 10s)
✅ Build Production              (45s)
✅ CI Success                    (5s)

🎉 All checks have passed!
🟢 Merge pull request button is ENABLED
```

---

## ❌ Cenário: Teste Falhou

```bash
$ git push origin feature/codigo-quebrado

# No GitHub:
✅ Lint & Code Quality           (30s)
❌ Unit & Integration Tests      (FAILED after 45s)
   → 3 tests failed in AppointmentCreation.test.ts
⏭️  E2E Tests (Playwright)        (SKIPPED - dependency failed)
⏭️  Build Production              (SKIPPED)
❌ CI Success                     (FAILED)

🚫 Some checks were not successful
🔴 Merge pull request button is DISABLED

Action Required:
1. Fix failing tests
2. Push again (CI runs automatically)
```

---

## 📂 Arquivos Criados

```
.github/
└── workflows/
    └── ci.yml                    # Pipeline principal

.eslintrc.js                      # Configuração ESLint
.prettierrc.json                  # Configuração Prettier
.prettierignore                   # Arquivos ignorados pelo Prettier

GITHUB_ACTIONS_CI_GUIDE.md        # Guia completo (LEIA!)
GITHUB_ACTIONS_QUICKSTART.md      # Este arquivo
```

---

## 🧪 Testar Localmente

```bash
# Simular exatamente o que o CI faz
npm run type-check && \
npm run format:check && \
npm test && \
npm run test:e2e && \
npm run build

# Ou use o atalho:
npm run ci
```

Se isso passar localmente, provavelmente passará no GitHub Actions também!

---

## 🔄 Workflow Diário

### 1. Começar Nova Feature

```bash
git checkout main
git pull origin main
git checkout -b feature/minha-feature
```

### 2. Desenvolver

```bash
# Fazer mudanças no código...
# Testar localmente:
npm run dev
```

### 3. Antes de Fazer Commit

```bash
# Formatar código
npm run format

# Verificar se tudo passa
npm run ci
```

### 4. Commit e Push

```bash
git add .
git commit -m "feat: Nova funcionalidade"
git push origin feature/minha-feature
```

### 5. Abrir Pull Request

```bash
# No GitHub:
1. Compare & pull request
2. Aguardar CI rodar (3-5 minutos)
3. Se passar → Solicitar review
4. Se falhar → Corrigir e push de novo
```

---

## 🆘 Problemas Comuns

### "Status checks are required but not enabled"

```bash
# Solução: Fazer 1 push para main primeiro
git checkout main
git add .github/
git commit -m "ci: Add GitHub Actions"
git push origin main

# Aguardar workflow rodar (veja em Actions tab)
# Então configurar Branch Protection
```

### "Checks não aparecem na lista"

```bash
# Solução: O workflow precisa rodar pelo menos 1 vez
# Vá em Actions → Aguarde completar
# Então volte em Settings → Branches → Edit rule
# Os checks aparecerão na busca
```

### "npm ci failed"

```bash
# Solução: Garantir que package-lock.json existe
npm install
git add package-lock.json
git commit -m "chore: Add package-lock.json"
git push
```

---

## 📊 Benefícios Imediatos

| Antes                              | Depois                                       |
| ---------------------------------- | -------------------------------------------- |
| ❌ Código quebrado vai para main   | ✅ Impossível mergear código quebrado        |
| ❌ Testes esquecidos               | ✅ Testes rodam automaticamente              |
| ❌ Bugs só descobertos em produção | ✅ Bugs detectados no PR                     |
| ❌ Sem histórico de qualidade      | ✅ Métricas e relatórios automáticos         |
| ❌ Reviews demorados               | ✅ CI valida o básico, review foca no design |

---

## 📚 Próximos Passos

1. ✅ Instalar dependências:
   `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier`
2. ✅ Fazer commit e push
3. ✅ Aguardar CI rodar pela primeira vez
4. ✅ Configurar Branch Protection
5. ✅ Testar com um Pull Request

---

## 🎯 Resultado Final

**Zero possibilidade de código quebrado ir para produção!** 🚀

- 🔍 Lint verifica estilo e erros
- 🧪 60 testes unitários/integração
- 🎭 6 testes E2E
- 🏗️ Build valida compilação
- 🛡️ GitHub bloqueia merge se algo falhar

---

**Documentação completa:** [GITHUB_ACTIONS_CI_GUIDE.md](GITHUB_ACTIONS_CI_GUIDE.md)

**Versão:** 1.0  
**Última atualização:** February 1, 2026
