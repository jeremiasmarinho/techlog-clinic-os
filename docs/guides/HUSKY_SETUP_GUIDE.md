# 🐕 Guia de Configuração Husky + Git Hooks

## 📋 Visão Geral

Este guia documenta a configuração do **Husky** e **lint-staged** para garantir que código quebrado
nunca seja enviado ao repositório.

## 🛡️ Proteções Implementadas

### 🔒 Pre-Push Hook

- **O que faz**: Executa `npm test` antes de cada push
- **Quando bloqueia**: Se qualquer teste do Jest falhar
- **Resultado**: Git rejeita o push até os testes passarem

### 🎨 Pre-Commit Hook (Opcional)

- **O que faz**: Executa lint-staged antes de cada commit
- **Função**: Formata código automaticamente

## 📦 Instalação

### Passo 1: Instalar Dependências

```bash
# Instalar Husky e lint-staged
npm install --save-dev husky lint-staged

# Inicializar Husky
npx husky init
```

### Passo 2: Verificar Arquivos Criados

Os seguintes arquivos foram criados:

```
.husky/
├── pre-push       # Hook que roda npm test antes de push
└── pre-commit     # Hook que roda lint-staged antes de commit
```

### Passo 3: Dar Permissão de Execução (Linux/Mac)

```bash
chmod +x .husky/pre-push
chmod +x .husky/pre-commit
```

### Passo 4: Testar Configuração

```bash
# Teste o pre-push manualmente
./.husky/pre-push

# Ou faça um push de teste
git push
```

## 🎯 Como Funciona

### Fluxo do Pre-Push Hook

```
1. Você executa: git push origin main
   ↓
2. Husky intercepta o comando
   ↓
3. Executa: npm test
   ↓
4a. ✅ Testes passam → Push é liberado
4b. ❌ Testes falham → Push é BLOQUEADO
```

### Exemplo de Saída Bem-Sucedida

```bash
$ git push origin main

🔍 Running tests before push...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> techlog-api@1.0.0 test
> jest --coverage

 PASS  tests/integration/AppointmentCreation.test.ts
  ✓ deve criar um agendamento (100ms)
  ✓ deve validar campos obrigatórios (50ms)

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total

✅ Todos os testes passaram! Push liberado.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
```

### Exemplo de Push Bloqueado

```bash
$ git push origin main

🔍 Running tests before push...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> techlog-api@1.0.0 test
> jest --coverage

 FAIL  tests/integration/AppointmentCreation.test.ts
  ✕ deve criar um agendamento (150ms)

    Expected: 200
    Received: 400

Test Suites: 1 failed, 1 total
Tests:       1 failed, 17 passed, 18 total

❌ PUSH BLOQUEADO! Testes falharam.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  Corrija os erros nos testes antes de fazer push.

Comandos úteis:
  npm test              - Rodar todos os testes
  npm run test:unit     - Rodar apenas testes unitários
  npm run test:watch    - Modo watch para desenvolvimento

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

error: failed to push some refs to 'github.com:user/repo.git'
```

## 🔧 Configuração

### Pre-Push Hook (.husky/pre-push)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running tests before push..."
npm test

if [ $? -ne 0 ]; then
  echo "❌ PUSH BLOQUEADO! Testes falharam."
  exit 1
fi

echo "✅ Todos os testes passaram! Push liberado."
```

### Lint-Staged (package.json)

```json
{
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## 🚀 Comandos Úteis

### Executar Testes Localmente

```bash
# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Apenas testes de integração
npm run test:integration

# Modo watch (durante desenvolvimento)
npm run test:watch
```

### Bypassar Hooks (USE COM CUIDADO!)

```bash
# Pular pre-push hook (NÃO RECOMENDADO)
git push --no-verify

# Pular pre-commit hook
git commit --no-verify -m "mensagem"
```

⚠️ **ATENÇÃO**: Só use `--no-verify` em casos extremos!

## 📊 O Que é Testado

O pre-push hook executa **todos os testes Jest**:

### Testes de Integração

- ✅ POST /api/leads (criação de agendamento)
- ✅ Validação de campos obrigatórios
- ✅ Persistência no SQLite
- ✅ Erros 400 para dados inválidos

### Testes Unitários

- ✅ Controllers
- ✅ Validators
- ✅ Middleware
- ✅ Utilities

**Total**: 18+ testes executados antes de cada push

## 🛠️ Troubleshooting

### Problema: "Permission denied"

```bash
# Dar permissão de execução
chmod +x .husky/pre-push
chmod +x .husky/pre-commit
```

### Problema: "Husky not found"

```bash
# Reinstalar Husky
npm install --save-dev husky
npx husky init
```

### Problema: "Tests not running"

```bash
# Verificar se npm test funciona
npm test

# Verificar se o hook existe
ls -la .husky/pre-push

# Verificar conteúdo do hook
cat .husky/pre-push
```

### Problema: "Hook não está executando"

```bash
# Verificar configuração do Git
git config core.hooksPath

# Deve retornar: .husky
# Se não, configure:
git config core.hooksPath .husky
```

## 📝 Boas Práticas

### ✅ Faça

1. **Execute testes localmente** antes de fazer push

   ```bash
   npm test
   ```

2. **Corrija falhas imediatamente**
   - Não acumule testes falhando

3. **Use test:watch durante desenvolvimento**

   ```bash
   npm run test:watch
   ```

4. **Mantenha os testes rápidos**
   - Testes lentos tornam o push demorado

### ❌ Não Faça

1. **Não use --no-verify frequentemente**
   - Derrota o propósito dos hooks

2. **Não desabilite o Husky**
   - Proteção contra código quebrado

3. **Não commite testes falhando**
   - Conserte antes de commitar

## 🎯 Benefícios

### Para Você

- ✅ Nunca envie código quebrado acidentalmente
- ✅ Feedback imediato sobre problemas
- ✅ Economiza tempo de debugging

### Para o Time

- ✅ CI/CD não quebra por testes falhando
- ✅ Branch principal sempre estável
- ✅ Menos bugs em produção

### Para o Projeto

- ✅ Qualidade de código garantida
- ✅ Histórico do Git mais limpo
- ✅ Deploy automático confiável

## 🔄 Fluxo de Trabalho Recomendado

```bash
# 1. Desenvolver feature
# ... escrever código ...

# 2. Rodar testes em modo watch
npm run test:watch

# 3. Commitar mudanças
git add .
git commit -m "feat: nova funcionalidade"
# ← Pre-commit hook roda lint-staged

# 4. Fazer push
git push origin feature/nova-funcionalidade
# ← Pre-push hook roda npm test

# 5. Se testes passarem → Push enviado ✅
# 6. Se testes falharem → Corrigir e repetir ❌
```

## 📚 Recursos Adicionais

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Git Hooks Guide](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)

## 🎓 Comandos de Emergência

### Desabilitar Temporariamente (Não Recomendado)

```bash
# Mover hooks para backup
mv .husky .husky.backup

# Fazer push sem hooks
git push

# Restaurar hooks
mv .husky.backup .husky
```

### Forçar Push (Última Opção)

```bash
# Apenas em emergências!
git push --no-verify --force
```

⚠️ **CUIDADO**: Isso pode quebrar o repositório compartilhado!

## ✨ Conclusão

Com Husky configurado:

- ✅ **Proteção Automática**: Testes rodam antes de push
- ✅ **Zero Configuração Manual**: Funciona para todo o time
- ✅ **Qualidade Garantida**: Código quebrado não chega no GitHub
- ✅ **Feedback Rápido**: Erros detectados localmente

**Status**: 🟢 **PRONTO PARA USO!**

---

**Configurado por**: QA Senior Engineer  
**Data**: 2026-02-01  
**Versão**: 1.0.0
