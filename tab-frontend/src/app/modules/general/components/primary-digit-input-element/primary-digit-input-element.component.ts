import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-primary-digit-input-element',
  templateUrl: './primary-digit-input-element.component.html',
  styleUrl: './primary-digit-input-element.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrimaryDigitInputElementComponent implements OnDestroy {
  @Input()
  labelText: string = 'Label Text';

  @Input()
  labelIcon: string = '';

  @Input()
  defaultValue: number = 0;

  @Input()
  minValue: number = 0;

  @Input()
  maxValue: number = 1000000000;

  @Output()
  valueChanged: EventEmitter<number> = new EventEmitter<number>();

  private intervalId: any;
  private pressStartTime: number = 0;
  digitControl: FormControl;

  constructor() {
    this.digitControl = new FormControl(this.defaultValue
      , [
        Validators.required,
        Validators.pattern(/^[0-9]\d*$/),
        Validators.min(0)
        , Validators.max(this.maxValue)
      ]);
  }

  getStep(elapsedSeconds: number) {
    if (elapsedSeconds >= 4) {
      return 10000; // After 4 seconds
    } else if (elapsedSeconds >= 3) {
      return 1000; // After 3 seconds
    } else if (elapsedSeconds >= 2) {
      return 100; // After 2 seconds
    } else if (elapsedSeconds >= 1) {
      return 10; // After 1 second
    } else {
      return 1; // After 1 second
    }
  }

  onValueChanged($event: any) {
    // console.log('onValueChanged', $event);
    if ($event)
      this.valueChanged.emit(this.defaultValue);
  }

  startIncrement(): void {
    this.stop();
    this.pressStartTime = Date.now(); // Record the start time

    this.intervalId = setInterval(() => {
      this.incrementValue();
    }, 100);
  }
  
  startDecrement(): void {
    this.stop();
    this.pressStartTime = Date.now(); // Record the start time

    this.intervalId = setInterval(() => {
      this.decrementValue();
    }, 100);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId); // Stop the interval
      this.intervalId = null;
    }
    this.pressStartTime = 0;
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private incrementValue(): void {
    const elapsedSeconds = (Date.now() - this.pressStartTime) / 1000; // Time in seconds
    const incrementStep = this.getStep(elapsedSeconds);
    if ((this.defaultValue + incrementStep) < this.maxValue) {
      this.defaultValue += incrementStep;
      this.valueChanged.emit(this.defaultValue);
    }
  }

  onMouseDownIncrement(event: MouseEvent): void {
    if (event.button === 0) { // 0 = left mouse button
      // console.log(' Increment Left mouse button pressed on mat-button');
      //this.increment();
    }
  }
  onMouseDownDecrement(event: MouseEvent): void {
    if (event.button === 0) { // 0 = left mouse button
      // console.log('Decrement Left mouse button pressed on mat-button');
    }
  }
  decrementValue() {
    const elapsedSeconds = (Date.now() - this.pressStartTime) / 1000; // Time in seconds
    const changeStep = this.getStep(elapsedSeconds);
    if (((this.defaultValue - changeStep) >= this.minValue)) {
      this.defaultValue -= changeStep;
      this.valueChanged.emit(this.defaultValue);
    }
  }
}
