import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, takeUntil } from 'rxjs';
import { DataTableAction, DataTableActionEvent, DataTableColumn, DataTableComponent, DataTableFilter, DataTableFilterChange, DataTableSortChange } from '../../../shared/components/data-table/data-table.component';
import { TenantsService } from '../services/tenants.service';
import { PageResponse } from '../../../core/models/api-response.models';
import { TenantDto } from '../models/tenant.models';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog/confirmation-dialog.service';

type TenantRow = TenantDto & Record<string, unknown>;

@Component({
  selector: 'app-dashboard-tenants',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './tenants-list.component.html',
  styleUrl: './tenants-list.component.scss'
})
export class DashboardTenantsComponent implements OnInit, OnDestroy {
  readonly columns: DataTableColumn[] = [
    { key: 'name', label: 'Tenant Name', sortable: true, avatar: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' },
    { key: 'status', label: 'Status', sortable: true, badge: true, format: value => String(value).toLowerCase() },
  ];

  readonly actions: DataTableAction[] = [
    { key: 'view', label: 'View', icon: 'visibility' },
    { key: 'edit', label: 'Edit', icon: 'edit' },
    { key: 'status', label: row => row['status'] === 'ACTIVE' ? 'Deactivate' : 'Activate', icon: row => row['status'] === 'ACTIVE' ? 'toggle_off' : 'toggle_on' },
    { key: 'delete', label: 'Delete', icon: 'delete', danger: true }
  ];

  filters: DataTableFilter[] = [
    { key: 'status', label: 'Status', options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }] }
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
  status?: 'ACTIVE' | 'INACTIVE';

  private readonly searchChanges = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private tenantsService: TenantsService, private router: Router, private toast: ToastService, private confirmation: ConfirmationDialogService) {}

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
    this.tenantsService.list({ page: this.page, size: this.pageSize, search: this.search, sortBy: this.sortBy, sortDir: this.sortDir, status: this.status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          const result: PageResponse<TenantDto> = response.data;
          // Remove sensitive DB fields if present
          this.rows = (result.content as TenantRow[]).map(r => {
            const { databaseName, databaseUrl, databaseUsername, databasePassword, ...rest } = r as any;
            return { ...rest, logoUrl: r.logo } as TenantRow;
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
    if (change.key === 'status') this.status = selected === 'ACTIVE' || selected === 'INACTIVE' ? selected : undefined;
    this.filters = this.filters.map(filter => filter.key === change.key ? { ...filter, selected: change.value } : filter);
    this.page = 0;
    this.loadTenants();
  }

  onCreate(): void { this.router.navigate(['/dashboard/tenants/create']); }

  async onAction(event: DataTableActionEvent): Promise<void> {
    const id = Number(event.row['id']);
    if (!Number.isFinite(id)) return;

    if (event.key === 'view') { this.router.navigate(['/dashboard/tenants/view', id]); return; }
    if (event.key === 'edit') {
      this.router.navigate(['/dashboard/tenants/edit', id]);
      return;
    }
    if (event.key === 'status') {
      const tenant = event.row as unknown as TenantDto;
      const nextStatus = tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const confirmed = await this.confirmation.confirm({ type: nextStatus === 'ACTIVE' ? 'success' : 'warning', title: `${nextStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} Tenant?`, message: nextStatus === 'ACTIVE' ? 'Are you sure you want to activate this tenant?' : 'All users belonging to this tenant will lose access until it is reactivated.', confirmText: `Yes, ${nextStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'}` });
      if (confirmed) {
        this.tenantsService.setStatus(id, nextStatus).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => { this.toast.success(`Tenant ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`); this.loadTenants(); },
          error: error => this.toast.error(error.error?.message || 'Unable to update tenant status.')
        });
      }
      return;
    }
    if (event.key === 'delete') {
      const name = String(event.row['name'] ?? '');
      const confirmed = await this.confirmation.confirm({ type: 'danger', title: 'Delete Tenant Permanently?', message: 'This will permanently delete the tenant, its database, users, and associated resources. This action cannot be undone.', confirmText: 'Yes, Delete', requiredText: name });
      if (confirmed) this.deleteTenants([{ id, name }]);
      return;
    }
  }

  closeView(): void { this.viewingTenant = null; }

  async onBulkDelete(rows: Record<string, unknown>[]): Promise<void> {
    const tenants = rows.map(row => ({ id: Number(row['id']), name: String(row['name'] ?? '') }))
      .filter(tenant => Number.isFinite(tenant.id) && tenant.name);
    if (!tenants.length) return;
    const confirmed = await this.confirmation.confirm({
      type: 'danger',
      title: `Delete ${tenants.length} tenant${tenants.length === 1 ? '' : 's'} permanently?`,
      message: 'This permanently deletes the selected tenants, their databases, users, and unreferenced media. This action cannot be undone.',
      confirmText: `Yes, Delete ${tenants.length}`
    });
    if (confirmed) this.deleteTenants(tenants);
  }

  private deleteTenants(tenants: { id: number; name: string }[]): void {
    forkJoin(tenants.map(tenant => this.tenantsService.delete(tenant.id, tenant.name))).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.success('Tenant permanently deleted.');
        if (this.rows.length === tenants.length && this.page > 0) this.page--;
        this.loadTenants();
      },
      error: error => {
        this.toast.error(error.error?.message || 'One or more tenants could not be deleted. Deleted tenants will not be restored.');
        this.loadTenants();
      }
    });
  }
}
