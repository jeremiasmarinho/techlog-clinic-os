# 🧪 E2E Test - Patient Creation Flow

## 📋 Descrição do Teste

Teste E2E automatizado que valida o fluxo completo de cadastro de paciente no frontend da aplicação
Medical CRM.

**Arquivo:** `tests/e2e/patient-creation.spec.ts`  
**Autor:** QA Automation Engineer  
**Data:** 2026-02-01

---

## 🎯 Objetivo

Garantir que um usuário consiga criar um novo paciente através da interface web e que o paciente
seja exibido corretamente no Kanban ou na lista de pacientes.

---

## 📊 Fluxo do Teste (6 Etapas)

### 1️⃣ Login no Sistema

```typescript
await loginAsAdmin(page);
```

- Acessa a página de login
- Preenche credenciais de admin
- Aguarda redirecionamento para admin.html

**Console Output:**

```
🔐 Step 1: Logging in as admin...
✅ Login successful!
```

---

### 2️⃣ Clicar no Botão "Novo Paciente"

```typescript
const newPatientButton = await findFirstVisible(page, [
  'button:has-text("Novo Paciente")',
  'button:has-text("Adicionar Paciente")',
  'button:has-text("Novo")',
  // ... múltiplos seletores para robustez
]);
```

**Seletores Verificados:**

- `button:has-text("Novo Paciente")`
- `button:has-text("Adicionar Paciente")`
- `button:has(i.fa-user-plus)`
- `#newPatientBtn`
- `#newLeadBtn`

**Console Output:**

```
🔍 Step 2: Searching for "Novo Paciente" button...
✅ Button found! Clicking...
```

---

### 3️⃣ Preencher Formulário de Paciente

**Campos Obrigatórios:** | Campo | Valor Exemplo | Seletores | |-------|---------------|-----------|
| **Nome** | `Paciente E2E 1738454789012` | `#patientName`, `#name`, `input[name="name"]` | |
**Telefone** | `(11) 98765-9012` | `#patientPhone`, `#phone`, `input[name="phone"]` | | **Email** |
`paciente.e2e.1738454789012@example.com` | `#patientEmail`, `#email`, `input[type="email"]` | |
**CPF** | `123.456.789-00` | `#patientCpf`, `#cpf`, `input[name="cpf"]` |

**Console Output:**

```
📝 Step 3: Filling patient form...
Patient data: {
  name: 'Paciente E2E 1738454789012',
  phone: '(11) 98765-9012',
  email: 'paciente.e2e.1738454789012@example.com',
  cpf: '123.456.789-00'
}
  ✅ Name filled: Paciente E2E 1738454789012
  ✅ Phone filled: (11) 98765-9012
  ✅ Email filled: paciente.e2e.1738454789012@example.com
  ✅ CPF filled: 123.456.789-00
```

**Técnica Utilizada:**

```typescript
async function fillIfEditable(page: Page, selectors: string[], value: string) {
  // Tenta múltiplos seletores até encontrar um campo editável
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0 && (await locator.isVisible())) {
      if (await locator.isEditable()) {
        await locator.fill(value);
        return true;
      }
    }
  }
  return false;
}
```

---

### 4️⃣ Clicar em "Salvar"

**Seletores do Botão Salvar:**

- `button:has-text("Salvar")`
- `button:has-text("Cadastrar")`
- `button[type="submit"]`
- `#savePatientBtn`

**Console Output:**

```
💾 Step 4: Submitting form...
✅ Save button found! Clicking...
```

---

### 5️⃣ Verificar Toast de Sucesso

**Seletores de Toast Verificados:**

- `.toast.success`
- `.toast:has-text("sucesso")`
- `.kanban-toast.success`
- `#notificationToast`
- `.swal2-success`

**Timeout:** 5000ms para cada seletor

**Console Output:**

```
⏳ Step 5: Waiting for success toast...
✅ Success toast found with selector: .toast.success
```

---

### 6️⃣ Verificar Paciente no Kanban ou Lista

#### Opção A: Verificar no Kanban (Primeira tentativa)

```typescript
const kanbanCardSelectors = [
  `#column-novo .lead-card:has-text("${patient.name}")`,
  `#column-waiting .lead-card:has-text("${patient.name}")`,
  `.kanban-column:first-child .lead-card:has-text("${patient.name}")`,
  `.lead-card:has-text("${patient.name}")`,
];
```

#### Opção B: Verificar na Lista de Pacientes (Fallback)

```typescript
// Navega para patients.html
const patientsLink = page.locator('a[href="patients.html"]').first();
await patientsLink.click();

// Busca linha da tabela com nome do paciente
const row = page.locator(`tr:has-text("${patient.name}")`).first();
await expect(row).toBeVisible({ timeout: 5000 });
```

**Console Output (Sucesso no Kanban):**

```
🔍 Step 6: Verifying patient appears in UI...
  🔍 Searching in Kanban columns...
  ✅ Patient found in Kanban with selector: #column-novo .lead-card:has-text("Paciente E2E 1738454789012")
🎉 TEST PASSED: Patient created and visible in Kanban!
```

**Console Output (Sucesso na Lista):**

```
🔍 Step 6: Verifying patient appears in UI...
  🔍 Searching in Kanban columns...
  🔍 Patient not in Kanban, checking patient list page...
  📄 Navigating to patients list...
  ✅ Patient found in patient list table!
🎉 TEST PASSED: Patient created and visible in list!
```

---

## 📸 Screenshot Automático em Falha

### Captura Automática

```typescript
try {
  // ... todo o teste
} catch (error) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = `test-results/patient-creation-failure-${timestamp}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.error(`📸 Screenshot saved to: ${screenshotPath}`);
  throw error;
}
```

### Localização dos Screenshots

- **Pasta:** `test-results/`
- **Formato:** `patient-creation-failure-YYYY-MM-DDTHH-mm-ss-SSSZ.png`
- **Exemplo:** `patient-creation-failure-2026-02-01T14-30-45-123Z.png`

### Tipo de Captura

- **Modo:** Página completa (`fullPage: true`)
- **Inclui:** Todo o conteúdo visível + scroll

---

## 🚀 Como Executar

### Executar Teste Individual

```bash
npm run test:e2e -- patient-creation.spec.ts
```

### Executar com Interface Gráfica (Debug)

```bash
npm run test:e2e:ui -- patient-creation.spec.ts
```

### Executar em Modo Headed (Ver Browser)

```bash
npm run test:e2e:headed -- patient-creation.spec.ts
```

### Executar com Debug Completo

```bash
npm run test:e2e:debug -- patient-creation.spec.ts
```

---

## ✅ Validações Implementadas

### Validações Estruturais

- [x] Botão "Novo Paciente" existe e é clicável
- [x] Modal de formulário abre após clicar no botão
- [x] Todos os campos obrigatórios estão presentes e editáveis
- [x] Botão "Salvar" existe e é clicável

### Validações de Dados

- [x] Nome é preenchido corretamente
- [x] Telefone é preenchido corretamente
- [x] Email é preenchido corretamente
- [x] CPF é preenchido corretamente

### Validações de Feedback

- [x] Toast de sucesso aparece após salvar
- [x] Toast contém mensagem de sucesso

### Validações de Persistência

- [x] Paciente aparece no Kanban (coluna "Novo" ou primeira coluna)
- [x] OU paciente aparece na lista de pacientes (patients.html)

---

## 🎯 Casos de Teste Cobertos

### ✅ Caso 1: Cadastro Bem-Sucedido com Exibição no Kanban

**Given:** Usuário autenticado  
**When:** Preenche todos os campos e clica em Salvar  
**Then:**

- Toast de sucesso aparece
- Paciente é exibido na primeira coluna do Kanban

### ✅ Caso 2: Cadastro Bem-Sucedido com Exibição na Lista

**Given:** Usuário autenticado  
**When:** Preenche todos os campos e clica em Salvar  
**Then:**

- Toast de sucesso aparece
- Paciente é exibido na página patients.html

### ❌ Caso 3: Falha na Criação (Screenshot Capturado)

**Given:** Qualquer erro durante o fluxo  
**When:** Teste falha  
**Then:**

- Screenshot completo é salvo em test-results/
- Erro detalhado é exibido no console

---

## 📊 Estratégia de Robustez

### Múltiplos Seletores por Campo

Cada campo tem 3-5 seletores alternativos para garantir compatibilidade:

```typescript
const nameSelectors = [
  '#patientName', // ID específico
  '#name', // ID genérico
  'input[name="name"]', // Atributo name
  'input[placeholder*="nome" i]', // Placeholder (case-insensitive)
  '#editLeadName', // ID alternativo
];
```

### Timeouts Configuráveis

- **Modal:** 500ms
- **Toast:** 5000ms (5s)
- **Kanban/Lista:** 3000ms (3s)

### Estratégia de Fallback

1. ✅ Tenta encontrar no Kanban (múltiplas colunas)
2. ✅ Se falhar, tenta na lista de pacientes
3. ❌ Se ambos falharem, captura screenshot e falha o teste

---

## 📈 Métricas de Performance

| Etapa                | Tempo Esperado |
| -------------------- | -------------- |
| Login                | ~2-3s          |
| Abrir Modal          | ~500ms         |
| Preencher Formulário | ~1s            |
| Salvar               | ~500ms         |
| Toast Aparecer       | 1-5s           |
| Verificação Final    | 1.5-3s         |
| **Total**            | **~7-13s**     |

---

## 🐛 Troubleshooting

### Erro: "Botão 'Novo Paciente' não encontrado"

**Causa:** UI mudou ou botão tem outro texto/seletor  
**Solução:** Adicionar novo seletor na lista de `newPatientButton`

### Erro: "Campo X não encontrado/editável"

**Causa:** Campo tem ID/name diferente  
**Solução:** Adicionar novo seletor na lista do campo específico

### Erro: "Toast de sucesso não foi exibido"

**Causa:** Toast tem classe CSS diferente ou não aparece  
**Solução:**

1. Verificar se requisição foi bem-sucedida (Network tab)
2. Adicionar novo seletor na lista de `toastSelectors`

### Erro: "Paciente não encontrado"

**Causa:** Nome do paciente não aparece na UI  
**Solução:**

1. Verificar screenshot gerado
2. Verificar se API criou o paciente (Database)
3. Verificar se nome está correto (timestamp único)

---

## 🔍 Console Output Exemplo

### Teste Bem-Sucedido

```
🔐 Step 1: Logging in as admin...
✅ Login successful!
🧪 Starting patient creation E2E test...
🔍 Step 2: Searching for "Novo Paciente" button...
✅ Button found! Clicking...
🔍 Waiting for patient form modal...
✅ Modal opened successfully!
📝 Step 3: Filling patient form...
Patient data: { name: 'Paciente E2E 1738454789012', phone: '(11) 98765-9012', ... }
  ✅ Name filled: Paciente E2E 1738454789012
  ✅ Phone filled: (11) 98765-9012
  ✅ Email filled: paciente.e2e.1738454789012@example.com
  ✅ CPF filled: 123.456.789-00
💾 Step 4: Submitting form...
✅ Save button found! Clicking...
⏳ Step 5: Waiting for success toast...
✅ Success toast found with selector: .toast.success
🔍 Step 6: Verifying patient appears in UI...
  🔍 Searching in Kanban columns...
  ✅ Patient found in Kanban with selector: #column-novo .lead-card:has-text("Paciente E2E 1738454789012")
🎉 TEST PASSED: Patient created and visible in Kanban!
```

### Teste com Falha

```
🔐 Step 1: Logging in as admin...
✅ Login successful!
🧪 Starting patient creation E2E test...
🔍 Step 2: Searching for "Novo Paciente" button...
❌ Botão "Novo Paciente" não encontrado na UI

═══════════════════════════════════════════════════════════
❌ TEST FAILED: Patient Creation E2E Test
═══════════════════════════════════════════════════════════
📸 Screenshot saved to: test-results/patient-creation-failure-2026-02-01T14-30-45-123Z.png

Error details: Error: ❌ Botão "Novo Paciente" não encontrado na UI
═══════════════════════════════════════════════════════════
```

---

## 📝 Conclusão

Este teste E2E valida o **fluxo crítico** de cadastro de paciente com:

- ✅ Cobertura completa (6 etapas)
- ✅ Múltiplos seletores para robustez
- ✅ Screenshot automático em falha
- ✅ Console logging detalhado
- ✅ Verificação em Kanban E lista
- ✅ Dados únicos por execução (timestamp)

**Status:** ✅ Pronto para produção
