#!/bin/bash
#
# Script de instalação de fontes para PDFKit em servidores Linux (Ubuntu/Debian)
# Instala fontes essenciais para geração de PDFs com suporte a caracteres especiais
#
# Uso: sudo bash scripts/install-fonts.sh
#

set -e

echo "============================================"
echo "Instalação de Fontes para PDFKit"
echo "============================================"
echo ""

# Verificar se é root/sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script precisa ser executado como root ou com sudo"
    echo "Execute: sudo bash scripts/install-fonts.sh"
    exit 1
fi

echo "📦 Atualizando lista de pacotes..."
apt-get update -qq

echo ""
echo "📝 Instalando fontes essenciais..."

# Fontes Liberation (substitutos livres das fontes Microsoft)
# Substitui: Arial, Times New Roman, Courier New
echo "  → Liberation Fonts (substitutos de Arial, Times, Courier)"
apt-get install -y fonts-liberation fonts-liberation2

# Fontes DejaVu (excelente suporte para caracteres especiais e acentuação)
echo "  → DejaVu Fonts (suporte completo a UTF-8 e acentos)"
apt-get install -y fonts-dejavu fonts-dejavu-core fonts-dejavu-extra

# Microsoft Core Fonts (Arial, Times New Roman, etc - via EULA)
echo "  → Microsoft Core Fonts (via ttf-mscorefonts-installer)"
echo "  ⚠️  Requer aceitar EULA da Microsoft"
echo ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true | debconf-set-selections
apt-get install -y ttf-mscorefonts-installer

# Fontes para suporte internacional
echo "  → Fontes internacionais (Unicode completo)"
apt-get install -y fonts-freefont-ttf fonts-noto-core

# Fontconfig - gerenciador de configuração de fontes
echo "  → Fontconfig (gerenciador de fontes)"
apt-get install -y fontconfig

echo ""
echo "🔄 Atualizando cache de fontes..."
fc-cache -f -v > /dev/null 2>&1

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Fontes instaladas:"
echo "  • Liberation Sans (substituto do Arial)"
echo "  • Liberation Serif (substituto do Times New Roman)"
echo "  • Liberation Mono (substituto do Courier New)"
echo "  • DejaVu Sans, Serif, Mono"
echo "  • Microsoft Core Fonts (Arial, Times, Courier, etc)"
echo "  • Noto Sans, Noto Serif"
echo ""
echo "🔍 Para verificar fontes disponíveis:"
echo "  fc-list | grep -i liberation"
echo "  fc-list | grep -i dejavu"
echo "  fc-list | grep -i arial"
echo ""
echo "🎉 PDFKit agora tem acesso a todas as fontes necessárias!"
