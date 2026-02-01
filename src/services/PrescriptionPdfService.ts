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
    static async generatePdfBuffer(
        clinic: ClinicData,
        doctor: DoctorData,
        prescription: PrescriptionData
    ): Promise<Buffer> {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));

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
}
