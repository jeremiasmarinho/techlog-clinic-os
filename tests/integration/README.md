# 🧪 Guia de Testes de Integração - Criação de Agendamentos

## 📋 Visão Geral

Este guia documenta os testes de integração implementados para a funcionalidade de **Criação de
Agendamentos** (POST /api/leads) usando **Jest** e **Supertest**.

## 🛠️ Tecnologias Utilizadas

- **Jest**: Framework de testes JavaScript/TypeScript
- **Supertest**: Biblioteca para testes de APIs HTTP
- **TypeScript**: Tipagem estática
- **SQLite3**: Banco de dados para persistência

## 📦 Instalação de Dependências

Execute o comando abaixo para instalar todas as dependências necessárias:

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

## ⚙️ Configuração

### jest.config.js

O arquivo de configuração do Jest foi otimizado com:

- ✅ Preset `ts-jest` para suporte TypeScript
- ✅ Ambiente Node.js
- ✅ Timeout estendido (15s) para operações de banco
- ✅ Cobertura de código configurada (70% threshold)
- ✅ Mocks automáticos habilitados
- ✅ Paralelização otimizada (50% dos cores)

## 🧪 Estrutura dos Testes

### Arquivo: `tests/integration/AppointmentCreation.test.ts`

#### Categorias de Testes:

### 1. ✅ Cenários de Sucesso

- Criação com todos os dados válidos
- Criação com tipo padrão
- Múltiplos agendamentos sequenciais
- Nomes com caracteres especiais

### 2. ❌ Cenários de Validação (Erro 400)

- Nome faltando
- Telefone faltando
- Ambos faltando
- Campos vazios
- Body vazio ou null

### 3. 🔍 Edge Cases

- Diferentes formatos de telefone
- Nomes com múltiplas palavras
- Diferentes tipos de consulta
- Validação de timestamps

### 4. 🔐 Integridade de Dados

- IDs únicos e incrementais
- Consistência após múltiplas inserções
- Persistência correta no SQLite

### 5. ⚡ Performance

- Tempo de resposta < 1 segundo
- Operações concorrentes

## 🚀 Executando os Testes

### Todos os testes

```bash
npm test
```

### Apenas testes de integração

```bash
npm test -- tests/integration/
```

### Com cobertura de código

```bash
npm run test:verbose
```

### Modo watch (desenvolvimento)

```bash
npm run test:watch
```

### Teste específico

```bash
npm test -- AppointmentCreation.test.ts
```

## 📊 Cobertura de Código

Os testes foram configurados com thresholds de cobertura:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

Para visualizar o relatório de cobertura:

```bash
npm test -- --coverage
```

O relatório HTML estará disponível em: `coverage/lcov-report/index.html`

## 🔍 Estrutura do Teste de Integração

```typescript
describe('Integration Test - POST /api/leads', () => {

  beforeAll(() => {
    // Setup do Express app
  });

  beforeEach(() => {
    // Limpa estado entre testes
  });

  afterAll(async () => {
    // Cleanup: Remove dados de teste
    // Fecha conexão com banco
  });

  // Helper Functions
  const verifyLeadInDatabase = async (leadId) => {
    // Verifica persistência no SQLite
  };

  // Suites de testes organizadas
  describe('✅ Cenários de Sucesso', () => { ... });
  describe('❌ Cenários de Validação', () => { ... });
  describe('🔍 Edge Cases', () => { ... });
});
```

## ✅ Checklist de Validações

Cada teste verifica:

- [x] Status HTTP correto (200 para sucesso, 400 para validação)
- [x] Estrutura da resposta JSON
- [x] Presença de campos obrigatórios
- [x] Persistência real no banco SQLite
- [x] Integridade dos dados salvos
- [x] Mensagens de erro apropriadas
- [x] Timestamps automáticos
- [x] IDs únicos e incrementais

## 🎯 Casos de Teste Implementados

### ✅ Sucesso (5 testes)

1. Criação com dados completos
2. Criação com tipo padrão
3. Múltiplas criações sequenciais
4. Caracteres especiais no nome
5. Validação de campos no banco

### ❌ Validação (7 testes)

1. Nome ausente → 400
2. Telefone ausente → 400
3. Ambos ausentes → 400
4. Nome vazio → 400
5. Telefone vazio → 400
6. Body vazio → 400
7. Body null → 400

### 🔍 Edge Cases (5 testes)

1. Telefone apenas números
2. Nome com múltiplas palavras
3. Diferentes tipos de consulta
4. Timestamps automáticos
5. Formatos de dados diversos

### 🔐 Integridade (2 testes)

1. IDs únicos e incrementais
2. Consistência de dados

### ⚡ Performance (1 teste)

1. Tempo de resposta < 1s

**Total: 20 testes abrangentes**

## 🐛 Debugging

### Habilitar logs do Jest

```bash
npm test -- --verbose
```

### Debug específico

```bash
npm test -- --testNamePattern="deve criar um agendamento"
```

### Ver saída completa

```bash
npm test -- --no-coverage --verbose
```

## 📝 Boas Práticas Implementadas

1. ✅ **Isolamento**: Cada teste é independente
2. ✅ **Cleanup**: Dados de teste são removidos após execução
3. ✅ **Verificação Dupla**: API + Banco de dados
4. ✅ **Nomes Descritivos**: Testes autoexplicativos
5. ✅ **Organize por Categoria**: Suites agrupadas logicamente
6. ✅ **Asserts Claros**: Expectativas específicas
7. ✅ **Performance**: Testes executam rapidamente
8. ✅ **Cobertura**: Threshold de 70% global

## 🔄 CI/CD Integration

Para integrar com pipelines CI/CD:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## 📚 Próximos Passos

- [ ] Implementar testes para UPDATE /appointments
- [ ] Implementar testes para DELETE /appointments
- [ ] Implementar testes para GET /appointments
- [ ] Adicionar testes de carga (stress testing)
- [ ] Implementar testes de segurança (SQL injection)
- [ ] Adicionar testes de concorrência

## 🤝 Contribuindo

Ao adicionar novos testes:

1. Siga a estrutura de categorias existente
2. Use nomes descritivos em português
3. Adicione cleanup apropriado
4. Verifique tanto API quanto banco de dados
5. Mantenha cobertura > 70%

## 📖 Referências

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Desenvolvido por**: QA Senior Engineer  
**Data**: 2026-02-01  
**Versão**: 1.0.0
