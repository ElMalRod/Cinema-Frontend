import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableColumn } from '../../models/table-column.model';

@Component({
  selector: 'app-shared-table',
  standalone: false,
  templateUrl: './shared-table.component.html',
  styleUrl: './shared-table.component.scss'
})
export class SharedTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: unknown[] = [];
  @Input() loading = false;
  @Input() paginator = true;
  @Input() rows = 10;
  @Input() showActions = true;
  @Input() searchPlaceholder = 'Buscar...';
  @Input() emptyMessage = 'Sin datos disponibles';

  @Output() onRowSelect = new EventEmitter<unknown>();
  @Output() onEdit = new EventEmitter<unknown>();
  @Output() onDelete = new EventEmitter<unknown>();

  get globalFilterFields(): string[] {
    return this.columns.map((column) => column.field);
  }

  get colspan(): number {
    return this.columns.length + (this.showActions ? 1 : 0);
  }

  emitRowSelect(row: unknown): void {
    this.onRowSelect.emit(row);
  }

  emitEdit(row: unknown): void {
    this.onEdit.emit(row);
  }

  emitDelete(row: unknown): void {
    this.onDelete.emit(row);
  }

  resolveFieldData(row: unknown, field: string): unknown {
    const value = (row as Record<string, unknown>)[field];

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value;
  }
}
