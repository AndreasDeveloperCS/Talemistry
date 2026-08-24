import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-sql-result-grid',
  templateUrl: './sql-result-grid.component.html',
  styleUrl: './sql-result-grid.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SqlResultGridComponent {
  @Input()
  rows: any[] = [];

  get columns(): string[] {
    return this.rows.length ? Object.keys(this.rows[0]) : [];
  }
}
