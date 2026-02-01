# 🧪 Teste Manual de Isolamento Multi-Tenant

## 📊 Status da Implementação

✅ **Migração concluída** ✅ **Seed executado** (2 clínicas criadas) ✅ **Middleware de tenant**
configurado ✅ **AuthController** incluindo `clinicId` no JWT ✅ **LeadController** usando
isolamento por `clinic_id` ✅ **SaaSController** para gerenciamento de clínicas

---

## 🏥 Clínicas no Sistema

| ID  | Nome           | Slug           | Leads | Status          |
| --- | -------------- | -------------- | ----- | --------------- |
| 1   | Clínica Padrão | clinica-padrao | 0     | Compatibilidade |
| 2   | Clínica Viva   | clinica-viva   | 4     | ✅ Ativa        |
| 3   | Saúde Total    | saude-total    | 4     | ✅ Ativa        |

---

## 🧪 Teste 1: Login e Verificação de Isolamento

### Clínica A - Clínica Viva

```bash
# 1. Fazer login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos@clinicaviva.com",
    "password": "clinica-a-2026"
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "Dr. Carlos Silva",
    "username": "carlos@clinicaviva.com",
    "role": "admin",
    "clinic": {
      "id": 2,
      "name": "Clínica Viva",
      "slug": "clinica-viva",
      "plan": "enterprise"
    }
  }
}
```

```bash
# 2. Listar leads (deve retornar APENAS os 4 leads da Clínica Viva)
curl -X GET "http://localhost:3001/api/leads" \
  -H "x-access-token: SEU_TOKEN_AQUI"
```

**Resultado esperado:**

- 4 leads retornados
- Todos com `clinic_id = 2`
- Nomes: Ana Paula Costa, Roberto Fernandes, Juliana Martins, Fernando Silva

---

### Clínica B - Saúde Total

```bash
# 1. Fazer login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patricia@saudetotal.com",
    "password": "clinica-b-2026"
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "name": "Dra. Patricia Alves",
    "username": "patricia@saudetotal.com",
    "role": "admin",
    "clinic": {
      "id": 3,
      "name": "Saúde Total",
      "slug": "saude-total",
      "plan": "basic"
    }
  }
}
```

```bash
# 2. Listar leads (deve retornar APENAS os 4 leads da Saúde Total)
curl -X GET "http://localhost:3001/api/leads" \
  -H "x-access-token: SEU_TOKEN_AQUI"
```

**Resultado esperado:**

- 4 leads retornados (DIFERENTES da Clínica A)
- Todos com `clinic_id = 3`
- Nomes: Marcos Pereira, Carla Souza, Lucas Mendes, Beatriz Lima

---

## 🔐 Teste 2: Verificação de Isolamento no Banco

```bash
# Leads da Clínica Viva (ID = 2)
sqlite3 database.dev.sqlite \
  "SELECT id, name, phone, clinic_id FROM leads WHERE clinic_id = 2;"

# Leads da Saúde Total (ID = 3)
sqlite3 database.dev.sqlite \
  "SELECT id, name, phone, clinic_id FROM leads WHERE clinic_id = 3;"

# Confirmar que NÃO há overlap (deve retornar 0)
sqlite3 database.dev.sqlite \
  "SELECT COUNT(*) FROM leads
   WHERE clinic_id = 2 AND id IN (
     SELECT id FROM leads WHERE clinic_id = 3
   );"
```

---

## 🧪 Teste 3: Tentativa de Acesso Cross-Tenant (Deve Falhar)

```bash
# 1. Login como Clínica A e obter token
TOKEN_A="..."

# 2. Tentar acessar lead da Clínica B (deve retornar vazio ou erro)
curl -X GET "http://localhost:3001/api/leads?view=all" \
  -H "x-access-token: $TOKEN_A"
```

**Resultado esperado:**

- Deve retornar APENAS leads da Clínica A (clinic_id = 2)
- Leads da Clínica B (clinic_id = 3) NÃO devem aparecer
- Isolamento garantido pelo middleware

---

## 🧪 Teste 4: Frontend - Login via Interface

### Passo a Passo:

1. **Abrir navegador**: `http://localhost:3001/login.html`

2. **Login Clínica A**:
   - Email: `carlos@clinicaviva.com`
   - Senha: `clinica-a-2026`
   - Verificar no DevTools → Network → Response do `/api/auth/login`
   - Confirmar: `clinic.id = 2`, `clinic.name = "Clínica Viva"`

3. **Acessar Kanban**: `http://localhost:3001/admin.html`
   - Verificar no DevTools → Network → `/api/leads?view=kanban`
   - Confirmar que todos os leads têm `clinic_id = 2`

4. **Logout e Login Clínica B**:
   - Email: `patricia@saudetotal.com`
   - Senha: `clinica-b-2026`
   - Confirmar: `clinic.id = 3`, `clinic.name = "Saúde Total"`

5. **Acessar Kanban novamente**:
   - Verificar que leads são DIFERENTES
   - Todos os leads têm `clinic_id = 3`

---

## ✅ Checklist de Validação

- [ ] Login Clínica A retorna `clinic_id = 2` no JWT
- [ ] Login Clínica B retorna `clinic_id = 3` no JWT
- [ ] API `/api/leads` retorna apenas leads da clínica logada
- [ ] Leads da Clínica A não aparecem quando logado na Clínica B
- [ ] Leads da Clínica B não aparecem quando logado na Clínica A
- [ ] Kanban exibe colunas corretas por clínica
- [ ] Dashboard mostra estatísticas isoladas por clínica
- [ ] Não é possível acessar dados de outra clínica

---

## 🚀 Próximos Passos (Após Validação)

1. **Atualizar Frontend**:
   - Exibir nome da clínica no header
   - Mostrar plano atual (basic, professional, enterprise)
   - Badge de status (active, trial, suspended)

2. **Billing & Limites**:
   - Implementar verificação de limites por plano
   - Bloquear criação de leads se exceder max_patients
   - Sistema de upgrade de planos

3. **Analytics Multi-Tenant**:
   - Dashboard para Super Admin com todas as clínicas
   - Métricas consolidadas
   - Comparação entre clínicas

4. **Auditoria**:
   - Log de acessos cross-tenant (Super Admin)
   - Histórico de mudanças de planos
   - Rastreamento de uso por clínica
