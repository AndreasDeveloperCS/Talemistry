import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrl: './toggle-button.component.scss',
  standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleButtonComponent),
      multi: true,
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleButtonComponent implements ControlValueAccessor {
  @Input() 
  isActive: boolean | undefined = false;
  disabled = false;

  @Output() toggle = new EventEmitter<void>();

  private onChange: any = () => {};
  private onTouched: any = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  onToggle(): void {
    if (this.disabled) {
      return;
    }
    this.isActive = !this.isActive;
    this.toggle.emit();
    this.onChange(this.isActive);
    this.onTouched();
  }

  writeValue(value: boolean): void {
    this.isActive = value === true;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }
} 
