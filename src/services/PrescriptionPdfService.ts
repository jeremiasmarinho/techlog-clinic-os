import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

interface ClinicData {
    name: string;
    address?: string;
    phone?: string;
    logoDataUrl?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
}

interface DoctorData {
    name?: string | null;
    crm?: string | null;
    crm_state?: string | null;
}

interface PrescriptionData {
    medications: Array<string | Record<string, any>>;
}

export class PrescriptionPdfService {
    /**
     * Gera um buffer PDF da receita médica.
     *
     * FONTES: PDFKit usa fontes padrão (Helvetica, Times-Roman, Courier)
     * que funcionam em qualquer ambiente. Para fontes customizadas,
     * use doc.font('/path/to/font.ttf')
     *
     * FALLBACK: Se a fonte não existir, PDFKit continua com a fonte padrão.
     */
    static async generatePdfBuffer(
        clinic: ClinicData,
        doctor: DoctorData,
        prescription: PrescriptionData
    ): Promise<Buffer> {
        // PDFDocument com fontes padrão seguras (sempre disponíveis)
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            // Usar fontes padrão do PDF (sempre funcionam)
            autoFirstPage: true,
            bufferPages: true,
        });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));

        // Aplicar fallback de fontes seguro
        this.applyFontFallback(doc);

        const logoBuffer = this.dataUrlToBuffer(clinic.logoDataUrl || null);
        const remoteOrLocalLogo = logoBuffer ? null : clinic.logoUrl || null;
        const resolvedLogoBuffer = logoBuffer || (await this.resolveLogoBuffer(remoteOrLocalLogo));
        const accentColor = clinic.primaryColor || '#0ea5e9';

        // Header
        if (resolvedLogoBuffer) {
            doc.image(resolvedLogoBuffer, 50, 45, { width: 60, height: 60, fit: [60, 60] });
        } else {
            doc.rect(50, 45, 60, 60).stroke('#94a3b8');
            doc.fontSize(10).fillColor('#94a3b8').text('LOGO', 50, 70, {
                width: 60,
                align: 'center',
            });
        }

        doc.fillColor('#0f172a')
            .fontSize(16)
            .text(clinic.name || 'Clínica', 130, 50);
        doc.fontSize(10).fillColor('#334155');
        if (clinic.address) {
            doc.text(clinic.address, 130, 72, { width: 350 });
        }
        if (clinic.phone) {
            doc.text(`Telefone: ${clinic.phone}`, 130, 88);
        }

        doc.moveDown(2);
        doc.moveTo(50, 120).lineTo(545, 120).strokeColor(accentColor).stroke();

        doc.moveDown(2);
        doc.fontSize(18).fillColor('#0f172a').text('Receita Médica', 50, 140, {
            align: 'center',
        });

        doc.moveDown();
        doc.fontSize(12).fillColor('#0f172a');

        const meds = prescription.medications || [];
        if (!meds.length) {
            doc.text('Nenhum medicamento informado.', 60, 190);
        } else {
            let y = 190;
            meds.forEach((med, index) => {
                const formatted = this.formatMedication(med);
                doc.text(`${index + 1}. ${formatted}`, 60, y, { width: 480 });
                y += 22;
            });
        }

        // Footer
        doc.moveDown(6);
        const footerY = doc.y + 30;
        doc.moveTo(50, footerY).lineTo(260, footerY).strokeColor('#cbd5f5').stroke();
        doc.fontSize(10)
            .fillColor('#475569')
            .text('Assinatura do Médico', 50, footerY + 6);

        const doctorName = doctor.name || 'Médico Responsável';
        let crmLine = 'CRM: ---';
        if (doctor.crm) {
            const crmState = doctor.crm_state ? doctor.crm_state.toUpperCase() : 'UF';
            crmLine = `CRM/${crmState}: ${doctor.crm}`;
        }
        doc.fontSize(10)
            .fillColor('#475569')
            .text(`Dr. ${doctorName} - ${crmLine}`, 50, footerY + 22);

        const dateStr = new Date().toLocaleDateString('pt-BR');
        doc.text(`Data: ${dateStr}`, 400, footerY + 6);

        doc.end();

        return new Promise((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });
    }

    private static dataUrlToBuffer(dataUrl: string | null): Buffer | null {
        if (!dataUrl) return null;
        const match = dataUrl.match(/^data:.*;base64,(.*)$/);
        if (!match) return null;
        return Buffer.from(match[1], 'base64');
    }

    private static async resolveLogoBuffer(logoUrl: string | null): Promise<Buffer | null> {
        if (!logoUrl) return null;

        try {
            if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
                const response = await fetch(logoUrl);
                if (!response.ok) return null;
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }

            const normalized = logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl;
            const possiblePath = path.resolve(__dirname, '../../', normalized);
            if (fs.existsSync(possiblePath)) {
                return fs.readFileSync(possiblePath);
            }

            const fileUrl = pathToFileURL(possiblePath).toString();
            const response = await fetch(fileUrl);
            if (!response.ok) return null;
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch {
            return null;
        }
    }

    private static formatMedication(med: string | Record<string, any>): string {
        if (!med) return '';
        if (typeof med === 'string') return med;

        const name = med.name || med.medication || 'Medicamento';
        const dose = med.dosage || med.dose || '';
        const notes = med.instructions || med.notes || '';

        const parts = [name, dose, notes].filter(Boolean);
        return parts.join(' - ');
    }

    /**
     * Aplica fallback de fontes seguro.
     *
     * PDFKit suporta 4 famílias de fontes padrão que SEMPRE funcionam:
     * - 'Helvetica' (sans-serif, padrão)
     * - 'Times-Roman' (serif)
     * - 'Courier' (monospace)
     * - 'Symbol' e 'ZapfDingbats' (símbolos)
     *
     * Para fontes customizadas, use:
     * doc.font('/caminho/para/fonte.ttf')
     *
     * Se a fonte customizada falhar, PDFKit automaticamente
     * usa Helvetica como fallback.
     */
    private static applyFontFallback(doc: PDFKit.PDFDocument): void {
        try {
            // Testar se conseguimos aplicar a fonte padrão
            doc.font('Helvetica');
        } catch (error) {
            // Se até Helvetica falhar (improvável), PDFKit usa fonte embutida
            console.warn('⚠️  Helvetica não disponível, usando fonte padrão do PDF', error);
            // PDFKit continua funcionando com fonte interna
        }
    }

    /**
     * Gera um PDF de teste com caracteres especiais para validação.
     * Útil para testar encoding UTF-8 no servidor.
     */
    static async generateTestPdfBuffer(): Promise<Buffer> {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));

        // Aplicar fonte padrão segura
        this.applyFontFallback(doc);

        // Título
        doc.fontSize(20)
            .fillColor('#0f172a')
            .text('📄 Teste de Fontes PDFKit', 50, 50, { align: 'center' });

        doc.moveDown(2);

        // Informações do sistema
        doc.fontSize(12)
            .fillColor('#64748b')
            .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 50, 100);
        doc.text(`Node.js: ${process.version}`, 50, 120);
        doc.text(`Plataforma: ${process.platform}`, 50, 140);

        doc.moveDown(2);

        // Teste de caracteres especiais
        doc.fontSize(14)
            .fillColor('#0f172a')
            .text('Teste de Caracteres Especiais (UTF-8):', 50, 180);

        doc.fontSize(11).fillColor('#334155');

        const testStrings = [
            '✅ Acentuação: á à â ã é ê í ó ô õ ú ü ç',
            '✅ Maiúsculas: Á À Â Ã É Ê Í Ó Ô Õ Ú Ü Ç',
            '✅ Português: José, João, André, Ângela, Célia',
            '✅ Medicamentos: Paracetamol 500mg - Administração oral',
            '✅ Instruções: Tomar 1 comprimido a cada 6 horas',
            '✅ Observações: Não ingerir bebidas alcoólicas',
            '✅ Símbolos: ® © ™ § ¶ † ‡ • ◦ ‣',
            '✅ Números: 1234567890 ½ ¼ ¾',
            '✅ Moeda: R$ 100,00 US$ 50.00 € 75,50',
            '✅ Espanhol: ñ Ñ ¿ ¡',
            '✅ Francês: œ Œ æ Æ ë ï',
        ];

        let y = 210;
        testStrings.forEach((str) => {
            doc.text(str, 60, y, { width: 480 });
            y += 20;
        });

        doc.moveDown(2);

        // Fontes disponíveis
        doc.fontSize(14)
            .fillColor('#0f172a')
            .text('Fontes Padrão do PDFKit:', 50, y + 20);

        doc.fontSize(11).fillColor('#334155');

        const fonts = [
            { name: 'Helvetica', sample: 'The quick brown fox - Rápido zumbido' },
            { name: 'Helvetica-Bold', sample: 'The quick brown fox - Rápido zumbido' },
            { name: 'Times-Roman', sample: 'The quick brown fox - Rápido zumbido' },
            { name: 'Courier', sample: 'The quick brown fox - Rápido zumbido' },
        ];

        y += 50;
        fonts.forEach((fontInfo) => {
            try {
                doc.font(fontInfo.name).text(`${fontInfo.name}: ${fontInfo.sample}`, 60, y, {
                    width: 480,
                });
                y += 25;
            } catch (error) {
                doc.font('Helvetica')
                    .fillColor('#ef4444')
                    .text(`${fontInfo.name}: ❌ Não disponível`, 60, y, { width: 480 });
                y += 25;
            }
        });

        // Footer
        doc.fontSize(10)
            .fillColor('#94a3b8')
            .text(
                'Se todos os caracteres acima estão legíveis, o encoding está correto! ✅',
                50,
                750,
                {
                    align: 'center',
                    width: 495,
                }
            );

        doc.end();

        return new Promise((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });
    }
}
