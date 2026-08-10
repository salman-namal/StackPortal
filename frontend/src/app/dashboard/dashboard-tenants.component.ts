import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, takeUntil } from 'rxjs';
import { DataTableAction, DataTableActionEvent, DataTableColumn, DataTableComponent, DataTableFilter, DataTableFilterChange, DataTableSortChange } from '../shared/components/data-table/data-table.component';
import { PageResponse, TenantDto, TenantsService } from '../core/services/tenants.service';
import { ToastService } from '../core/services/toast.service';

type TenantRow = TenantDto & Record<string, unknown>;

@Component({
  selector: 'app-dashboard-tenants',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './dashboard-tenants.component.html',
  styleUrl: './dashboard-tenants.component.scss'
})
export class DashboardTenantsComponent implements OnInit, OnDestroy {
  readonly columns: DataTableColumn[] = [
    { key: 'name', label: 'Tenant Name', sortable: true, avatar: true },
    { key: 'code', label: 'Tenant Code', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'website', label: 'Website' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' },
    { key: 'active', label: 'Status', sortable: true, badge: true, format: value => value ? 'Active' : 'Inactive' },
    { key: 'createdAt', label: 'Created Date', sortable: true, format: value => value ? new Date(String(value)).toLocaleDateString() : '—' }
  ];

  readonly actions: DataTableAction[] = [
    { key: 'view', label: 'View', icon: 'visibility' },
    { key: 'edit', label: 'Edit', icon: 'edit' },
    { key: 'delete', label: 'Delete', icon: 'delete', danger: true }
  ];

  filters: DataTableFilter[] = [
    { key: 'active', label: 'Status', options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] }
  ];

  rows: TenantRow[] = [];
  loading = false;
  error: string | null = null;
  viewingTenant: TenantDto | null = null;
  page = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  first = true;
  last = true;
  search = '';
  sortBy = 'createdAt';
  sortDir: 'asc' | 'desc' = 'desc';
  active?: boolean;

  private readonly searchChanges = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private tenantsService: TenantsService, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(search => {
      this.search = search;
      this.page = 0;
      this.loadTenants();
    });
    this.loadTenants();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTenants(): void {
    this.loading = true;
    this.error = null;
    this.tenantsService.list({ page: this.page, size: this.pageSize, search: this.search, sortBy: this.sortBy, sortDir: this.sortDir, active: this.active })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          const result: PageResponse<TenantDto> = response.data;
          // Remove sensitive DB fields if present
          this.rows = (result.content as TenantRow[]).map(r => {
            const { databaseName, databaseUrl, databaseUsername, databasePassword, ...rest } = r as any;
            return rest as TenantRow;
          });
          this.page = result.number ?? this.page;
          this.pageSize = result.size;
          this.totalElements = result.totalElements;
          this.totalPages = result.totalPages;
          this.first = result.first;
          this.last = result.last;
          this.loading = false;
        },
        error: error => {
          this.rows = [];
          this.loading = false;
          this.error = error.error?.message || 'Unable to load tenants.';
        }
      });
  }

  onSearchChange(search: string): void { this.searchChanges.next(search.trim()); }
  onPageChange(page: number): void { this.page = page; this.loadTenants(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.page = 0; this.loadTenants(); }
  onSortChange(sort: DataTableSortChange): void { this.sortBy = sort.sortBy; this.sortDir = sort.sortDir; this.page = 0; this.loadTenants(); }

  onFilterChange(change: DataTableFilterChange): void {
    const selected = change.value || undefined;
    if (change.key === 'active') this.active = selected === undefined ? undefined : selected === 'true';
    this.filters = this.filters.map(filter => filter.key === change.key ? { ...filter, selected: change.value } : filter);
    this.page = 0;
    this.loadTenants();
  }

  onCreate(): void { this.router.navigate(['/admin/tenants/create']); }

  onAction(event: DataTableActionEvent): void {
    const id = Number(event.row['id']);
    if (!Number.isFinite(id)) return;

    if (event.key === 'view') {
      this.tenantsService.get(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: response => this.viewingTenant = response.data,
        error: error => this.toast.error(error.error?.message || 'Unable to load tenant details.')
      });
      return;
    }
    if (event.key === 'edit') {
      this.router.navigate(['/admin/tenants/edit', id]);
      return;
    }
    if (event.key === 'delete') {
      if (window.confirm('Delete this tenant?')) this.deleteTenants([id]);
      return;
    }
  }

  closeView(): void { this.viewingTenant = null; }

  onBulkDelete(rows: Record<string, unknown>[]): void {
    const ids = rows.map(row => Number(row['id'])).filter(Number.isFinite);
    if (ids.length && window.confirm(`Delete ${ids.length} selected tenant(s)?`)) this.deleteTenants(ids);
  }

  private deleteTenants(ids: number[]): void {
    forkJoin(ids.map(id => this.tenantsService.delete(id))).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.success(ids.length === 1 ? 'Tenant deleted.' : 'Tenants deleted.');
        if (this.rows.length === ids.length && this.page > 0) this.page--;
        this.loadTenants();
      },
      error: error => {
        this.toast.error(error.error?.message || 'Unable to delete tenant.');
        this.loadTenants();
      }
    });
  }
}
