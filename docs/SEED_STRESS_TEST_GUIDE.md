# 🌱 Stress Test Seed - Documentação

## ✅ Script Executado com Sucesso!

**Arquivo:** `scripts/seed-stress-test.ts`  
**Banco de Dados:** `database.dev.sqlite` (Development)  
**Data de Execução:** 2026-02-01

---

## 📊 Dados Inseridos

### 🏥 Clínica

- **Nome:** Clínica Demo
- **Slug:** clinica-demo
- **Plano:** Professional
- **Status:** Active

### 👥 50 Pacientes

- **Nomes:** Gerados aleatoriamente com nomes brasileiros
- **Emails:** Únicos com timestamp
- **Telefones:** DDD 11 + 9 dígitos
- **CPF:** Formatados (XXX.XXX.XXX-XX)
- **Status:** Distribuídos entre `waiting`, `triage`, `consultation`, `finished`
- **Datas:** Espalhadas nos últimos 180 dias

**Exemplos de nomes gerados:**

- Ana Silva Oliveira
- Bruno Souza Lima
- Carla Almeida Costa
- Diego Ferreira Ribeiro
- Gabriela Martins Araújo

---

### 📅 100 Agendamentos

- **Período:** Últimos 30 dias + Próximos 7 dias
- **Médicos:**
  - Dr. Augusto
  - Dra. Camila
  - Dr. Eduardo
  - Dra. Fernanda
  - Dr. Marcelo
- **Tipos:** consulta, retorno, exame, recorrente
- **Status:**
  - Agendamentos passados: `completed`, `cancelled`, `no_show`
  - Agendamentos futuros: `scheduled`, `confirmed`
- **Duração:** 20, 30, 40, 50 ou 60 minutos

---

### 💰 100 Transações Financeiras

- **Distribuição:** ~65% receitas + ~35% despesas
- **Período:** Últimos 30 dias + Próximos 7 dias

#### Receitas (Income)

- **Categorias:** Consulta, Procedimento, Outros
- **Valores:** R$ 80 - R$ 900
- **Status:** Maioria paga, algumas pendentes

#### Despesas (Expense)

- **Categorias:** Aluguel, Material, Outros
- **Valores:** R$ 50 - R$ 700
- **Status:** Pagas ou pendentes

#### Formas de Pagamento

- PIX
- Crédito
- Débito
- Dinheiro

---

## 🚀 Como Executar o Script

### Comando Principal

```bash
NODE_ENV=development npx ts-node scripts/seed-stress-test.ts
```

### Variações por Ambiente

#### Development (Padrão)

```bash
NODE_ENV=development npx ts-node scripts/seed-stress-test.ts
```

- Banco: `database.dev.sqlite`

#### Test

```bash
NODE_ENV=test npx ts-node scripts/seed-stress-test.ts
```

- Banco: `database.test.sqlite`

#### Production ⚠️ (Cuidado!)

```bash
NODE_ENV=production npx ts-node scripts/seed-stress-test.ts
```

- Banco: `database.prod.sqlite`

---

## 📈 Output do Script

```
✅ Conectado ao banco: /home/techlog-api/database.dev.sqlite
🚀 Iniciando seed de stress para dashboard e lista de pacientes
✅ Pacientes inseridos: 50
✅ Agendamentos inseridos: 100
✅ Transações financeiras inseridas: 100
🎉 Seed concluído com sucesso!
```

---

## 🎯 Casos de Uso

### 1. Testar Dashboard com Dados Reais

- **Gráficos de Agendamentos:** 100 registros nos últimos 30 dias
- **Gráficos Financeiros:** 100 transações com receitas e despesas
- **Métricas:** Saldo, receita total, despesa total

### 2. Testar Performance da Lista de Pacientes

- **50 pacientes** com dados completos
- Testa paginação, ordenação, filtros

### 3. Testar Cálculos Financeiros

- **Saldo:** Receitas - Despesas
- **Relatórios:** Por período, categoria, forma de pagamento
- **Dashboard:** Saldo diário, mensal

---

## 🔍 Verificar Dados no Banco

### SQLite CLI

```bash
sqlite3 database.dev.sqlite
```

### Queries Úteis

#### Ver pacientes criados

```sql
SELECT COUNT(*) FROM patients WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo');
```

#### Ver agendamentos

```sql
SELECT
    DATE(appointment_date) as data,
    COUNT(*) as total,
    status
FROM appointments
WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo')
GROUP BY DATE(appointment_date), status
ORDER BY data DESC
LIMIT 10;
```

#### Ver saldo financeiro

```sql
SELECT
    type,
    COUNT(*) as quantidade,
    SUM(amount) as total
FROM transactions
WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo')
GROUP BY type;
```

#### Ver transações por período

```sql
SELECT
    DATE(paid_at) as data,
    type,
    SUM(amount) as total
FROM transactions
WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo')
  AND paid_at IS NOT NULL
GROUP BY DATE(paid_at), type
ORDER BY data DESC
LIMIT 20;
```

---

## 🧹 Limpar Dados de Teste

Se quiser remover os dados gerados:

```sql
-- Conectar ao banco
sqlite3 database.dev.sqlite

-- Deletar dados da Clínica Demo
DELETE FROM transactions WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo');
DELETE FROM appointments WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo');
DELETE FROM patients WHERE clinic_id = (SELECT id FROM clinics WHERE slug = 'clinica-demo');
DELETE FROM clinics WHERE slug = 'clinica-demo';
```

---

## 📊 Estrutura do Script

### 1. Helper Functions

```typescript
randomItem(arr); // Item aleatório de array
randomInt(min, max); // Número aleatório
randomDateBetween(); // Data aleatória entre duas datas
formatCpf(); // Formata CPF
```

### 2. Database Helpers

```typescript
run(sql, params); // Executa INSERT/UPDATE
get<T>(sql, params); // Retorna uma linha
all<T>(sql, params); // Retorna múltiplas linhas
```

### 3. Seed Functions

```typescript
ensureClinic(); // Garante que existe "Clínica Demo"
seedPatients(); // Cria 50 pacientes
seedAppointments(); // Cria 100 agendamentos
seedTransactions(); // Cria 100 transações
```

---

## 🎨 Dados Aleatórios

### Nomes

- **25 primeiros nomes** brasileiros
- **16 sobrenomes** comuns
- Combinação gera diversidade

### Status dos Pacientes

- `waiting` (aguardando)
- `triage` (triagem)
- `consultation` (em consulta)
- `finished` (finalizado)

### Status dos Agendamentos

- **Passados:** completed, cancelled, no_show
- **Futuros:** scheduled, confirmed

### Categorias Financeiras

- **Receitas:** Consulta, Procedimento, Outros
- **Despesas:** Aluguel, Material, Outros

---

## ✅ Checklist de Testes

Após executar o script, você pode testar:

- [ ] Dashboard carrega com gráficos populados
- [ ] Lista de pacientes mostra 50+ registros
- [ ] Filtros e ordenação funcionam com volume
- [ ] Agendamentos aparecem no calendário
- [ ] Gráfico de agendamentos por dia
- [ ] Saldo financeiro calculado corretamente
- [ ] Relatório financeiro por categoria
- [ ] Relatório financeiro por período
- [ ] Performance da aplicação com dados reais

---

## 🔧 Troubleshooting

### Erro: "Unable to compile TypeScript"

**Causa:** Variável não utilizada ou erro de sintaxe  
**Solução:** Verificar o código TypeScript

### Erro: "Erro ao abrir banco de dados"

**Causa:** Caminho do banco incorreto  
**Solução:** Verificar `NODE_ENV` e existência do arquivo

### Dados não aparecem no Dashboard

**Causa:** Filtro por clínica diferente  
**Solução:** Verificar se está logado na "Clínica Demo"

---

## 📝 Notas Importantes

1. **Idempotente:** Pode rodar múltiplas vezes sem duplicar dados (usa INSERT OR IGNORE)
2. **Ambiente:** Sempre especifique `NODE_ENV` para controlar qual banco usar
3. **Performance:** Script roda em ~2-5 segundos
4. **Dados Realistas:** Nomes, valores e datas são gerados de forma aleatória mas realista

---

## 🎉 Conclusão

O script foi executado com sucesso e populou o banco de desenvolvimento com:

- ✅ 50 pacientes
- ✅ 100 agendamentos
- ✅ 100 transações financeiras

**Agora você pode testar o Dashboard e a performance da aplicação com dados reais!**

---

**Comando para rodar novamente:**

```bash
NODE_ENV=development npx ts-node scripts/seed-stress-test.ts
```
