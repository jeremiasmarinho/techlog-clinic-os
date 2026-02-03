# 🔐 Credenciais de Login do Sistema

Este documento contém todas as credenciais de login disponíveis no sistema TechLog Clinic OS.

---

## 🌐 Ambiente de Desenvolvimento/Teste

### Super Admin (Acesso Total)

| Usuário      | Senha       | Role        | Descrição                    |
| ------------ | ----------- | ----------- | ---------------------------- |
| `superadmin` | `Mudar123!` | super_admin | Administrador global do SaaS |

### Admin Padrão (Seed Principal)

| Usuário | Senha       | Role         | Descrição                     |
| ------- | ----------- | ------------ | ----------------------------- |
| `admin` | `Mudar123!` | clinic_admin | Administrador da clínica demo |
| `admin` | `123`       | admin        | (Seed antigo - force_seed)    |

### Staff/Funcionários

| Usuário      | Senha       | Role  | Descrição         |
| ------------ | ----------- | ----- | ----------------- |
| `joao.silva` | `Mudar123!` | staff | Funcionário/Staff |

---

## 🏥 Multi-Tenant (Clínicas Separadas)

### Clínica A - Clínica Viva (Plano Enterprise)

| Usuário                  | Senha            | Role     | Descrição                  |
| ------------------------ | ---------------- | -------- | -------------------------- |
| `carlos@clinicaviva.com` | `clinica-a-2026` | admin    | Dr. Carlos Silva (Owner)   |
| `maria@clinicaviva.com`  | `staff123`       | recepcao | Maria Santos (Recepção)    |
| `joao@clinicaviva.com`   | `staff123`       | recepcao | João Oliveira (Assistente) |

### Clínica B - Saúde Total (Plano Basic)

| Usuário                   | Senha            | Role     | Descrição                   |
| ------------------------- | ---------------- | -------- | --------------------------- |
| `patricia@saudetotal.com` | `clinica-b-2026` | admin    | Dra. Patricia Alves (Owner) |
| `pedro@saudetotal.com`    | `staff123`       | recepcao | Pedro Costa (Atendente)     |

---

## 🧪 Testes E2E

Para execução de testes automatizados, use estas credenciais padrão:

```typescript
// Credenciais válidas
username: 'admin';
password: 'Mudar123!';

// Super Admin
username: 'superadmin';
password: 'Mudar123!';

// Staff
username: 'joao.silva';
password: 'Mudar123!';
```

---

## 🔧 Scripts de Diagnóstico

Para testar autenticação via API:

```javascript
// diagnose-auth.js
email: 'admin@medicalcrm.com';
password: 'Mudar123!';
```

---

## 📝 Roles Disponíveis

| Role           | Permissões                                           |
| -------------- | ---------------------------------------------------- |
| `super_admin`  | Acesso total, gerencia todas as clínicas             |
| `clinic_admin` | Admin da clínica, acesso completo na própria clínica |
| `admin`        | Administrador (alias para clinic_admin)              |
| `doctor`       | Médico, acesso a funcionalidades clínicas            |
| `staff`        | Funcionário, acesso básico                           |
| `recepcao`     | Recepção, gerencia leads e agendamentos              |

---

## 🚀 URLs de Acesso

| Ambiente    | URL                                   |
| ----------- | ------------------------------------- |
| Local       | http://localhost:3001/login.html      |
| Admin Panel | http://localhost:3001/admin.html      |
| SaaS Admin  | http://localhost:3001/saas-admin.html |

---

## ⚠️ Notas Importantes

1. **Ambiente de Produção**: As senhas acima são apenas para desenvolvimento/teste. Em produção, use
   senhas seguras.

2. **Hash de Senha**: O sistema usa `bcrypt` para hash de senhas com salt rounds de 10.

3. **JWT Token**: Após login, um token JWT é gerado com expiração configurável.

4. **Seed Database**: Para popular o banco com dados de teste:

   ```bash
   # Seed padrão
   npm run db:seed

   # Seed multi-tenant
   npx ts-node scripts/seed_multi_tenant.ts

   # Force seed (dados realistas)
   npx ts-node scripts/force_seed.ts
   ```

---

_Última atualização: Fevereiro 2026_
