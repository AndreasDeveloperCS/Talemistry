import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { TemplateColor } from '../models/cv-template-color.enum';
import { VisitCardInfo } from '../models/visit-card-info';

@Injectable()
export class VisitCardPdfService {
async generateVisitCards(profile: VisitCardInfo, color: TemplateColor): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    const qrDataUrl = await QRCode.toDataURL(profile.qrCodeUrl);

    // ===== CARD LAYOUT SETTINGS =====
    const mmToPt = (mm: number) => (mm * 72) / 25.4;
    const cardWidth = mmToPt(85);
    const cardHeight = mmToPt(44);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const columns = Math.floor(pageWidth / cardWidth);
    const rows = Math.floor(pageHeight / cardHeight);

    const totalGridWidth = columns * cardWidth;
    const totalGridHeight = rows * cardHeight;

    const offsetX = (pageWidth - totalGridWidth) / 2;
    const offsetY = (pageHeight - totalGridHeight) / 2;

    const colors = this.getColorSet(color);

    // ===== DRAW CARDS =====
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const x = offsetX + c * cardWidth;
        const y = offsetY + r * cardHeight;

        // 🎨 Background gradient (horizontal mix)
        const gradient = doc.linearGradient(x, y, x + cardWidth, y + cardHeight);
        gradient.stop(0, colors.primary);
        gradient.stop(0.5, colors.secondary);
        gradient.stop(1, colors.light);

        doc.rect(x, y, cardWidth, cardHeight).fill(gradient);

        // ---- TEXT & QR CODE ----
        const qrSize = 55;
        const maxTextWidth = cardWidth - qrSize - 35;
        //const textBlockHeight = 60;
        const contentCenterY = y + cardHeight / 2;
        const textStartY = contentCenterY - 30;
        const textX = x + 16;

        doc.fillColor('white');

        // === DYNAMIC WRAPPED TEXT BLOCK ===
        let cursorY = textStartY;

        // --- FULL NAME (wraps automatically) ---
        cursorY = this.drawWrappedText(
          doc,
          `${profile.firstName} ${profile.lastName}`,
          textX,
          cursorY,
          maxTextWidth,
          14,
          'Helvetica-Bold'
        );

        // --- TARGET POSITION ---
        if (profile.targetPosition) {
          cursorY = this.drawWrappedText(
            doc,
            profile.targetPosition,
            textX,
            cursorY,
            maxTextWidth,
            11,
            'Helvetica-Oblique'
          );
        }

        // --- EMAIL ---
        cursorY = this.drawWrappedText(
          doc,
          profile.email,
          textX,
          cursorY,
          maxTextWidth,
          9,
          'Helvetica'
        );

        // --- PHONE ---
        cursorY = this.drawWrappedText(
          doc,
          profile.phone,
          textX,
          cursorY,
          maxTextWidth,
          9,
          'Helvetica'
        );

        // QR code
        const qrY = y + (cardHeight - qrSize) / 2;
        doc.image(qrDataUrl, x + cardWidth - qrSize - 14, qrY, { width: qrSize });

        // ✂️ Thin cutting lines (only inside grid)
        if (r > 0) {
          doc.moveTo(x, y).lineTo(x + cardWidth, y).strokeColor('#dddddd').lineWidth(0.3).stroke();
        }
        if (c > 0) {
          doc.moveTo(x, y).lineTo(x, y + cardHeight).strokeColor('#dddddd').lineWidth(0.3).stroke();
        }
      }
    }

    doc.end();
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
    return pdfBuffer;
  }

  private getColorSet(color: TemplateColor) {
    const colorSets = {
      teal: {
        primary: '#037F8C',
        secondary: '#008C94',
        light: '#04D9D9',
      },
      orange: {
        primary: '#eb4d0f',
        secondary: '#f97316',
        light: '#fb923c',
      },
      'dark-blue': {
        primary: '#1e40af',
        secondary: '#1e3a8a',
        light: '#3b82f6',
      },
    };
    return colorSets[color];
  }

  private drawWrappedText(
    doc: PDFDocument,
    text: string,
    x: number,
    y: number,
    width: number,
    fontSize: number,
    font: string,
  ) {
    doc.font(font).fontSize(fontSize);
    const textHeight = doc.heightOfString(text, { width });
    doc.text(text, x, y, {
      width,
      lineBreak: true,
    });
    return y + textHeight;
  }
}