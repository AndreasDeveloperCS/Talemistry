import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-timezone-select',
  templateUrl: './timezone-select.component.html',
  styleUrl: './timezone-select.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimezoneSelectComponent implements OnInit {
  
  @Input() selectedTimezone: string | null = null;
  @Output() timezoneChange = new EventEmitter<string>();

  timezones: string[] = [];
  filteredTimezones: string[] = [];

  searchTerm: string = '';
  isOpen: boolean = false;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.timezone-container')) {
      this.isOpen = false;
    }
  }

  ngOnInit(): void {
    if (!this.selectedTimezone) {
      this.selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    this.timezones = this.getTimeZones();
    this.filteredTimezones = [...this.timezones];

    // Show selected timezone in input
    this.searchTerm = this.selectedTimezone || '';
  }

  getTimeZones(): string[] {
    return Intl.supportedValuesOf('timeZone')
      .sort((a, b) => a.localeCompare(b));
  }

  filterTimezones() {
    const value = this.searchTerm.toLowerCase();

    this.filteredTimezones = this.timezones.filter(tz =>
      tz.toLowerCase().includes(value)
    );
  }

  openDropdown() {
    this.isOpen = true;
    this.filterTimezones();
  }

  selectTimezone(tz: string) {
    this.selectedTimezone = tz;
    this.searchTerm = tz;
    this.isOpen = false;
    this.timezoneChange.emit(tz);
  }
}
