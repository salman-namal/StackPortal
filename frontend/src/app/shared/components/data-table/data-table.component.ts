import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface DataTableColumn { key: string; label: string; sortable?: boolean; badge?: boolean; avatar?: boolean; }
export interface DataTableFilter { key: string; label: string; options: string[]; selected?: string; }
export interface DataTableFilterChange { key: string; value: string; }

@Component({ selector: 'app-data-table', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './data-table.component.html', styleUrl: './data-table.component.scss' })
export class DataTableComponent implements OnChanges {
  @Input() columns: DataTableColumn[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() filters: DataTableFilter[] = [];
  @Input() rowKey = 'id';
  @Input() entityName = 'items';
  @Input() createButtonText = 'Create';
  @Input() loading = false;
  @Input() pageSize = 10;
  @Output() create = new EventEmitter<void>();
  @Output() deleteSelected = new EventEmitter<Record<string, unknown>[]>();
  @Output() view = new EventEmitter<Record<string, unknown>>();
  @Output() edit = new EventEmitter<Record<string, unknown>>();
  @Output() delete = new EventEmitter<Record<string, unknown>>();
  @Output() filterChange = new EventEmitter<DataTableFilterChange>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  searchTerm = '';
  page = 1;
  sortKey = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  readonly selectedKeys = new Set<string>();
  readonly pageSizes = [10, 20, 50];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows'] || changes['filters']) { this.page = 1; }
  }

  get filteredRows(): Record<string, unknown>[] {
    const term = this.searchTerm.trim().toLowerCase();
    let result = this.rows.filter(row => {
      const matchesSearch = !term || this.columns.some(column => String(row[column.key] ?? '').toLowerCase().includes(term));
      const matchesFilters = this.filters.every(filter => !filter.selected || String(row[filter.key] ?? '') === filter.selected);
      return matchesSearch && matchesFilters;
    });
    if (this.sortKey) {
      result = [...result].sort((a, b) => String(a[this.sortKey] ?? '').localeCompare(String(b[this.sortKey] ?? ''), undefined, { numeric: true }) * (this.sortDirection === 'asc' ? 1 : -1));
    }
    return result;
  }

  get pagedRows(): Record<string, unknown>[] { const start = (this.page - 1) * this.pageSize; return this.filteredRows.slice(start, start + this.pageSize); }
  get pageCount(): number { return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize)); }
  get pages(): number[] { return Array.from({ length: this.pageCount }, (_, index) => index + 1); }
  get allPageSelected(): boolean { return this.pagedRows.length > 0 && this.pagedRows.every(row => this.selectedKeys.has(this.keyFor(row))); }
  get selectionCount(): number { return this.selectedKeys.size; }
  get rangeStart(): number { return this.filteredRows.length ? (this.page - 1) * this.pageSize + 1 : 0; }
  get rangeEnd(): number { return Math.min(this.page * this.pageSize, this.filteredRows.length); }

  value(row: Record<string, unknown>, key: string): string { return String(row[key] ?? '—'); }
  initials(row: Record<string, unknown>): string { return this.value(row, 'name').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
  badgeClass(value: string): string { return `badge-${value.toLowerCase().replace(/\s+/g, '-')}`; }
  keyFor(row: Record<string, unknown>): string { return String(row[this.rowKey]); }
  toggleSort(column: DataTableColumn): void { if (!column.sortable) return; this.sortDirection = this.sortKey === column.key && this.sortDirection === 'asc' ? 'desc' : 'asc'; this.sortKey = column.key; }
  toggleRow(row: Record<string, unknown>): void { const key = this.keyFor(row); this.selectedKeys.has(key) ? this.selectedKeys.delete(key) : this.selectedKeys.add(key); }
  togglePage(): void { this.pagedRows.forEach(row => this.allPageSelected ? this.selectedKeys.delete(this.keyFor(row)) : this.selectedKeys.add(this.keyFor(row))); }
  changeFilter(filter: DataTableFilter, value: string): void { filter.selected = value; this.page = 1; this.filterChange.emit({ key: filter.key, value }); }
  changePage(page: number): void { if (page < 1 || page > this.pageCount) return; this.page = page; this.pageChange.emit(page); }
  changePageSize(value: string): void { this.pageSize = Number(value); this.page = 1; this.pageSizeChange.emit(this.pageSize); }
  removeSelected(): void { const selected = this.rows.filter(row => this.selectedKeys.has(this.keyFor(row))); this.deleteSelected.emit(selected); this.selectedKeys.clear(); }
}
