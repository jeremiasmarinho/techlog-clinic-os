# 📊 Guia de Bancos de Dados

## ⚠️ IMPORTANTE: Qual banco usar?

O sistema usa **diferentes bancos de dados** dependendo do ambiente:

| Ambiente        | Arquivo de Banco       | Quando é usado                    |
| --------------- | ---------------------- | --------------------------------- |
| **Development** | `database.dev.sqlite`  | `npm run dev`                     |
| **Production**  | `database.prod.sqlite` | `npm start` (NODE_ENV=production) |
| **Test**        | `database.test.sqlite` | `npm test`                        |

### ❌ Arquivos LEGADOS (NÃO USE):

- `clinic.db` - Banco antigo, **NÃO é mais usado pelo servidor**
- `clinic.test.db` - Banco de teste antigo

---

## 🔧 Comandos Úteis

### Ver qual banco o servidor está usando:

```bash
# Os logs do servidor mostram:
# 📊 Database environment: 💻 DEVELOPMENT
# 📁 Database path: /home/techlog-api/database.dev.sqlite
```

### Inserir dados de demonstração:

```bash
# ✅ CORRETO - usar database.dev.sqlite
sqlite3 database.dev.sqlite "INSERT INTO appointments ..."

# ❌ ERRADO - não usar clinic.db
sqlite3 clinic.db "INSERT INTO appointments ..."
```

### Verificar dados:

```bash
# Listar tabelas
sqlite3 database.dev.sqlite ".tables"

# Ver estrutura de uma tabela
sqlite3 database.dev.sqlite ".schema appointments"

# Contar registros
sqlite3 database.dev.sqlite "SELECT COUNT(*) FROM appointments;"
```

---

## 📁 Estrutura dos Bancos

### Tabelas principais:

- `clinics` - Clínicas cadastradas
- `users` - Usuários do sistema
- `appointments` - Agendamentos
- `patients` - Pacientes
- `leads` - Leads/Oportunidades

### Status de Appointments (constraint no banco):

```sql
status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')
```

⚠️ **Não tente usar outros status** como `waiting`, `triage`, `consultation` - o banco vai rejeitar!

---

## 🏥 Clínicas no Development

```bash
sqlite3 database.dev.sqlite "SELECT id, name, status FROM clinics;"
```

| ID  | Nome           | Status |
| --- | -------------- | ------ |
| 1   | Clínica Padrão | active |
| 2   | Clínica Viva   | active |
| 3   | Saúde Total    | active |
| 4   | Clínica Demo   | active |

**O usuário admin está na clínica 1 (Clínica Padrão)**

---

## 🔄 Script de Seed (Dados de Demo)

Para popular o banco com dados de demonstração para hoje:

```bash
cd /home/techlog-api

# Inserir agendamentos de demo
sqlite3 database.dev.sqlite "
INSERT INTO appointments (clinic_id, patient_name, patient_phone, doctor_id, appointment_date, start_time, status, notes, insurance) VALUES
(1, 'João Silva', '(11) 99999-0001', 2, date('now'), datetime('now', 'start of day', '+8 hours'), 'scheduled', 'Consulta geral', 'Particular'),
(1, 'Maria Santos', '(11) 99999-0002', 2, date('now'), datetime('now', 'start of day', '+9 hours'), 'confirmed', 'Retorno', 'Unimed'),
(1, 'Pedro Costa', '(11) 99999-0003', 2, date('now'), datetime('now', 'start of day', '+10 hours'), 'completed', 'Finalizado', 'Bradesco');
"
```

---

## 🗺️ Mapeamento Kanban

O Kanban mapeia os status do banco para as colunas visuais:

| Status no Banco | Coluna Kanban    |
| --------------- | ---------------- |
| `scheduled`     | 🔵 Novos         |
| `confirmed`     | 🟢 Agendados     |
| `completed`     | ✅ Finalizados   |
| `cancelled`     | ❌ (não aparece) |
| `no_show`       | ❌ (não aparece) |

Código em: `public/js/crm/kanban.js` → função `transformAppointmentToLead()`

---

## 🔐 Configuração do Banco

Arquivo: `src/database/index.ts`

```typescript
function getDatabasePath() {
  switch (nodeEnv) {
    case 'production':
      dbFileName = 'database.prod.sqlite';
    case 'test':
      dbFileName = 'database.test.sqlite';
    case 'development':
    default:
      dbFileName = 'database.dev.sqlite';
  }
}
```

---

## ⚡ Troubleshooting

### Dados não aparecem no frontend?

1. Verificar se inseriu no banco correto (`database.dev.sqlite`)
2. Verificar `clinic_id` (usuário admin usa clinic_id = 1)
3. Verificar se a data está correta (formato: `2026-02-04`)

### Erro de constraint ao inserir?

- Verificar se o status está na lista permitida
- Verificar se clinic_id existe na tabela clinics

### Servidor não reconhece alterações?

- O servidor lê o banco em tempo real, não precisa reiniciar
- Só atualizar a página (F5)
