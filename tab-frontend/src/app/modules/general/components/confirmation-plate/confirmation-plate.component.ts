import { Component, Input, OnInit, Output, EventEmitter, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-confirmation-plate',
    templateUrl: './confirmation-plate.component.html',
    styleUrl: './confirmation-plate.component.scss',
    standalone: false,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationPlateComponent {

  @Input()
  public confirmationText: string = '';

  @Input()
  public refusionText: string = '';

  @Output()
  public gdprConfirmationChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input()
  public amAgree: boolean = false;

  valueChanged($event: any) {
    this.amAgree = !this.amAgree;
    this.gdprConfirmationChanged.emit(this.amAgree);
  }
}
