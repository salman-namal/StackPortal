import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface DataTableColumn { key: string; label: string; sortable?: boolean; badge?: boolean; avatar?: boolean; format?: (value: unknown, row: Record<string, unknown>) => string; }
export interface DataTableFilter { key: string; label: string; options: { label: string; value: string }[]; selected?: string; }
export interface DataTableFilterChange { key: string; value: string; }
export interface DataTableSortChange { sortBy: string; sortDir: 'asc' | 'desc'; }
export interface DataTableAction { key: string; label: string; icon: string; visible?: (row: Record<string, unknown>) => boolean; danger?: boolean; }
export interface DataTableActionEvent { key: string; row: Record<string, unknown>; }

@Component({ selector: 'app-data-table', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './data-table.component.html', styleUrl: './data-table.component.scss' })
export class DataTableComponent implements OnChanges {
  @Input() columns: DataTableColumn[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() filters: DataTableFilter[] = [];
  @Input() rowKey = 'id'; @Input() entityName = 'items'; @Input() createButtonText = 'Create';
  @Input() loading = false; @Input() error: string | null = null;
  @Input() page = 0; @Input() pageSize = 10; @Input() totalElements = 0; @Input() totalPages = 0; @Input() first = true; @Input() last = true;
  @Input() searchValue = ''; @Input() sortBy = ''; @Input() sortDir: 'asc' | 'desc' = 'asc'; @Input() pageSizes = [10, 20, 50];
  @Input() showCreate = true; @Input() actions: DataTableAction[] = []; @Input() showBulkDelete = false;
  @Output() pageChange = new EventEmitter<number>(); @Output() pageSizeChange = new EventEmitter<number>(); @Output() searchChange = new EventEmitter<string>(); @Output() sortChange = new EventEmitter<DataTableSortChange>(); @Output() filterChange = new EventEmitter<DataTableFilterChange>(); @Output() create = new EventEmitter<void>(); @Output() refresh = new EventEmitter<void>(); @Output() selectionChange = new EventEmitter<Record<string, unknown>[]>(); @Output() action = new EventEmitter<DataTableActionEvent>(); @Output() bulkDelete = new EventEmitter<Record<string, unknown>[]>();
  readonly selectedKeys = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void { if (changes['rows']) { this.selectedKeys.clear(); this.emitSelection(); } }
  get pageNumbers(): number[] { const count = Math.max(1, this.totalPages); const start = Math.max(1, Math.min(this.page - 1, count - 4)); const end = Math.min(count, start + 4); return Array.from({ length: end - start + 1 }, (_, index) => start + index); }
  get allPageSelected(): boolean { return this.rows.length > 0 && this.rows.every(row => this.selectedKeys.has(this.keyFor(row))); }
  get somePageSelected(): boolean { return !this.allPageSelected && this.rows.some(row => this.selectedKeys.has(this.keyFor(row))); }
  get selectionCount(): number { return this.rows.filter(row => this.selectedKeys.has(this.keyFor(row))).length; }
  get rangeStart(): number { return this.totalElements ? this.page * this.pageSize + 1 : 0; }
  get rangeEnd(): number { return Math.min((this.page + 1) * this.pageSize, this.totalElements); }
  displayValue(row: Record<string, unknown>, column: DataTableColumn): string { const value = row[column.key]; if (column.format) return column.format(value, row); if (Array.isArray(value)) return value.join(', '); return value == null || value === '' ? '—' : String(value); }
  initials(row: Record<string, unknown>): string { return String(row['name'] ?? '').split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
  badgeClass(value: string): string { return `badge-${value.toLowerCase().replace(/\s+/g, '-')}`; }
  keyFor(row: Record<string, unknown>): string { return String(row[this.rowKey]); }
  onSearch(value: string): void { this.searchChange.emit(value); }
  toggleSort(column: DataTableColumn): void { if (!column.sortable) return; this.sortChange.emit({ sortBy: column.key, sortDir: this.sortBy === column.key && this.sortDir === 'asc' ? 'desc' : 'asc' }); }
  toggleRow(row: Record<string, unknown>, checked: boolean): void { const key = this.keyFor(row); checked ? this.selectedKeys.add(key) : this.selectedKeys.delete(key); this.emitSelection(); }
  togglePage(): void { this.rows.forEach(row => this.allPageSelected ? this.selectedKeys.delete(this.keyFor(row)) : this.selectedKeys.add(this.keyFor(row))); this.emitSelection(); }
  changeFilter(filter: DataTableFilter, value: string): void { this.filterChange.emit({ key: filter.key, value }); }
  changePage(page: number): void { if (page >= 0 && page < this.totalPages && page !== this.page) this.pageChange.emit(page); }
  changePageSize(value: string): void { this.pageSizeChange.emit(Number(value)); }
  isActionVisible(action: DataTableAction, row: Record<string, unknown>): boolean { return !action.visible || action.visible(row); }
  emitAction(action: DataTableAction, row: Record<string, unknown>): void { this.action.emit({ key: action.key, row }); }
  deleteSelection(): void { const selected = this.rows.filter(row => this.selectedKeys.has(this.keyFor(row))); if (selected.length) this.bulkDelete.emit(selected); }
  trackByRow = (_: number, row: Record<string, unknown>): string => this.keyFor(row);
  private emitSelection(): void { this.selectionChange.emit(this.rows.filter(row => this.selectedKeys.has(this.keyFor(row)))); }
}
