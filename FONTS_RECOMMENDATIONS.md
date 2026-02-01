# 💡 Recomendações: Fontes PDFKit

**Data:** 01/02/2026  
**Versão:** 1.0  
**Tipo:** Action Items + Best Practices  
**Status:** 📋 Priorizado

---

## 🎯 Visão Geral

Este documento contém **recomendações priorizadas** para garantir sucesso na implementação de fontes
PDFKit em produção.

---

## 🔴 CRÍTICAS - Fazer Imediatamente (< 24h)

### C1: Proteger Rota de Debug `/debug/pdf-test`

**Prioridade:** 🔴 Crítica  
**Esforço:** ⏱️ 5 minutos  
**Impacto:** 🛡️ Segurança  
**Responsável:** DevOps/Backend

#### Problema

Rota `/debug/pdf-test` está **pública** e acessível sem autenticação.

#### Risco

- Possível uso indevido de recursos
- Geração não autorizada de PDFs
- Exposição de informações do sistema

#### Solução 1: Adicionar Autenticação (Recomendado)

```typescript
// Em src/server.ts
import { tenantMiddleware } from './middleware/tenant.middleware';
import { adminRoleMiddleware } from './middleware/role.middleware';

this.app.get(
  '/debug/pdf-test',
  tenantMiddleware, // Valida JWT
  adminRoleMiddleware, // Requer role admin
  async (_req, res) => {
    // ... código existente
  }
);
```

**Resultado:**

- ✅ Apenas administradores podem acessar
- ✅ Mantém rota disponível para debug
- ✅ Logs de acesso (audit trail)

#### Solução 2: Rate Limiting (Alternativa)

```typescript
// Em src/server.ts
import rateLimit from 'express-rate-limit';

const debugLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requests
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

this.app.get('/debug/pdf-test', debugLimiter, async (_req, res) => {
  // ... código existente
});
```

**Resultado:**

- ✅ Protege contra abuso
- ⚠️ Ainda pública (menos seguro)

#### Solução 3: Remover Rota (Após Validação)

```typescript
// Em src/server.ts
// Comentar após validar que PDFs funcionam:
/*
this.app.get('/debug/pdf-test', async (_req, res) => {
    // ... código
});
*/
```

**Resultado:**

- ✅ Mais seguro
- ❌ Perde capacidade de debug em produção

#### Recomendação Final

**Solução 1** (autenticação) - melhor equilíbrio entre segurança e utilidade.

---

### C2: Deploy e Instalação de Fontes

**Prioridade:** 🔴 Crítica  
**Esforço:** ⏱️ 15 minutos  
**Impacto:** ⚙️ Funcionalidade  
**Responsável:** DevOps

#### Checklist de Deploy

**Passo 1: Deploy da Aplicação**

```bash
ssh usuario@servidor-vps
cd /home/techlog-api

# Deploy automático
bash scripts/deploy-prod.sh

# Confirmar quando solicitado
# Aguardar conclusão (2-3 minutos)
```

**Passo 2: Instalar Fontes** (⚠️ REQUER SUDO)

```bash
# No servidor VPS
sudo bash scripts/install-fonts.sh

# Aceitar EULA das Microsoft Core Fonts
# Aguardar instalação (2-5 minutos)
```

**Passo 3: Verificar Instalação**

```bash
# Verificar fontes instaladas
fc-list | grep -i liberation | wc -l
# Esperado: pelo menos 3

# Verificar aplicação rodando
pm2 list
# Esperado: techlog-api = online

# Ver logs
pm2 logs techlog-api --lines 20
# Esperado: sem erros
```

**Passo 4: Testar PDF**

```bash
# Gerar PDF de teste
curl -o test-fonts.pdf http://localhost:3000/debug/pdf-test

# Verificar arquivo
ls -lh test-fonts.pdf
# Esperado: 10-30 KB

# Baixar para análise (do seu computador local)
scp usuario@servidor:/home/techlog-api/test-fonts.pdf ./
```

**Passo 5: Validar PDF**

- [ ] Abrir test-fonts.pdf
- [ ] Verificar todos os acentos (á, é, ã, ç)
- [ ] Verificar símbolos (©, ®, ™)
- [ ] Nenhum "?" ou quadrado vazio

#### Em Caso de Problema

**Problema: Fontes não instalaram**

```bash
sudo apt-get update
sudo bash scripts/install-fonts.sh
sudo fc-cache -f -v
```

**Problema: PDF em branco**

```bash
pm2 logs techlog-api --err
# Analisar erro específico
```

**Problema: Caracteres quebrados**

```bash
# Reinstalar fontes DejaVu
sudo apt-get install --reinstall fonts-dejavu
sudo fc-cache -f -v
pm2 restart techlog-api
```

---

### C3: Testar Receitas Médicas Reais

**Prioridade:** 🔴 Crítica  
**Esforço:** ⏱️ 10 minutos  
**Impacto:** ✅ Validação  
**Responsável:** QA/Product Owner

#### Cenário de Teste

**Teste 1: Receita com Acentos**

1. Login no sistema
2. Criar nova receita
3. Adicionar medicamento:
   ```
   Paracetamol 500mg - Administração oral
   Posologia: Tomar 1 comprimido a cada 6 horas
   Observações: Não ingerir bebidas alcoólicas
   ```
4. Gerar PDF
5. Abrir e verificar acentos

**Critério de Sucesso:**

- ✅ PDF abre sem erro
- ✅ "Administração" legível
- ✅ "Posologia" legível
- ✅ "Observações", "Não", "alcoólicas" legíveis
- ✅ Nenhum "?" ou quadrado vazio

**Teste 2: Receita com Nome do Médico**

1. Criar receita
2. Nome do médico: "Dr. José Maria dos Anjos"
3. Gerar PDF
4. Verificar nome completo no rodapé

**Critério de Sucesso:**

- ✅ "José" com acento correto

**Teste 3: Múltiplos Medicamentos**

1. Criar receita com 5 medicamentos diferentes
2. Incluir acentos em todos
3. Gerar PDF
4. Verificar que todos estão legíveis

#### Registro de Testes

Criar arquivo `test-results-production.txt`:

```
Data: __/__/____
Testado por: __________

Teste 1 (Receita com Acentos):
[ ] PDF gerado
[ ] Acentos visíveis
[ ] Sem caracteres quebrados
Observações: _______________

Teste 2 (Nome do Médico):
[ ] Nome completo no PDF
[ ] Acentos corretos
Observações: _______________

Teste 3 (Múltiplos Medicamentos):
[ ] Todos os medicamentos visíveis
[ ] Acentos em todos
Observações: _______________
```

---

## 🟡 IMPORTANTES - Fazer em 1-2 Dias

### I1: Monitorar Logs por 24-48h

**Prioridade:** 🟡 Importante  
**Esforço:** ⏱️ Contínuo  
**Impacto:** 📊 Estabilidade  
**Responsável:** DevOps

#### Comandos de Monitoramento

**Monitoramento Ativo:**

```bash
# Logs em tempo real (filtrado)
pm2 logs techlog-api | grep -i "pdf\|font"

# Buscar erros específicos
pm2 logs techlog-api --err | grep -i "font not found\|error generating pdf"
```

**Monitoramento Passivo:**

```bash
# Configurar cron job para coleta diária
crontab -e

# Adicionar:
0 9 * * * pm2 logs techlog-api --lines 1000 | grep -i "pdf\|font" > /home/techlog-api/logs/pdf-monitoring-$(date +\%Y\%m\%d).log
```

#### O que Buscar

**✅ Bons Sinais:**

- "PDF generated successfully"
- "Font: Helvetica"
- Sem warnings

**⚠️ Warnings (Investigar):**

- "Helvetica not available"
- "Font fallback activated"
- "PDF generation took >1s"

**❌ Erros (Ação Imediata):**

- "Font not found"
- "Error generating PDF"
- "PDF buffer empty"
- "Out of memory"

#### Métricas a Coletar

```bash
# Contar PDFs gerados com sucesso
pm2 logs techlog-api | grep -c "PDF generated"

# Contar erros de PDF
pm2 logs techlog-api --err | grep -c "Error generating PDF"

# Taxa de sucesso
# (PDFs gerados / Total de tentativas) * 100
```

**Meta:** Taxa de sucesso ≥ 99%

---

### I2: Validar em Diferentes Dispositivos

**Prioridade:** 🟡 Importante  
**Esforço:** ⏱️ 20 minutos  
**Impacto:** 📱 Compatibilidade  
**Responsável:** QA

#### Dispositivos a Testar

| Dispositivo     | Sistema       | App          | Prioridade |
| --------------- | ------------- | ------------ | ---------- |
| Desktop Windows | Windows 10/11 | Adobe Reader | Alta       |
| Desktop Mac     | macOS         | Preview      | Alta       |
| Desktop Linux   | Ubuntu        | Evince       | Média      |
| Mobile Android  | Android 11+   | Google PDF   | Alta       |
| Mobile iOS      | iOS 15+       | Safari       | Alta       |
| Tablet          | iPad          | Files        | Média      |

#### Procedimento

Para cada dispositivo:

1. **Gerar PDF**
   - Criar receita no sistema
   - Baixar PDF

2. **Abrir PDF**
   - Usar aplicativo nativo
   - Verificar que abre sem erro

3. **Verificar Conteúdo**
   - [ ] Todos os acentos visíveis
   - [ ] Símbolos renderizados
   - [ ] Sem "?" ou quadrados
   - [ ] Texto legível
   - [ ] Layout correto

4. **Testar Impressão** (opcional)
   - Imprimir PDF
   - Verificar qualidade

#### Registro

Criar planilha `device-compatibility.csv`:

```csv
Dispositivo,OS,App,Acentos,Simbolos,Impressao,Status
Desktop Windows,Win 11,Adobe Reader,OK,OK,OK,✅
Desktop Mac,macOS,Preview,OK,OK,OK,✅
...
```

---

### I3: Documentar Processo de Rollback

**Prioridade:** 🟡 Importante  
**Esforço:** ⏱️ 10 minutos  
**Impacto:** 🛡️ Contingência  
**Responsável:** DevOps

#### Cenário de Rollback

**Quando fazer rollback:**

- PDFs não são gerados (taxa de erro >10%)
- Caracteres quebrados generalizados
- Performance degradada (tempo >5s por PDF)
- Erros críticos nos logs

#### Procedimento de Rollback

**Opção 1: Rollback de Código (Rápido)**

```bash
# Parar aplicação
pm2 stop techlog-api

# Voltar para commit anterior
git log --oneline -5
git reset --hard COMMIT_ANTERIOR

# Reinstalar dependências
npm install --production

# Reiniciar
pm2 start techlog-api
```

**Opção 2: Rollback de Banco (Se Necessário)**

```bash
# Restaurar backup
cd /home/techlog-api/backups
ls -lh clinic.db.bak_*

# Copiar backup mais recente
cp clinic.db.bak_TIMESTAMP ../clinic.db

# Reiniciar aplicação
pm2 restart techlog-api
```

**Opção 3: Rollback Parcial (Apenas Desabilitar Fontes)**

```typescript
// Em src/services/PrescriptionPdfService.ts
// Comentar applyFontFallback() temporariamente
private static generatePdfBuffer(...) {
    // this.applyFontFallback(doc); // DESABILITADO
    // ... resto do código
}
```

#### Teste de Rollback

Agendar teste de rollback em ambiente de staging:

```bash
# Staging: simular problema e fazer rollback
# Medir tempo de recuperação
# Meta: < 5 minutos
```

---

## 🟢 MELHORIAS - Fazer em 1 Semana

### M1: Adicionar Testes Automatizados

**Prioridade:** 🟢 Melhoria  
**Esforço:** ⏱️ 30 minutos  
**Impacto:** 🧪 Qualidade  
**Responsável:** Backend/QA

#### Criar `tests/integration/PdfGeneration.test.ts`

```typescript
import { PrescriptionPdfService } from '../../src/services/PrescriptionPdfService';

describe('PdfGeneration', () => {
  describe('generateTestPdfBuffer', () => {
    it('should generate PDF test buffer', async () => {
      const buffer = await PrescriptionPdfService.generateTestPdfBuffer();

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.length).toBeLessThan(100000);
    });

    it('should include UTF-8 characters', async () => {
      const buffer = await PrescriptionPdfService.generateTestPdfBuffer();
      const pdfString = buffer.toString('utf-8');

      // PDF deve conter strings de teste
      expect(pdfString).toContain('Teste de Fontes');
    });
  });

  describe('generatePdfBuffer', () => {
    it('should generate prescription PDF', async () => {
      const clinic = {
        name: 'Clínica São José',
        address: 'Rua da Saúde, 123',
        phone: '(63) 99999-9999',
      };

      const doctor = {
        name: 'José Maria',
        crm: '12345',
        crm_state: 'TO',
      };

      const prescription = {
        medications: ['Paracetamol 500mg - Administração oral'],
      };

      const buffer = await PrescriptionPdfService.generatePdfBuffer(clinic, doctor, prescription);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      const prescription = {
        medications: ['Administração', 'Posologia', 'Observações'],
      };

      // Não deve lançar erro
      await expect(
        PrescriptionPdfService.generatePdfBuffer({ name: 'Teste' }, {}, prescription)
      ).resolves.toBeInstanceOf(Buffer);
    });
  });

  describe('Font Fallback', () => {
    it('should handle missing fonts gracefully', async () => {
      // Simular ambiente sem fontes customizadas
      // PDF ainda deve ser gerado
      const buffer = await PrescriptionPdfService.generateTestPdfBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});
```

#### Executar Testes

```bash
# Rodar testes
npm test tests/integration/PdfGeneration.test.ts

# Com cobertura
npm run test:coverage -- tests/integration/PdfGeneration.test.ts
```

**Meta:** 100% de cobertura no PrescriptionPdfService

---

### M2: Adicionar Métricas de PDF

**Prioridade:** 🟢 Melhoria  
**Esforço:** ⏱️ 15 minutos  
**Impacto:** 📊 Observabilidade  
**Responsável:** Backend

#### Implementar Logging de Métricas

```typescript
// Em src/services/PrescriptionPdfService.ts
static async generatePdfBuffer(...): Promise<Buffer> {
    const startTime = Date.now();

    try {
        // ... geração do PDF

        const duration = Date.now() - startTime;
        const size = buffer.length;

        console.log('[PDF] Prescription generated', {
            duration_ms: duration,
            size_bytes: size,
            medications_count: prescription.medications.length,
            has_logo: !!clinic.logoDataUrl,
            doctor_name: doctor.name,
            timestamp: new Date().toISOString()
        });

        return buffer;
    } catch (error) {
        const duration = Date.now() - startTime;

        console.error('[PDF] Generation failed', {
            duration_ms: duration,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        throw error;
    }
}
```

#### Coletar Métricas

```bash
# Extrair métricas dos logs
pm2 logs techlog-api | grep "\[PDF\]" > pdf-metrics.log

# Análise
cat pdf-metrics.log | grep "Prescription generated" | wc -l
# Número de PDFs gerados

cat pdf-metrics.log | grep "duration_ms" | \
    sed 's/.*duration_ms: \([0-9]*\).*/\1/' | \
    awk '{sum+=$1} END {print "Média:", sum/NR, "ms"}'
# Tempo médio de geração
```

---

### M3: Cache de Fontes Customizadas (Opcional)

**Prioridade:** 🟢 Melhoria  
**Esforço:** ⏱️ 45 minutos  
**Impacto:** ⚡ Performance  
**Responsável:** Backend

**Nota:** Implementar apenas se usar fontes customizadas (não necessário para fontes padrão).

#### Implementação

```typescript
// Em src/services/PrescriptionPdfService.ts
private static fontCache = new Map<string, Buffer>();

private static async loadFontFromFile(path: string): Promise<Buffer> {
    // Check cache primeiro
    if (this.fontCache.has(path)) {
        console.log('[PDF] Using cached font:', path);
        return this.fontCache.get(path)!;
    }

    // Load font
    const buffer = await fs.promises.readFile(path);

    // Cache para uso futuro
    this.fontCache.set(path, buffer);
    console.log('[PDF] Font cached:', path, buffer.length, 'bytes');

    return buffer;
}

// Uso
const fontBuffer = await this.loadFontFromFile('/path/to/font.ttf');
doc.font(fontBuffer);
```

**Benefício:** Reduz I/O de disco em 90%+ para fontes customizadas

---

### M4: Configuração de Fontes via ENV

**Prioridade:** 🟢 Melhoria  
**Esforço:** ⏱️ 20 minutos  
**Impacto:** ⚙️ Flexibilidade  
**Responsável:** Backend

#### Adicionar Variáveis de Ambiente

```bash
# Em .env
PDF_DEFAULT_FONT=Helvetica
PDF_CUSTOM_FONT_PATH=/home/techlog-api/assets/fonts/custom.ttf
PDF_FONT_FALLBACK=true
```

#### Implementar Configuração

```typescript
// Em src/services/PrescriptionPdfService.ts
private static getDefaultFont(): string {
    return process.env.PDF_DEFAULT_FONT || 'Helvetica';
}

private static isFallbackEnabled(): boolean {
    return process.env.PDF_FONT_FALLBACK !== 'false';
}

private static applyFontFallback(doc: PDFKit.PDFDocument): void {
    if (!this.isFallbackEnabled()) {
        return;
    }

    try {
        const font = this.getDefaultFont();
        doc.font(font);
    } catch (error) {
        console.warn('Font fallback failed:', error);
    }
}
```

---

## 📋 Resumo de Prioridades

### Timeline Recomendado

**Hoje (Crítico):**

- [ ] C1: Proteger rota `/debug/pdf-test`
- [ ] C2: Deploy e instalar fontes
- [ ] C3: Testar receitas reais

**Amanhã (Importante):**

- [ ] I1: Iniciar monitoramento de logs
- [ ] I2: Testar em 3+ dispositivos
- [ ] I3: Documentar rollback

**Esta Semana (Melhorias):**

- [ ] M1: Testes automatizados
- [ ] M2: Métricas de PDF
- [ ] M3: Cache de fontes (opcional)
- [ ] M4: Configuração via ENV

---

## ✅ Critérios de Sucesso

### Deploy Bem-Sucedido

- [x] ✅ Código implementado e testado
- [ ] ⏳ Deploy executado sem erros
- [ ] ⏳ Fontes instaladas no servidor
- [ ] ⏳ PDF de teste gerado com sucesso
- [ ] ⏳ Acentos visíveis no PDF
- [ ] ⏳ Receitas reais funcionando
- [ ] ⏳ Rota de debug protegida
- [ ] ⏳ Logs monitorados por 24h
- [ ] ⏳ Validação em 3+ dispositivos

### Operação Estável

- [ ] Taxa de sucesso ≥ 99%
- [ ] Tempo médio de geração < 500ms
- [ ] Sem erros de fonte nos logs
- [ ] Feedback positivo dos usuários

---

**Elaborado por:** GitHub Copilot (Claude Sonnet 4.5)  
**Data:** 01/02/2026  
**Versão:** 1.0  
**Próxima revisão:** 08/02/2026
