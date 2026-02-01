# 🎯 Guia Rápido - Comandos por Ambiente

## 📋 Cheat Sheet de Comandos

### 🟢 DESENVOLVIMENTO (Seguro - Use sempre!)

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Resetar banco de desenvolvimento
NODE_ENV=development npm run reset-db

# Popular dados fake
NODE_ENV=development npm run seed

# Rodar migração
NODE_ENV=development npm run migrate
```

**Banco usado:** `database.dev.sqlite` 💻

---

### 🔴 PRODUÇÃO (CUIDADO - Dados Reais!)

```bash
# Build para produção
npm run build

# Iniciar em produção
npm start

# Migração em produção (ATENÇÃO!)
NODE_ENV=production npm run migrate

# Backup ANTES de qualquer operação
cp database.prod.sqlite database.prod.sqlite.backup-$(date +%Y%m%d)
```

**Banco usado:** `database.prod.sqlite` 🏥

---

### 🧪 TESTES (Automático - Resetado sempre)

```bash
# Rodar todos os testes
npm test

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Testes E2E com interface
npm run test:e2e:ui
```

**Banco usado:** `database.test.sqlite` 🧪

---

## ⚠️ Avisos de Segurança

### ❌ NUNCA FAÇA:

```bash
# ❌ Resetar sem verificar ambiente (pode apagar produção!)
npm run reset-db

# ❌ Usar npm start em desenvolvimento
npm start  # Isso usa banco de PRODUÇÃO!

# ❌ Commitar banco de produção
git add database.prod.sqlite  # PROIBIDO!
```

### ✅ SEMPRE FAÇA:

```bash
# ✅ Verificar qual banco está ativo
echo $NODE_ENV

# ✅ Usar npm run dev para desenvolvimento
npm run dev

# ✅ Fazer backup antes de migrations em produção
cp database.prod.sqlite backup/prod-$(date +%Y%m%d-%H%M%S).sqlite
```

---

## 📊 Verificar Status dos Bancos

```bash
# Ver tamanho dos bancos
ls -lh *.sqlite

# Contar registros em cada banco
echo "=== DEVELOPMENT ===" && sqlite3 database.dev.sqlite "SELECT COUNT(*) FROM leads;"
echo "=== PRODUCTION ===" && sqlite3 database.prod.sqlite "SELECT COUNT(*) FROM leads;"
echo "=== TEST ===" && sqlite3 database.test.sqlite "SELECT COUNT(*) FROM leads;"

# Ver últimos registros
sqlite3 database.dev.sqlite "SELECT id, name, status FROM leads ORDER BY id DESC LIMIT 5;"
```

---

## 🔄 Migração de Banco Antigo

Se você tem `clinic.db` do sistema antigo:

```bash
# 1. Fazer backup
cp clinic.db clinic.db.backup

# 2. Copiar para produção (dados reais)
cp clinic.db database.prod.sqlite

# 3. Copiar para desenvolvimento (para testar localmente)
cp clinic.db database.dev.sqlite

# 4. Verificar integridade
sqlite3 database.prod.sqlite "PRAGMA integrity_check;"
```

---

## 🛠️ Troubleshooting

### Problema: "Qual banco estou usando?"

```bash
# Verificar NODE_ENV atual
echo $NODE_ENV

# Ver no código (database/index.ts mostra no console)
npm run dev  # Mostrará: "📊 Database environment: 💻 DEVELOPMENT"
```

### Problema: "Resetei o banco errado!"

```bash
# Se foi desenvolvimento: sem problema, repopule
NODE_ENV=development npm run seed

# Se foi produção: RESTAURE O BACKUP IMEDIATAMENTE
cp database.prod.sqlite.backup database.prod.sqlite
```

### Problema: "Testes estão usando banco errado"

```bash
# Verificar se NODE_ENV=test está configurado no package.json
cat package.json | grep "\"test\":"

# Deve mostrar:
# "test": "NODE_ENV=test jest --coverage",
```

---

## 📝 Configuração do .env

Seu arquivo `.env` deve ter:

```env
# DESENVOLVIMENTO (padrão)
NODE_ENV=development

# PRODUÇÃO (apenas no servidor)
# NODE_ENV=production
```

---

## 🚀 Deploy em Servidor de Produção

```bash
# 1. No servidor, criar .env com NODE_ENV=production
echo "NODE_ENV=production" > .env
echo "PORT=3001" >> .env
echo "ACCESS_TOKEN=seu_token_super_seguro" >> .env

# 2. Build
npm run build

# 3. Iniciar (usará database.prod.sqlite)
npm start

# 4. Verificar logs
# Deve mostrar: "📊 Database environment: 🏥 PRODUCTION"
```

---

## 🔍 Como o Sistema Escolhe o Banco

```typescript
// src/database/index.ts
function getDatabasePath(): string {
  const nodeEnv = process.env.NODE_ENV || 'development';

  switch (nodeEnv) {
    case 'test':
      return 'database.test.sqlite';
    case 'production':
      return 'database.prod.sqlite';
    case 'development':
    default:
      return 'database.dev.sqlite';
  }
}
```

**Ordem de prioridade:**

1. Lê `NODE_ENV` do ambiente
2. Se não definido, usa `development`
3. Retorna o caminho do banco correspondente

---

## 📚 Scripts Atualizados no package.json

```json
{
  "scripts": {
    "dev": "NODE_ENV=development ts-node src/server.ts",
    "start": "NODE_ENV=production node dist/server.js",
    "test": "NODE_ENV=test jest --coverage",
    "test:integration": "NODE_ENV=test jest tests/integration --verbose",
    "test:e2e": "NODE_ENV=test playwright test"
  }
}
```

Todos os scripts agora definem `NODE_ENV` automaticamente! 🎉

---

## ✅ Checklist Diário

Antes de começar a trabalhar:

- [ ] Verificar `NODE_ENV` no terminal: `echo $NODE_ENV`
- [ ] Sempre usar `npm run dev` (nunca `npm start`)
- [ ] Confirmar banco ativo nos logs: "💻 DEVELOPMENT"

Antes de fazer deploy:

- [ ] Fazer backup de `database.prod.sqlite`
- [ ] Definir `NODE_ENV=production` no servidor
- [ ] Testar migrations em `database.dev.sqlite` primeiro
- [ ] Verificar logs após deploy: "🏥 PRODUCTION"

---

**Última atualização:** February 1, 2026  
**Versão:** 1.0
