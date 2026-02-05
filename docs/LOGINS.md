# 🔐 Credenciais de Login do Sistema

Este documento contém todas as credenciais de login disponíveis no sistema TechLog Clinic OS.

> ⚠️ **Verificado em:** 05/02/2026 - Todas as credenciais abaixo foram testadas e estão funcionando.

---

## 🌐 Ambiente de Desenvolvimento/Teste

### Admin Padrão (Clínica Demo)

| Usuário | Senha       | Role         | Clínica        | Descrição                     |
| ------- | ----------- | ------------ | -------------- | ----------------------------- |
| `admin` | `Mudar123!` | clinic_admin | Clínica Padrão | Administrador da clínica demo |

---

## 🏥 Multi-Tenant (Clínicas Separadas)

> **Nota:** Todas as senhas do multi-tenant são `Mudar123!`

### Clínica A - Clínica Viva (Plano Enterprise)

| Usuário                  | Senha       | Role     | Descrição                  |
| ------------------------ | ----------- | -------- | -------------------------- |
| `carlos@clinicaviva.com` | `Mudar123!` | admin    | Dr. Carlos Silva (Owner)   |
| `maria@clinicaviva.com`  | `Mudar123!` | recepcao | Maria Santos (Recepção)    |
| `joao@clinicaviva.com`   | `Mudar123!` | recepcao | João Oliveira (Assistente) |

### Clínica B - Saúde Total (Plano Basic)

| Usuário                   | Senha       | Role     | Descrição                   |
| ------------------------- | ----------- | -------- | --------------------------- |
| `patricia@saudetotal.com` | `Mudar123!` | admin    | Dra. Patricia Alves (Owner) |
| `pedro@saudetotal.com`    | `Mudar123!` | recepcao | Pedro Costa (Atendente)     |

---

## 🧪 Testes E2E

Para execução de testes automatizados, use estas credenciais padrão:

```typescript
// Credenciais válidas (Admin)
username: 'admin';
password: 'Mudar123!';

// Multi-tenant (qualquer usuário)
username: 'carlos@clinicaviva.com';
password: 'Mudar123!';
```

---

## 🔧 Scripts de Diagnóstico

Para testar autenticação via API:

```bash
# Testar login via curl
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Mudar123!"}'
```

---

## ✅ Validação de Credenciais

Para garantir que as credenciais estão funcionando, execute:

```bash
npm run validate:logins
```

Este script testa todas as credenciais documentadas contra a API.

---

## 📝 Roles Disponíveis

| Role           | Permissões                                           |
| -------------- | ---------------------------------------------------- |
| `clinic_admin` | Admin da clínica, acesso completo na própria clínica |
| `admin`        | Administrador (alias para clinic_admin)              |
| `doctor`       | Médico, acesso a funcionalidades clínicas            |
| `recepcao`     | Recepção, gerencia leads e agendamentos              |
| `staff`        | Funcionário, acesso básico                           |

---

## 🚀 URLs de Acesso

| Ambiente    | URL                                   |
| ----------- | ------------------------------------- |
| Local       | http://localhost:3001/login.html      |
| Admin Panel | http://localhost:3001/admin.html      |
| SaaS Admin  | http://localhost:3001/saas-admin.html |

---

## ⚠️ Notas Importantes

1. **Fonte de verdade**: As credenciais estão centralizadas em
   `shared/constants/seed-credentials.ts`

2. **Ambiente de Produção**: As senhas acima são apenas para desenvolvimento/teste. Em produção, use
   senhas seguras.

3. **Hash de Senha**: O sistema usa `bcrypt` para hash de senhas com salt rounds de 10.

4. **JWT Token**: Após login, um token JWT é gerado com expiração de 8 horas.

5. **Seed Database**: Para popular o banco com dados de teste:

   ```bash
   # Seed multi-tenant
   npx ts-node scripts/seed_multi_tenant.ts

   # Validar credenciais
   npm run validate:logins
   ```

---

_Última atualização: 05 de Fevereiro de 2026_
