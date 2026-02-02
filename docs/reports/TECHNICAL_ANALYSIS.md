# 🔍 ANÁLISE TÉCNICA - TechLog Clinic OS

> Diagnóstico completo do sistema e causa raiz dos problemas de quebra

---

## 📊 RESUMO EXECUTIVO

| Área            | Severidade | Problemas                           | Impacto            |
| --------------- | ---------- | ----------------------------------- | ------------------ |
| **Acoplamento** | 🔴 Crítico | 11/11 controllers acessam DB direto | Quebras em cascata |
| **Duplicação**  | 🔴 Crítico | 5+ implementações de showToast      | Inconsistência     |
| **Testes**      | 🔴 Crítico | 9/11 controllers sem testes         | Regressões         |
| **Erros**       | 🟡 Alto    | 3 formatos diferentes               | UX inconsistente   |
| **Frontend**    | 🟡 Alto    | Arquivo com 1.776 linhas            | Manutenção difícil |

---

## 🔴 PROBLEMA PRINCIPAL: ACOPLAMENTO FORTE

### O que está acontecendo?

Quando você altera uma parte do sistema, outra quebra porque:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SITUAÇÃO ATUAL (RUIM)                       │
│                                                                 │
│   Controller A ──┐                                              │
│   Controller B ──┼──> db (import direto) ──> SQLite             │
│   Controller C ──┘         │                                    │
│                            │                                    │
│   Qualquer mudança no schema do banco afeta TODOS              │
│   os controllers de uma vez                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Exemplo Real do Seu Código

```typescript
// LeadController.ts - ACOPLADO
import { db } from '../database';

static index(req: Request, res: Response): void {
    // 90 linhas de SQL inline
    let query = "SELECT * FROM leads WHERE status != 'archived'";
    // ... construção complexa de query ...
    db.all(query, params, (err, rows) => { ... });
}

// PatientController.ts - TAMBÉM ACOPLADO
import { db } from '../database';

static updateStatus(req: Request, res: Response): void {
    db.run('UPDATE patients SET status = ?...', [...], function(err) { ... });
}
```

### Por que isso é um problema?

1. **Mudou o nome de uma coluna?** → Alterar em 11 controllers
2. **Mudou a estrutura de uma tabela?** → Alterar em vários lugares
3. **Quer testar um controller?** → Precisa do banco real
4. **Quer reutilizar uma query?** → Copiar e colar (duplicação)

---

## 🔴 INVENTÁRIO DE PROBLEMAS

### 1. Controllers Acessando Banco Diretamente

| Controller             | Linhas de SQL | Risco    |
| ---------------------- | ------------- | -------- |
| LeadController         | ~150          | 🔴 Alto  |
| AuthController         | ~40           | 🔴 Alto  |
| CalendarController     | ~100          | 🔴 Alto  |
| ClinicController       | ~60           | 🔴 Alto  |
| ClinicInfoController   | ~30           | 🟡 Médio |
| FinancialController    | ~80           | 🔴 Alto  |
| MetricsController      | ~50           | 🟡 Médio |
| PatientController      | ~120          | 🔴 Alto  |
| PrescriptionController | ~40           | 🟡 Médio |
| SaaSController         | ~100          | 🔴 Alto  |
| UserController         | ~80           | 🔴 Alto  |

**Total: ~850 linhas de SQL espalhadas em 11 arquivos**

### 2. Código Duplicado

#### 2.1 Função `showToast` (5+ implementações)

```javascript
// Versão 1 - admin-dashboard.js
function showToast(message, type) {
  const toast = document.createElement('div');
  // ... implementação A
}

// Versão 2 - kanban.js
function showToast(msg, type) {
  const notification = document.createElement('div');
  // ... implementação B (diferente!)
}

// Versão 3 - agenda.js
function showToast(text, style) {
  // ... implementação C
}
```

#### 2.2 Validação de Clínica (18+ ocorrências)

```typescript
// Repetido em TODOS os controllers
if (!clinicId) {
  res.status(401).json({ error: 'Clínica não identificada' });
  return;
}
```

#### 2.3 Obtenção de Token (20+ ocorrências)

```javascript
// Frontend - repetido em cada arquivo
const token =
  sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
  sessionStorage.getItem('token') ||
  sessionStorage.getItem('accessToken');
```

### 3. Valores Hardcoded

| Valor                 | Onde                | Problema        |
| --------------------- | ------------------- | --------------- |
| `clinic_id = 1`       | Vários              | ID mágico       |
| `150`                 | FinancialController | Preço hardcoded |
| `'MEDICAL_CRM_TOKEN'` | 20+ lugares         | String repetida |
| `/login.html`         | 10+ lugares         | URL hardcoded   |
| `bcrypt(10)`          | 3 lugares           | Salt hardcoded  |

### 4. Arquivos Muito Grandes

| Arquivo                             | Linhas | Ideal |
| ----------------------------------- | ------ | ----- |
| `public/js/crm/kanban.js`           | 1.776  | <300  |
| `public/js/saas/saas-dashboard.js`  | 1.023  | <300  |
| `src/database/index.ts`             | 617    | <200  |
| `src/controllers/LeadController.ts` | 352    | <200  |

### 5. Formatos de Erro Inconsistentes

```typescript
// Formato 1
res.status(500).json({ error: err.message });

// Formato 2
res.status(401).json({ error: 'Credenciais inválidas' });

// Formato 3
res.status(500).json({
  error: 'Erro',
  message: err.message,
  stack: err.stack, // ❌ Expõe detalhes internos!
});
```

### 6. Cobertura de Testes

```
Controllers com testes: 2/11 (18%)
Services com testes: 0/1 (0%)
Middlewares com testes: 0/4 (0%)
Repositories com testes: 0/2 (0%)
Validators com testes: 0/2 (0%)

Cobertura geral: ~23%
```

---

## 🏗️ ARQUITETURA PROPOSTA

### Camadas de Responsabilidade

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARQUITETURA NOVA (BOA)                      │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Route   │───▶│Controller│───▶│ Service  │───▶│Repository│  │
│  │          │    │(orquestra│    │(regras de│    │(SQL puro)│  │
│  │          │    │ só)      │    │negócio)  │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                       │               │               │         │
│                       ▼               ▼               ▼         │
│                  Middleware      Validators        Database     │
│                  (auth, log)      (Zod)            (SQLite)    │
└─────────────────────────────────────────────────────────────────┘
```

### Exemplo de Fluxo Correto

```typescript
// 1. ROUTE - Define endpoint
router.get('/:id', tenantMiddleware, PatientController.show);

// 2. CONTROLLER - Orquestra (SEM SQL)
static async show(req: Request, res: Response, next: NextFunction) {
    try {
        const patient = await PatientService.findById(
            Number(req.params.id),
            req.clinicId!
        );
        res.json({ success: true, data: patient });
    } catch (error) {
        next(error);
    }
}

// 3. SERVICE - Lógica de negócio
static async findById(id: number, clinicId: number): Promise<Patient> {
    const patient = await PatientRepository.findById(id, clinicId);
    if (!patient) {
        throw new NotFoundError('Paciente não encontrado');
    }
    return patient;
}

// 4. REPOSITORY - SQL isolado
static async findById(id: number, clinicId: number): Promise<Patient | null> {
    return db.getAsync<Patient>(
        'SELECT * FROM patients WHERE id = ? AND clinic_id = ?',
        [id, clinicId]
    );
}
```

---

## 📋 PLANO DE AÇÃO DETALHADO

### Fase 1: Fundação (1-2 semanas)

#### 1.1 Criar Constantes Centralizadas

```
src/config/constants.ts
├── APP_CONFIG
├── CACHE_KEYS
├── HTTP_STATUS
├── PATIENT_STATUSES
├── LEAD_STATUSES
├── ERROR_MESSAGES
└── API_ENDPOINTS
```

#### 1.2 Criar Sistema de Erros

```
src/shared/errors/
├── AppError.ts
├── NotFoundError.ts
├── ValidationError.ts
├── UnauthorizedError.ts
└── ForbiddenError.ts
```

#### 1.3 Criar Middleware de Erro

```
src/middleware/error.middleware.ts
```

#### 1.4 Criar Wrapper Async para Database

```typescript
// src/config/database.config.ts
export const dbAsync = {
    get<T>(sql: string, params: any[]): Promise<T | null>,
    all<T>(sql: string, params: any[]): Promise<T[]>,
    run(sql: string, params: any[]): Promise<{ lastID: number, changes: number }>,
};
```

---

### Fase 2: Repositories (2-3 semanas)

#### Criar um Repository por entidade:

```
src/repositories/
├── base.repository.ts        # Classe base com métodos comuns
├── patient.repository.ts     # CRUD de pacientes
├── lead.repository.ts        # CRUD de leads
├── user.repository.ts        # CRUD de usuários
├── clinic.repository.ts      # CRUD de clínicas
├── appointment.repository.ts # CRUD de agendamentos
├── medical-record.repository.ts
└── prescription.repository.ts
```

#### Exemplo de Repository:

```typescript
// src/repositories/patient.repository.ts
import { dbAsync } from '../config/database.config';
import { Patient } from '../types/patient.types';

export class PatientRepository {
  static async findById(id: number, clinicId: number): Promise<Patient | null> {
    return dbAsync.get<Patient>(
      `SELECT * FROM patients 
             WHERE id = ? AND clinic_id = ? AND deleted_at IS NULL`,
      [id, clinicId]
    );
  }

  static async findAll(clinicId: number, filters: PatientFilters): Promise<Patient[]> {
    let sql = `SELECT * FROM patients WHERE clinic_id = ?`;
    const params: any[] = [clinicId];

    if (filters.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY created_at DESC`;

    return dbAsync.all<Patient>(sql, params);
  }

  static async create(data: CreatePatientDTO): Promise<number> {
    const result = await dbAsync.run(
      `INSERT INTO patients (name, phone, clinic_id) VALUES (?, ?, ?)`,
      [data.name, data.phone, data.clinicId]
    );
    return result.lastID;
  }

  static async update(id: number, clinicId: number, data: UpdatePatientDTO): Promise<void> {
    await dbAsync.run(
      `UPDATE patients SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND clinic_id = ?`,
      [data.name, data.phone, id, clinicId]
    );
  }

  static async softDelete(id: number, clinicId: number): Promise<void> {
    await dbAsync.run(
      `UPDATE patients SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?`,
      [id, clinicId]
    );
  }
}
```

---

### Fase 3: Services (2-3 semanas)

#### Criar um Service por domínio:

```
src/services/
├── auth.service.ts           # Login, logout, refresh token
├── patient.service.ts        # Lógica de pacientes
├── lead.service.ts           # Lógica de leads
├── clinic.service.ts         # Lógica de clínicas
├── appointment.service.ts    # Lógica de agendamentos
├── financial.service.ts      # Lógica financeira
└── prescription-pdf.service.ts # (já existe)
```

#### Exemplo de Service:

```typescript
// src/services/patient.service.ts
import { PatientRepository } from '../repositories/patient.repository';
import { NotFoundError, ValidationError } from '../shared/errors';
import { PATIENT_STATUSES } from '../config/constants';

export class PatientService {
  static async findById(id: number, clinicId: number): Promise<Patient> {
    const patient = await PatientRepository.findById(id, clinicId);
    if (!patient) {
      throw new NotFoundError('Paciente não encontrado');
    }
    return patient;
  }

  static async updateStatus(id: number, clinicId: number, newStatus: string): Promise<void> {
    // Validação de negócio
    if (!Object.values(PATIENT_STATUSES).includes(newStatus)) {
      throw new ValidationError('Status inválido');
    }

    const patient = await PatientRepository.findById(id, clinicId);
    if (!patient) {
      throw new NotFoundError('Paciente não encontrado');
    }

    // Regra de negócio: só pode ir para "finished" se estiver em "consultation"
    if (
      newStatus === PATIENT_STATUSES.FINISHED &&
      patient.status !== PATIENT_STATUSES.CONSULTATION
    ) {
      throw new ValidationError('Paciente precisa estar em consulta para finalizar');
    }

    await PatientRepository.updateStatus(id, clinicId, newStatus);
  }
}
```

---

### Fase 4: Refatorar Controllers (2-3 semanas)

#### Transformar Controllers de:

```typescript
// ANTES: Controller gordo com SQL
static index(req: Request, res: Response): void {
    const clinicId = req.clinicId;
    if (!clinicId) {
        res.status(401).json({ error: 'Clínica não identificada' });
        return;
    }

    db.all('SELECT * FROM patients WHERE clinic_id = ?', [clinicId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
}
```

#### Para:

```typescript
// DEPOIS: Controller magro usando Service
static async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const patients = await PatientService.findAll(req.clinicId!, req.query);
        res.json({ success: true, data: patients });
    } catch (error) {
        next(error); // Middleware de erro trata
    }
}
```

---

### Fase 5: Frontend (2-3 semanas)

#### 5.1 Consolidar Utilitários

```
public/js/
├── config/
│   └── constants.js          # Constantes compartilhadas
├── services/
│   └── api.service.js        # ÚNICO serviço de API
├── components/
│   ├── toast.js              # ÚNICO componente de notificação
│   ├── modal.js              # ÚNICO componente de modal
│   └── ...
└── utils/
    ├── date.utils.js         # ÚNICO utilitário de datas
    ├── format.utils.js       # ÚNICO utilitário de formatação
    └── storage.utils.js      # ÚNICO utilitário de storage
```

#### 5.2 Quebrar Arquivos Grandes

```
public/js/crm/kanban.js (1.776 linhas)
    ↓ dividir em:
├── kanban-board.js           # Lógica do board (~200 linhas)
├── kanban-card.js            # Componente de card (~150 linhas)
├── kanban-column.js          # Componente de coluna (~100 linhas)
├── kanban-filters.js         # Filtros (~100 linhas)
├── kanban-drag-drop.js       # Drag & drop (~150 linhas)
└── kanban-api.js             # Chamadas de API (~100 linhas)
```

---

### Fase 6: Testes (Contínuo)

#### Meta: 60% de cobertura

| Componente   | Testes Necessários |
| ------------ | ------------------ |
| Repositories | 30 testes          |
| Services     | 40 testes          |
| Controllers  | 30 testes          |
| Middlewares  | 15 testes          |
| Validators   | 10 testes          |
| **Total**    | ~125 testes        |

---

## 📊 DASHBOARD DE PROGRESSO

### Criar em: `docs/REFACTORING_PROGRESS.md`

```markdown
# 📊 Progresso da Refatoração

## Fase 1: Fundação

- [ ] constants.ts criado
- [ ] Erros padronizados criados
- [ ] Middleware de erro criado
- [ ] Database async wrapper criado

## Fase 2: Repositories

- [ ] patient.repository.ts
- [ ] lead.repository.ts
- [ ] user.repository.ts
- [ ] clinic.repository.ts
- [ ] appointment.repository.ts

## Fase 3: Services

- [ ] patient.service.ts
- [ ] lead.service.ts
- [ ] auth.service.ts
- [ ] clinic.service.ts
- [ ] appointment.service.ts

## Fase 4: Controllers (Refatorados)

- [ ] PatientController
- [ ] LeadController
- [ ] AuthController
- [ ] ClinicController
- [ ] CalendarController
- [ ] FinancialController
- [ ] MetricsController
- [ ] PrescriptionController
- [ ] SaaSController
- [ ] UserController
- [ ] ClinicInfoController

## Fase 5: Frontend

- [ ] constants.js consolidado
- [ ] api.service.js refatorado
- [ ] toast.js único
- [ ] kanban.js dividido

## Cobertura de Testes

- Atual: 23%
- Meta: 60%
```

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **ESTA SEMANA:**
   - Criar `src/config/constants.ts`
   - Criar `src/shared/errors/AppError.ts`
   - Criar `src/middleware/error.middleware.ts`

2. **PRÓXIMA SEMANA:**
   - Criar `src/config/database.config.ts` (async wrapper)
   - Criar primeiro Repository: `patient.repository.ts`
   - Migrar PatientController para usar Repository

3. **SEMANA 3:**
   - Criar `lead.repository.ts`
   - Criar `user.repository.ts`
   - Criar primeiros Services

---

## ❓ FAQ

### "Por que não usar um ORM como Prisma?"

Para este projeto, um ORM seria over-engineering. O padrão Repository com SQL puro é suficiente e dá
controle total sobre as queries.

### "Quanto tempo vai levar a refatoração completa?"

Estimativa: 8-12 semanas com desenvolvimento paralelo às features novas.

### "Posso continuar desenvolvendo features durante a refatoração?"

Sim! Siga as novas diretrizes para código novo. Código antigo será migrado gradualmente.

### "E se eu precisar fazer uma correção urgente no código antigo?"

Faça a correção mínima necessária. Anote o local para refatoração posterior.

---

> **Documento gerado em:** 2026-02-02  
> **Próxima revisão:** Semanal
