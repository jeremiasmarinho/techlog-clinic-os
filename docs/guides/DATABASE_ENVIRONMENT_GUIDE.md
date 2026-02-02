# 🗄️ Guia de Gerenciamento de Bancos de Dados por Ambiente

## 📋 Resumo da Refatoração

O sistema agora usa **bancos de dados separados por ambiente** para evitar acidentes com dados
reais.

---

## 🎯 Bancos de Dados por Ambiente

| Ambiente        | Banco de Dados         | Uso                                        |
| --------------- | ---------------------- | ------------------------------------------ |
| **Development** | `database.dev.sqlite`  | Desenvolvimento local (seguro para testes) |
| **Production**  | `database.prod.sqlite` | Dados reais da clínica (CUIDADO!)          |
| **Test**        | `database.test.sqlite` | Testes automatizados (Jest/Playwright)     |

---

## 🚀 Comandos Atualizados

### Desenvolvimento (Seguro)

```bash
npm run dev
```

- Usa `database.dev.sqlite`
- NODE_ENV=development
- Você pode apagar/resetar sem medo

### Produção (Dados Reais)

```bash
npm run build
npm start
```

- Usa `database.prod.sqlite`
- NODE_ENV=production
- **CUIDADO**: Contém dados reais!

### Testes Automatizados

```bash
npm test                    # Todos os testes
npm run test:integration    # Testes de integração
npm run test:e2e            # Testes E2E
```

- Usa `database.test.sqlite`
- NODE_ENV=test
- Resetado automaticamente entre testes

---

## 📂 Arquivos Criados

```
/home/techlog-api/
├── database.dev.sqlite      # Banco de desenvolvimento
├── database.prod.sqlite     # Banco de produção (não commitar!)
├── database.test.sqlite     # Banco de testes
├── .env                     # Variáveis de ambiente (NODE_ENV=development)
└── .env.example             # Template para configuração
```

---

## 🔐 Variáveis de Ambiente (.env)

```env
# Controla qual banco será usado
NODE_ENV=development  # Options: development | production | test

# Servidor
PORT=3001

# Segurança (TROCAR EM PRODUÇÃO!)
ACCESS_TOKEN=eviva2026
JWT_SECRET=MedicalCRM_Secret_Key_2026

# Admin padrão
ADMIN_USER=admin@medicalcrm.com
ADMIN_PASS=Mudar123!

# CORS
ALLOWED_ORIGINS=*
```

---

## 🛡️ Proteção no .gitignore

Os seguintes arquivos **NUNCA** serão commitados:

```
database.dev.sqlite
database.prod.sqlite
database.test.sqlite
.env
```

Apenas `.env.example` está no Git como template.

---

## 🔄 Migração de Dados Antigos

Se você tem um `clinic.db` antigo:

```bash
# Backup do banco antigo
cp clinic.db clinic.db.backup

# Copiar para banco de produção
cp clinic.db database.prod.sqlite

# Copiar para banco de desenvolvimento (para testar)
cp clinic.db database.dev.sqlite
```

---

## ⚠️ Avisos Importantes

### ❌ O QUE NÃO FAZER:

- ❌ Usar `npm start` enquanto desenvolve (vai afetar produção!)
- ❌ Commitar `.env` ou `database.prod.sqlite`
- ❌ Resetar banco sem verificar qual ambiente está ativo

### ✅ O QUE FAZER:

- ✅ Sempre usar `npm run dev` para desenvolvimento
- ✅ Verificar `NODE_ENV` antes de rodar migrations
- ✅ Fazer backup de `database.prod.sqlite` antes de mudanças
- ✅ Usar `.env.example` como base para criar `.env` em novos ambientes

---

## 🧪 Como Funciona Internamente

**Arquivo:** `src/database/index.ts`

```typescript
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

O sistema lê `NODE_ENV` e escolhe automaticamente o banco correto.

---

## 📊 Logs ao Iniciar

### Desenvolvimento:

```
📊 Database environment: 💻 DEVELOPMENT
📁 Database path: /home/techlog-api/database.dev.sqlite
✅ Conectado ao banco SQLite com sucesso!
```

### Produção:

```
📊 Database environment: 🏥 PRODUCTION
📁 Database path: /home/techlog-api/database.prod.sqlite
✅ Conectado ao banco SQLite com sucesso!
```

### Testes:

```
📊 Database environment: 🧪 TEST
📁 Database path: /home/techlog-api/database.test.sqlite
✅ Conectado ao banco SQLite com sucesso!
```

---

## 🔧 Scripts Migrations

Ao rodar migrations, certifique-se de estar no ambiente correto:

```bash
# Desenvolvimento
NODE_ENV=development npm run migrate

# Produção (CUIDADO!)
NODE_ENV=production npm run migrate
```

---

## 📝 Checklist para Deploy em Produção

1. ✅ Criar arquivo `.env` no servidor
2. ✅ Definir `NODE_ENV=production`
3. ✅ Trocar `ACCESS_TOKEN` por um token seguro
4. ✅ Trocar `JWT_SECRET` por uma chave forte
5. ✅ Configurar `ALLOWED_ORIGINS` com domínios reais
6. ✅ Executar `npm run build`
7. ✅ Executar `npm start`
8. ✅ Fazer backup regular de `database.prod.sqlite`

---

## 🆘 Troubleshooting

### Problema: "Cannot find database file"

**Solução:** O banco é criado automaticamente na primeira execução. Se não existe, verifique se o
NODE_ENV está correto.

### Problema: "Banco de testes está sendo usado em dev"

**Solução:** Verifique se você definiu `NODE_ENV=development` no `.env`.

### Problema: "Perdi dados do desenvolvimento"

**Solução:** Dados de `database.dev.sqlite` podem ser apagados com segurança. Se precisa restaurar,
use um backup ou rode `npm run seed` para popular dados fake.

### Problema: "Acidentalmente modifiquei produção"

**Solução:**

1. Pare o servidor imediatamente
2. Restaure backup: `cp database.prod.sqlite.backup database.prod.sqlite`
3. Configure `.env` corretamente para sempre usar `NODE_ENV=development` localmente

---

## 📚 Recursos Adicionais

- **dotenv**: https://www.npmjs.com/package/dotenv
- **SQLite Backup**: https://www.sqlite.org/backup.html
- **NODE_ENV Best Practices**:
  https://nodejs.org/en/learn/getting-started/nodejs-the-difference-between-development-and-production

---

**Última atualização:** February 1, 2026  
**Versão:** 1.0
