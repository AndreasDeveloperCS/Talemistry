import { Component, ElementRef, ViewChild, input, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrl: './qr-code.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrCodeComponent {
  value = input.required<string>();     
  caption = input<string>('Scan me');   

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  constructor() {
    effect(() => {
      const text = this.value();
      QRCode.toCanvas(this.canvas.nativeElement, text, {
        errorCorrectionLevel: 'M', // L, M, Q, H
        margin: 2,
        width: 100,
        color: { dark: '#000000', light: '#ffffff' },
      }).catch(console.error);
    });
  }
}
