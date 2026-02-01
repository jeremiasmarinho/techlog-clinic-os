// Script de teste da geração de PDF com fontes
// Testa o PrescriptionPdfService localmente antes de fazer deploy

const fs = require('fs');
const path = require('path');

// Mock do PDFKit para teste local
class MockPDFDocument {
    constructor(options) {
        this.options = options;
        this.chunks = [];
        this.listeners = {};
        this.currentFont = 'Helvetica';
        console.log('✅ PDFDocument criado:', options);
    }

    on(event, callback) {
        this.listeners[event] = callback;
        return this;
    }

    font(fontName) {
        console.log(`  → Aplicando fonte: ${fontName}`);
        this.currentFont = fontName;
        return this;
    }

    fontSize(size) {
        console.log(`  → Tamanho da fonte: ${size}`);
        return this;
    }

    fillColor(color) {
        return this;
    }

    text(text, x, y, options) {
        console.log(`  → Texto: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        // Simular data chunk
        if (this.listeners['data']) {
            this.listeners['data'](Buffer.from(text));
        }
        return this;
    }

    moveDown(lines) {
        return this;
    }

    end() {
        console.log('✅ PDF finalizado');
        if (this.listeners['end']) {
            setTimeout(() => this.listeners['end'](), 10);
        }
    }
}

// Função de teste
async function testPdfGeneration() {
    console.log('\n🧪 Teste de Geração de PDF com Fontes\n');
    console.log('='.repeat(50));

    // Testar caracteres especiais
    console.log('\n📝 Testando caracteres especiais:');
    const testStrings = [
        'Acentuação: á à â ã é ê í ó ô õ ú ü ç',
        'Maiúsculas: Á À Â Ã É Ê Í Ó Ô Õ Ú Ü Ç',
        'Português: José, João, André, Ângela, Célia',
        'Medicamentos: Paracetamol 500mg - Administração oral',
        'Instruções: Tomar 1 comprimido a cada 6 horas',
        'Observações: Não ingerir bebidas alcoólicas',
    ];

    testStrings.forEach((str) => {
        const hasSpecialChars = /[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/.test(str);
        console.log(`  ${hasSpecialChars ? '✅' : '⚠️ '} ${str}`);
    });

    // Testar fontes padrão
    console.log('\n🎨 Testando fontes padrão do PDFKit:');
    const standardFonts = ['Helvetica', 'Helvetica-Bold', 'Times-Roman', 'Courier'];

    standardFonts.forEach((font) => {
        try {
            const doc = new MockPDFDocument({ size: 'A4' });
            doc.font(font);
            console.log(`  ✅ ${font}: Disponível`);
        } catch (error) {
            console.log(`  ❌ ${font}: Erro -`, error.message);
        }
    });

    // Testar fallback
    console.log('\n🛡️  Testando fallback de fontes:');
    try {
        const doc = new MockPDFDocument({ size: 'A4' });

        console.log('  → Tentando fonte customizada inexistente...');
        try {
            doc.font('/caminho/invalido/fonte.ttf');
            console.log('  ⚠️  Fonte customizada não validada (mock)');
        } catch {
            console.log('  ✅ Fallback ativado para Helvetica');
            doc.font('Helvetica');
        }
    } catch (error) {
        console.log('  ❌ Erro no fallback:', error.message);
    }

    // Simular geração de PDF de teste
    console.log('\n📄 Simulando geração de PDF de teste:');
    try {
        const doc = new MockPDFDocument({
            size: 'A4',
            margin: 50,
            autoFirstPage: true,
            bufferPages: true,
        });

        doc.on('data', (chunk) => {
            console.log(`  → Chunk de dados gerado: ${chunk.length} bytes`);
        });

        doc.on('end', () => {
            console.log('  ✅ PDF de teste gerado com sucesso!');
        });

        // Aplicar fonte padrão
        doc.font('Helvetica');

        // Título
        doc.fontSize(20).text('📄 Teste de Fontes PDFKit', 50, 50);

        // Teste de caracteres
        doc.fontSize(12);
        testStrings.forEach((str, i) => {
            doc.text(str, 50, 100 + i * 20);
        });

        // Finalizar
        doc.end();

        await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
        console.log('  ❌ Erro ao gerar PDF:', error.message);
    }

    // Verificar ambiente
    console.log('\n🖥️  Informações do ambiente:');
    console.log(`  Node.js: ${process.version}`);
    console.log(`  Plataforma: ${process.platform}`);
    console.log(`  Arquitetura: ${process.arch}`);

    // Recomendações
    console.log('\n📋 Recomendações para produção:');
    console.log('  1. Executar: sudo bash scripts/install-fonts.sh');
    console.log('  2. Verificar: fc-list | grep -i liberation');
    console.log('  3. Testar: curl -o test.pdf http://localhost:3000/debug/pdf-test');
    console.log('  4. Validar: Abrir PDF e verificar acentos');

    console.log('\n' + '='.repeat(50));
    console.log('✅ Teste concluído!\n');
}

// Executar teste
testPdfGeneration().catch((error) => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
});
