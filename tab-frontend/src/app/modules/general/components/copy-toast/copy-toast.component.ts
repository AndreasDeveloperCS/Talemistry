import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-copy-toast',
  templateUrl: './copy-toast.component.html',
  styleUrl: './copy-toast.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CopyToastComponent {
  @Input()
  message: string = 'Copied to clipboard';
}
