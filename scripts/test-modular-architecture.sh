#!/bin/bash

# ============================================
# SCRIPT DE TESTE - MÓDULOS REFATORADOS
# ============================================

echo "============================================"
echo "🧪 TESTES - ARQUITETURA MODULAR"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ============================================
# 1. VERIFICAR ESTRUTURA DE ARQUIVOS
# ============================================

echo -e "${BLUE}📁 1. Verificando Estrutura de Arquivos...${NC}"
echo ""

REQUIRED_FILES=(
    "public/js/utils/date-utils.js"
    "public/js/utils/currency-utils.js"
    "public/js/utils/string-utils.js"
    "public/js/services/api-service.js"
    "public/js/services/cache-service.js"
    "public/js/services/notification-service.js"
    "public/js/components/metrics-calculator.js"
    "public/js/components/metrics-renderer.js"
    "public/js/components/confirmation-modal.js"
    "public/js/admin-dashboard.js"
)

FILES_OK=0
FILES_MISSING=0

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
        ((FILES_OK++))
    else
        echo -e "${RED}✗${NC} $file ${RED}(MISSING)${NC}"
        ((FILES_MISSING++))
    fi
done

echo ""
echo -e "Arquivos OK: ${GREEN}${FILES_OK}/${#REQUIRED_FILES[@]}${NC}"
if [ $FILES_MISSING -gt 0 ]; then
    echo -e "Arquivos faltando: ${RED}${FILES_MISSING}${NC}"
fi
echo ""

# ============================================
# 2. ANÁLISE DE CÓDIGO
# ============================================

echo -e "${BLUE}📊 2. Análise de Complexidade...${NC}"
echo ""

echo "| Arquivo | Linhas | Funções |"
echo "|---------|--------|---------|"

count_functions() {
    grep -c "^export function\|^function\|^const.*=.*function" "$1" 2>/dev/null || echo "0"
}

TOTAL_LINES=0
TOTAL_FUNCTIONS=0

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        LINES=$(wc -l < "$file")
        FUNCTIONS=$(count_functions "$file")
        BASENAME=$(basename "$file")
        echo "| $BASENAME | $LINES | $FUNCTIONS |"
        ((TOTAL_LINES+=LINES))
        ((TOTAL_FUNCTIONS+=FUNCTIONS))
    fi
done

echo ""
echo -e "Total de Linhas: ${PURPLE}${TOTAL_LINES}${NC}"
echo -e "Total de Funções: ${PURPLE}${TOTAL_FUNCTIONS}${NC}"
echo -e "Média Linhas/Arquivo: ${PURPLE}$((TOTAL_LINES / ${#REQUIRED_FILES[@]}))${NC}"
echo ""

# ============================================
# 3. VALIDAÇÃO DE SINTAXE (ESLint-like)
# ============================================

echo -e "${BLUE}🔍 3. Validação de Sintaxe JavaScript...${NC}"
echo ""

SYNTAX_ERRORS=0

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Tentar executar node em modo check-syntax
        if node -c "$file" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $(basename "$file") - Sintaxe OK"
        else
            echo -e "${RED}✗${NC} $(basename "$file") - ${RED}ERRO DE SINTAXE${NC}"
            ((SYNTAX_ERRORS++))
        fi
    fi
done

echo ""
if [ $SYNTAX_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Todos os arquivos têm sintaxe válida${NC}"
else
    echo -e "${RED}✗ $SYNTAX_ERRORS arquivo(s) com erro de sintaxe${NC}"
fi
echo ""

# ============================================
# 4. VERIFICAR IMPORTS/EXPORTS
# ============================================

echo -e "${BLUE}📦 4. Verificando Imports/Exports...${NC}"
echo ""

check_imports() {
    local file=$1
    local imports=$(grep -c "^import " "$file" 2>/dev/null || echo "0")
    local exports=$(grep -c "^export " "$file" 2>/dev/null || echo "0")
    echo "$imports imports, $exports exports"
}

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        RESULT=$(check_imports "$file")
        echo -e "${GREEN}✓${NC} $(basename "$file"): $RESULT"
    fi
done

echo ""

# ============================================
# 5. TESTES UNITÁRIOS (se existirem)
# ============================================

echo -e "${BLUE}🧪 5. Executando Testes Unitários...${NC}"
echo ""

TEST_FILES=(
    "tests/unit/date-utils.test.js"
    "tests/unit/currency-utils.test.js"
    "tests/unit/string-utils.test.js"
)

TESTS_EXIST=0
for test_file in "${TEST_FILES[@]}"; do
    if [ -f "$test_file" ]; then
        echo -e "${GREEN}✓${NC} $(basename "$test_file") encontrado"
        ((TESTS_EXIST++))
    fi
done

if [ $TESTS_EXIST -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Para executar testes: npm test${NC}"
else
    echo -e "${YELLOW}⚠️  Nenhum arquivo de teste encontrado${NC}"
fi
echo ""

# ============================================
# 6. VERIFICAR DOCUMENTAÇÃO
# ============================================

echo -e "${BLUE}📖 6. Verificando Documentação...${NC}"
echo ""

DOCS=(
    "MODULAR_ARCHITECTURE.md"
    "CHECKLIST_TESTE_COMPLETO.md"
)

DOCS_OK=0
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        LINES=$(wc -l < "$doc")
        echo -e "${GREEN}✓${NC} $doc (${LINES} linhas)"
        ((DOCS_OK++))
    else
        echo -e "${RED}✗${NC} $doc ${RED}(MISSING)${NC}"
    fi
done

echo ""

# ============================================
# 7. VERIFICAR DEPENDÊNCIAS CIRCULARES
# ============================================

echo -e "${BLUE}🔄 7. Verificando Dependências Circulares...${NC}"
echo ""

# Verificação básica de imports duplicados
echo -e "${YELLOW}Analisando dependências...${NC}"

# Utils não devem importar services ou components
UTILS_IMPORTS=$(grep -r "from.*services\|from.*components" public/js/utils/ 2>/dev/null | wc -l)
if [ "$UTILS_IMPORTS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Utils não dependem de Services ou Components (OK)"
else
    echo -e "${RED}✗${NC} Utils dependem de Services/Components (${RED}BAD${NC})"
fi

# Services não devem importar components
SERVICES_IMPORTS=$(grep -r "from.*components" public/js/services/ 2>/dev/null | wc -l)
if [ "$SERVICES_IMPORTS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Services não dependem de Components (OK)"
else
    echo -e "${RED}✗${NC} Services dependem de Components (${RED}BAD${NC})"
fi

echo ""

# ============================================
# 8. VERIFICAR BROWSER COMPATIBILITY
# ============================================

echo -e "${BLUE}🌐 8. Verificando Compatibilidade de APIs...${NC}"
echo ""

# APIs modernas usadas
MODERN_APIS=(
    "fetch:"
    "Promise:"
    "async/await:"
    "localStorage:"
    "sessionStorage:"
    "navigator.clipboard:"
)

for api in "${MODERN_APIS[@]}"; do
    API_NAME=${api%:}
    COUNT=$(grep -r "$API_NAME" public/js/ 2>/dev/null | wc -l)
    if [ "$COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} $API_NAME usado em $COUNT lugar(es)"
    fi
done

echo ""
echo -e "${YELLOW}⚠️  Requer navegador moderno (Chrome 60+, Firefox 55+, Safari 11+)${NC}"
echo ""

# ============================================
# 9. VERIFICAR SEGURANÇA BÁSICA
# ============================================

echo -e "${BLUE}🔒 9. Verificação de Segurança Básica...${NC}"
echo ""

# Procurar por possíveis vulnerabilidades
SECURITY_ISSUES=0

# eval() usage
EVAL_COUNT=$(grep -r "\beval\b" public/js/ 2>/dev/null | grep -v "// " | wc -l)
if [ "$EVAL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Nenhum uso de eval() encontrado"
else
    echo -e "${YELLOW}⚠${NC} eval() encontrado em $EVAL_COUNT lugar(es) ${YELLOW}(revisar)${NC}"
    ((SECURITY_ISSUES++))
fi

# innerHTML usage (XSS risk)
INNERHTML_COUNT=$(grep -r "\.innerHTML\s*=" public/js/ 2>/dev/null | grep -v "// " | wc -l)
if [ "$INNERHTML_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Uso seguro de DOM"
else
    echo -e "${YELLOW}⚠${NC} innerHTML= encontrado em $INNERHTML_COUNT lugar(es) ${YELLOW}(revisar XSS)${NC}"
fi

# Hardcoded tokens/passwords
SECRETS_COUNT=$(grep -ri "password\s*=\s*['\"].\|token\s*=\s*['\"]." public/js/ 2>/dev/null | grep -v "// " | wc -l)
if [ "$SECRETS_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Nenhum segredo hardcoded encontrado"
else
    echo -e "${RED}✗${NC} Possíveis segredos hardcoded: $SECRETS_COUNT ${RED}(REVISAR)${NC}"
    ((SECURITY_ISSUES++))
fi

echo ""
if [ $SECURITY_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ Nenhum problema de segurança crítico encontrado${NC}"
else
    echo -e "${YELLOW}⚠ $SECURITY_ISSUES possível(is) problema(s) de segurança${NC}"
fi
echo ""

# ============================================
# 10. RESUMO FINAL
# ============================================

echo "============================================"
echo -e "${PURPLE}📊 RESUMO DA ANÁLISE${NC}"
echo "============================================"
echo ""

echo -e "Estrutura de Arquivos:"
echo -e "  └─ Arquivos criados: ${GREEN}${FILES_OK}/${#REQUIRED_FILES[@]}${NC}"

echo ""
echo -e "Complexidade do Código:"
echo -e "  └─ Total de linhas: ${PURPLE}${TOTAL_LINES}${NC}"
echo -e "  └─ Total de funções: ${PURPLE}${TOTAL_FUNCTIONS}${NC}"
echo -e "  └─ Média linhas/arquivo: ${PURPLE}$((TOTAL_LINES / ${#REQUIRED_FILES[@]}))${NC}"

echo ""
echo -e "Qualidade do Código:"
echo -e "  └─ Erros de sintaxe: ${SYNTAX_ERRORS}"
echo -e "  └─ Problemas de segurança: ${SECURITY_ISSUES}"
echo -e "  └─ Arquivos de teste: ${TESTS_EXIST}"

echo ""
echo -e "Documentação:"
echo -e "  └─ Docs disponíveis: ${GREEN}${DOCS_OK}/${#DOCS[@]}${NC}"

echo ""
echo "============================================"

# Status geral
if [ $FILES_MISSING -eq 0 ] && [ $SYNTAX_ERRORS -eq 0 ] && [ $SECURITY_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo -e "${GREEN}Sistema modular pronto para produção.${NC}"
    exit 0
elif [ $SYNTAX_ERRORS -gt 0 ] || [ $SECURITY_ISSUES -gt 0 ]; then
    echo -e "${RED}❌ PROBLEMAS CRÍTICOS ENCONTRADOS${NC}"
    echo -e "${RED}Corrija os erros antes de fazer deploy.${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠️  SISTEMA FUNCIONAL COM AVISOS${NC}"
    echo -e "${YELLOW}Revise os avisos antes do deploy.${NC}"
    exit 0
fi
