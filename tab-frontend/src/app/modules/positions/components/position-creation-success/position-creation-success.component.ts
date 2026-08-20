import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-position-creation-success',
  templateUrl: './position-creation-success.component.html',
  styleUrl: './position-creation-success.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositionCreationSuccessComponent {
  @Output() triggerClose = new EventEmitter<void>();

  addAnotherPosition() {
    console.log('Adding another position...');
    this.triggerClose.emit();
  }
}
