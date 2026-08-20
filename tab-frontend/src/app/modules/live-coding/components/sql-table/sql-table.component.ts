import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SqlColumnType, SqlTable } from '../../models/sql-execution-context';

@Component({
  selector: 'app-sql-table',
  templateUrl: './sql-table.component.html',
  styleUrl: './sql-table.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SqlTableComponent {
  @Input()
  table!: SqlTable;

  @Output() 
  tableChange = new EventEmitter<SqlTable>();

  @Output() 
  delete = new EventEmitter<SqlTable>();

  readonly columnTypes = Object.values(SqlColumnType);

  get isCollapsed(): boolean {
    return !this.table.isExpanded;
  }

  updateCell(rowIndex:number, columnName:string, value:any) {
    const updated = [...this.table.rows];
    updated[rowIndex]={
      ...updated[rowIndex],
      [columnName]:value
    };
    this.table.rows=updated;
    this.tableChange.emit(this.table);
  }

  addRow() {
    const row: any = {};
    for (const column of this.table.columns) {
      if (column.autoIncrement) {
        const maxId = Math.max(
          0,
          ...this.table.rows.map(r => Number(r[column.name]) || 0)
        );
        row[column.name] = maxId + 1;
      } else {
        row[column.name] = null;
      }
    }
    this.table.rows.push(row);
    this.tableChange.emit(this.table);
  }

  addColumn() {
    const columnName = `Column${this.table.columns.length + 1}`;
    this.table.columns.push({
      name: columnName,
      type: SqlColumnType.TEXT
    });
    for (const row of this.table.rows) {
      row[columnName] = null;
    }
    this.tableChange.emit(this.table);
  }

  deleteRow(index: number) {
    const updated = this.table.rows.filter((_, i) => i !== index);
    this.table.rows = updated;
    this.tableChange.emit(this.table);
  }

  deleteColumn(columnName: string) {
    this.table.columns = this.table.columns.filter(c => c.name !== columnName);
    for (const row of this.table.rows) {
      delete row[columnName];
    }
    this.tableChange.emit(this.table);
  }

  renameColumn(oldName: string, newName: string) {
    if (!newName || oldName === newName) {
      return;
    }
    const column = this.table.columns.find(c => c.name === oldName);
    if (!column) {
      return;
    }
    column.name = newName;
    for (const row of this.table.rows) {
      row[newName] = row[oldName];
      delete row[oldName];
    }
    this.tableChange.emit(this.table);
  }

  toggleCollapse() {
    this.table.isExpanded = !this.table.isExpanded;
    this.tableChange.emit(this.table);
  }

  deleteTable() {
    this.delete.emit(this.table);
  }
}
