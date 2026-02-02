# 📋 DIRETRIZES DO COPILOT - TechLog Clinic OS

> **DOCUMENTO OBRIGATÓRIO** - O Copilot DEVE seguir estas diretrizes em todas as alterações

---

## 🎯 VISÃO DO PRODUTO

### O que é o TechLog Clinic OS?

Um sistema SaaS **simples, intuitivo, bonito e moderno** para agendamento de clínicas médicas.

### Princípios de Design

1. **Simplicidade** - Menos é mais. Cada tela deve ter um propósito claro
2. **Intuitividade** - O usuário deve entender sem manual
3. **Beleza** - Interface limpa, moderna, cores consistentes
4. **Performance** - Respostas < 200ms, carregamento < 1s

---

## 🏗️ ARQUITETURA ALVO

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (public/js)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │   Pages     │  │  Components  │  │   Services   │  │   Utils     │   │
│  │ (entry pts) │──│  (reusable)  │──│  (API calls) │──│  (helpers)  │   │
│  └─────────────┘  └──────────────┘  └──────────────┘  └─────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP/REST
┌──────────────────────────────────────────────────────────────────────────┐
│                             BACKEND (src/)                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │   Routes    │  │ Controllers  │  │   Services   │  │Repositories │   │
│  │ (endpoints) │──│   (logic)    │──│  (business)  │──│   (data)    │   │
│  └─────────────┘  └──────────────┘  └──────────────┘  └─────────────┘   │
│                                                              │           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │           │
│  │ Middleware  │  │  Validators  │  │    Types     │        │           │
│  │ (auth/log)  │  │   (zod)      │  │ (interfaces) │        │           │
│  └─────────────┘  └──────────────┘  └──────────────┘        │           │
└──────────────────────────────────────────────────────────────│───────────┘
                                                               ▼
                                                    ┌──────────────────┐
                                                    │  SQLite Database │
                                                    └──────────────────┘
```

---

## 📁 ESTRUTURA DE DIRETÓRIOS OBRIGATÓRIA

```
src/
├── config/                   # Configurações centralizadas
│   ├── constants.ts          # TODAS as constantes do sistema
│   ├── database.config.ts    # Configuração do banco
│   └── app.config.ts         # Configuração da aplicação
│
├── controllers/              # Controladores (thin - apenas orquestração)
│   └── *.controller.ts       # DEVE usar Services, NÃO db direto
│
├── services/                 # Lógica de negócio
│   └── *.service.ts          # DEVE usar Repositories
│
├── repositories/             # Acesso a dados (ÚNICO lugar com SQL)
│   └── *.repository.ts       # TODA query SQL aqui
│
├── middleware/               # Middlewares Express
│   ├── auth.middleware.ts    # Autenticação
│   ├── tenant.middleware.ts  # Multi-tenant
│   ├── error.middleware.ts   # Tratamento de erros padronizado
│   └── audit.middleware.ts   # Auditoria
│
├── validators/               # Validação com Zod
│   └── *.validator.ts        # Schemas de validação
│
├── types/                    # Tipos TypeScript
│   └── *.types.ts            # Interfaces e types
│
├── routes/                   # Definição de rotas
│   └── *.routes.ts           # APENAS definição de rotas
│
└── shared/                   # Código compartilhado
    ├── constants/            # Constantes compartilhadas
    ├── utils/                # Utilitários puros
    └── errors/               # Classes de erro customizadas

public/js/
├── pages/                    # Entry points por página
│   ├── admin.js              # Dashboard admin
│   ├── kanban.js             # Kanban de pacientes
│   ├── agenda.js             # Agenda de consultas
│   └── patients.js           # Lista de pacientes
│
├── components/               # Componentes reutilizáveis
│   ├── modal.js              # Modal genérico
│   ├── toast.js              # Notificações
│   ├── table.js              # Tabela com paginação
│   └── form.js               # Formulários
│
├── services/                 # Chamadas de API
│   └── api.service.js        # ÚNICO ponto de acesso à API
│
└── utils/                    # Utilitários
    ├── date.utils.js         # Manipulação de datas
    ├── format.utils.js       # Formatação
    └── storage.utils.js      # LocalStorage/SessionStorage
```

---

## ⚠️ REGRAS OBRIGATÓRIAS

### 1. NUNCA fazer isso:

```typescript
// ❌ PROIBIDO: Controller acessando db diretamente
import { db } from '../database';

static async getPatient(req, res) {
    db.get('SELECT * FROM patients WHERE id = ?', [id], (err, row) => {
        // ...
    });
}
```

### 2. SEMPRE fazer isso:

```typescript
// ✅ CORRETO: Controller usando Service
import { PatientService } from '../services/patient.service';

static async getPatient(req, res) {
    try {
        const patient = await PatientService.findById(id, clinicId);
        res.json({ success: true, data: patient });
    } catch (error) {
        next(error); // Middleware de erro trata
    }
}

// ✅ CORRETO: Service usando Repository
// src/services/patient.service.ts
import { PatientRepository } from '../repositories/patient.repository';

export class PatientService {
    static async findById(id: number, clinicId: number): Promise<Patient> {
        const patient = await PatientRepository.findById(id, clinicId);
        if (!patient) {
            throw new NotFoundError('Paciente não encontrado');
        }
        return patient;
    }
}

// ✅ CORRETO: Repository com SQL isolado
// src/repositories/patient.repository.ts
import { db, dbAsync } from '../config/database.config';

export class PatientRepository {
    static async findById(id: number, clinicId: number): Promise<Patient | null> {
        return dbAsync.get<Patient>(
            'SELECT * FROM patients WHERE id = ? AND clinic_id = ? AND deleted_at IS NULL',
            [id, clinicId]
        );
    }
}
```

---

## 📌 CONSTANTES CENTRALIZADAS

### Criar: `src/config/constants.ts`

```typescript
// TODAS as constantes do sistema devem estar aqui

export const APP_CONFIG = {
  NAME: 'TechLog Clinic OS',
  VERSION: '1.0.0',
  DEFAULT_CLINIC_ID: 1,
  TOKEN_EXPIRY: '8h',
  SALT_ROUNDS: 10,
} as const;

export const CACHE_KEYS = {
  TOKEN: 'MEDICAL_CRM_TOKEN',
  USER: 'MEDICAL_CRM_USER',
  CLINIC: 'MEDICAL_CRM_CLINIC',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
} as const;

export const PATIENT_STATUSES = {
  WAITING: 'waiting',
  TRIAGE: 'triage',
  CONSULTATION: 'consultation',
  FINISHED: 'finished',
} as const;

export const LEAD_STATUSES = {
  NEW: 'novo',
  IN_PROGRESS: 'em_atendimento',
  SCHEDULED: 'agendado',
  FINISHED: 'finalizado',
  ARCHIVED: 'archived',
} as const;

export const ROUTES = {
  LOGIN: '/login.html',
  ADMIN: '/admin.html',
  KANBAN: '/kanban.html',
  AGENDA: '/agenda.html',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
  },
  LEADS: {
    BASE: '/api/leads',
    DASHBOARD: '/api/leads/dashboard',
  },
  PATIENTS: {
    BASE: '/api/patients',
    STATUS: (id: number) => `/api/patients/${id}/status`,
  },
  CALENDAR: {
    BASE: '/api/calendar',
  },
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    TOKEN_MISSING: 'Token de autenticação não fornecido',
    TOKEN_INVALID: 'Token inválido ou expirado',
    CREDENTIALS_INVALID: 'Credenciais inválidas',
    SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
  },
  CLINIC: {
    NOT_FOUND: 'Clínica não identificada',
    SUSPENDED: 'Clínica suspensa ou inativa',
  },
  PATIENT: {
    NOT_FOUND: 'Paciente não encontrado',
    INVALID_STATUS: 'Status inválido',
  },
  GENERAL: {
    SERVER_ERROR: 'Erro interno do servidor',
    VALIDATION_ERROR: 'Erro de validação',
  },
} as const;
```

---

## 🔴 ERROS PADRONIZADOS

### Criar: `src/shared/errors/AppError.ts`

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

### Criar: `src/middleware/error.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, error.message);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
    });
    return;
  }

  // Erro não tratado
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
  });
}
```

---

## 📝 PADRÃO DE RESPOSTA DA API

### Resposta de Sucesso

```json
{
    "success": true,
    "data": { ... },
    "meta": {
        "page": 1,
        "perPage": 20,
        "total": 150
    }
}
```

### Resposta de Erro

```json
{
  "success": false,
  "error": "Mensagem descritiva para o usuário",
  "code": "ERROR_CODE"
}
```

---

## 🎨 PADRÕES DO FRONTEND

### 1. API Service Único

```javascript
// public/js/services/api.service.js

import { CACHE_KEYS, API_ENDPOINTS, ROUTES } from '../config/constants.js';

class ApiService {
  getToken() {
    return sessionStorage.getItem(CACHE_KEYS.TOKEN);
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();

    const response = await fetch(endpoint, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (response.status === 401) {
      sessionStorage.clear();
      window.location.href = ROUTES.LOGIN;
      throw new Error('Sessão expirada');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
```

### 2. Componente Toast Padronizado

```javascript
// public/js/components/toast.js

const TOAST_TYPES = {
  success: { icon: '✅', bgColor: 'bg-green-500' },
  error: { icon: '❌', bgColor: 'bg-red-500' },
  warning: { icon: '⚠️', bgColor: 'bg-yellow-500' },
  info: { icon: 'ℹ️', bgColor: 'bg-blue-500' },
};

export function showToast(message, type = 'info', duration = 3000) {
  const { icon, bgColor } = TOAST_TYPES[type] || TOAST_TYPES.info;

  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in`;
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
```

---

## ✅ CHECKLIST ANTES DE CADA COMMIT

O Copilot DEVE verificar:

- [ ] Nenhum controller importa `db` diretamente
- [ ] Toda lógica de negócio está em Services
- [ ] Todo SQL está em Repositories
- [ ] Erros usam classes padronizadas
- [ ] Constantes vêm de `constants.ts`
- [ ] Respostas seguem o padrão `{ success, data/error }`
- [ ] Código não tem `console.log` de debug
- [ ] Funções têm tipagem TypeScript completa
- [ ] Testes unitários criados/atualizados

---

## 🔄 PLANO DE MIGRAÇÃO

### Fase 1: Infraestrutura (1 semana)

1. Criar `src/config/constants.ts`
2. Criar `src/shared/errors/`
3. Criar `src/middleware/error.middleware.ts`
4. Criar `src/config/database.config.ts` com wrapper async

### Fase 2: Repositories (2 semanas)

1. Criar `src/repositories/patient.repository.ts`
2. Criar `src/repositories/lead.repository.ts`
3. Criar `src/repositories/user.repository.ts`
4. Criar `src/repositories/clinic.repository.ts`
5. Criar `src/repositories/appointment.repository.ts`

### Fase 3: Services (2 semanas)

1. Criar `src/services/patient.service.ts`
2. Criar `src/services/lead.service.ts`
3. Criar `src/services/auth.service.ts`
4. Criar `src/services/clinic.service.ts`
5. Criar `src/services/appointment.service.ts`

### Fase 4: Refatorar Controllers (2 semanas)

1. Refatorar PatientController
2. Refatorar LeadController
3. Refatorar AuthController
4. Refatorar ClinicController
5. Refatorar CalendarController
6. Remover imports de `db` dos controllers

### Fase 5: Frontend (2 semanas)

1. Consolidar `api.service.js`
2. Criar `constants.js` compartilhado
3. Refatorar `kanban.js` em módulos menores
4. Padronizar `showToast` em único componente

### Fase 6: Testes (ongoing)

1. Testes para Repositories
2. Testes para Services
3. Testes para Controllers
4. Meta: 60% de cobertura

---

## 📊 MÉTRICAS DE QUALIDADE

| Métrica                   | Atual     | Meta    |
| ------------------------- | --------- | ------- |
| Cobertura de testes       | ~23%      | 60%     |
| Controllers com db direto | 11/11     | 0/11    |
| Linhas por arquivo        | até 1.776 | máx 300 |
| Tempo de resposta API     | ~300ms    | <200ms  |

---

## 🚫 O QUE NUNCA FAZER

1. **NUNCA** adicionar SQL em Controllers
2. **NUNCA** usar `console.log` para debug em produção
3. **NUNCA** hardcodar valores (usar constants.ts)
4. **NUNCA** criar arquivos com mais de 300 linhas
5. **NUNCA** duplicar funções utilitárias
6. **NUNCA** expor detalhes de erro do banco para o cliente
7. **NUNCA** pular a validação com Zod
8. **NUNCA** fazer commit sem testar a funcionalidade
9. **NUNCA** misturar lógica de negócio com apresentação
10. **NUNCA** ignorar erros (sempre try/catch ou .catch())

---

## ✨ O QUE SEMPRE FAZER

1. **SEMPRE** usar TypeScript com tipagem completa
2. **SEMPRE** validar entrada com Zod
3. **SEMPRE** usar Repository para acesso a dados
4. **SEMPRE** usar Service para lógica de negócio
5. **SEMPRE** retornar respostas no formato padrão
6. **SEMPRE** tratar erros com classes customizadas
7. **SEMPRE** escrever testes para código novo
8. **SEMPRE** usar constantes centralizadas
9. **SEMPRE** documentar funções públicas
10. **SEMPRE** fazer code review antes de merge

---

> **Última atualização:** 2026-02-02 **Versão:** 1.0.0 **Mantido por:** Equipe TechLog
