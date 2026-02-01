# ✅ Seed Stress Test - Resumo da Execução

**Data:** 2026-02-01  
**Banco:** `database.dev.sqlite` (Development)  
**Status:** ✅ **SUCESSO**

---

## 📊 Dados Inseridos

| Tipo                | Quantidade | Detalhes                          |
| ------------------- | ---------- | --------------------------------- |
| 👥 **Pacientes**    | 50         | Nomes brasileiros aleatórios      |
| 📅 **Agendamentos** | 100        | Últimos 30 dias + Próximos 7 dias |
| 💰 **Transações**   | 100        | 72 receitas + 28 despesas         |

---

## 💵 Resumo Financeiro

| Tipo            | Quantidade | Total            |
| --------------- | ---------- | ---------------- |
| 💚 **Receitas** | 72         | R$ 35.661,00     |
| 🔴 **Despesas** | 28         | R$ 11.239,00     |
| 💎 **Saldo**    | -          | **R$ 24.422,00** |

---

## 🚀 Comando Executado

```bash
NODE_ENV=development npx ts-node scripts/seed-stress-test.ts
```

### Output:

```
✅ Conectado ao banco: /home/techlog-api/database.dev.sqlite
🚀 Iniciando seed de stress para dashboard e lista de pacientes
✅ Pacientes inseridos: 50
✅ Agendamentos inseridos: 100
✅ Transações financeiras inseridas: 100
🎉 Seed concluído com sucesso!
```

---

## 🎯 O que você pode testar agora:

### 1. Dashboard Financeiro

- ✅ Gráfico de receitas x despesas
- ✅ Saldo total: R$ 24.422,00
- ✅ 100 transações distribuídas em 30 dias

### 2. Lista de Pacientes

- ✅ 50 pacientes para testar performance
- ✅ Filtros e ordenação
- ✅ Paginação

### 3. Calendário de Agendamentos

- ✅ 100 agendamentos distribuídos
- ✅ Últimos 30 dias: agendamentos completados
- ✅ Próximos 7 dias: agendamentos futuros

---

## 🔍 Verificar Dados

### Ver pacientes

```sql
sqlite3 database.dev.sqlite "SELECT name, status FROM patients WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo') LIMIT 10;"
```

### Ver agendamentos recentes

```sql
sqlite3 database.dev.sqlite "SELECT DATE(appointment_date) as data, COUNT(*) as total FROM appointments WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo') GROUP BY DATE(appointment_date) ORDER BY data DESC LIMIT 10;"
```

### Ver transações por dia

```sql
sqlite3 database.dev.sqlite "SELECT DATE(paid_at) as data, type, SUM(amount) as total FROM transactions WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo') AND paid_at IS NOT NULL GROUP BY DATE(paid_at), type ORDER BY data DESC LIMIT 20;"
```

---

## 🔄 Rodar Novamente

Se quiser adicionar mais dados:

```bash
NODE_ENV=development npx ts-node scripts/seed-stress-test.ts
```

**Nota:** O script é idempotente - você pode rodá-lo várias vezes e ele adicionará mais dados sem
duplicar a clínica.

---

## 🧹 Limpar Dados (Opcional)

Se quiser recomeçar do zero:

```bash
sqlite3 database.dev.sqlite << EOF
DELETE FROM transactions WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo');
DELETE FROM appointments WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo');
DELETE FROM patients WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo');
DELETE FROM clinics WHERE slug = 'clinica-demo';
EOF
```

---

## 📁 Arquivos Relacionados

1. **Script:** `scripts/seed-stress-test.ts`
2. **Documentação:** `docs/SEED_STRESS_TEST_GUIDE.md`
3. **Banco de Dados:** `database.dev.sqlite`

---

## ✅ Checklist de Testes

Agora você pode testar:

- [ ] Dashboard financeiro com gráficos
- [ ] Lista de pacientes (50 registros)
- [ ] Calendário com 100 agendamentos
- [ ] Filtros e buscas
- [ ] Performance da aplicação
- [ ] Cálculos de saldo
- [ ] Relatórios financeiros

---

**Pronto! Seu banco de desenvolvimento está populado com dados realistas!** 🎉
