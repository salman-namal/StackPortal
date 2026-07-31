import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, takeUntil } from 'rxjs';
import { DataTableAction, DataTableActionEvent, DataTableColumn, DataTableComponent, DataTableFilter, DataTableFilterChange, DataTableSortChange } from '../../shared/components/data-table/data-table.component';
import { PageResponse, UserDto, UsersService } from '../../core/services/users.service';
import { ToastService } from '../../core/services/toast.service';

type UserRow = UserDto & Record<string, unknown>;

@Component({ selector: 'app-dashboard-users', standalone: true, imports: [CommonModule, DataTableComponent], templateUrl: './dashboard-users.component.html', styleUrl: './dashboard-users.component.scss' })
export class DashboardUsersComponent implements OnInit, OnDestroy {
  readonly columns: DataTableColumn[] = [
    { key: 'name', label: 'Name', sortable: true, avatar: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'roles', label: 'Roles', badge: true },
    { key: 'active', label: 'Status', sortable: true, badge: true, format: value => value ? 'Active' : 'Inactive' },
    { key: 'emailVerified', label: 'Email Verified', sortable: true, badge: true, format: value => value ? 'Verified' : 'Unverified' },
    { key: 'createdAt', label: 'Created Date', sortable: true, format: value => value ? new Date(String(value)).toLocaleDateString() : '—' }
  ];
  readonly actions: DataTableAction[] = [
    { key: 'view', label: 'View', icon: 'visibility' },
    { key: 'edit', label: 'Edit', icon: 'edit' },
    { key: 'activate', label: 'Activate', icon: 'check_circle', visible: row => !Boolean(row['active']) },
    { key: 'deactivate', label: 'Deactivate', icon: 'block', visible: row => Boolean(row['active']) },
    { key: 'delete', label: 'Delete', icon: 'delete', danger: true }
  ];
  filters: DataTableFilter[] = [
    { key: 'active', label: 'Status', options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
    { key: 'emailVerified', label: 'Email Verification', options: [{ label: 'Verified', value: 'true' }, { label: 'Unverified', value: 'false' }] }
  ];

  rows: UserRow[] = [];
  loading = false;
  error: string | null = null;
  viewingUser: UserDto | null = null;
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
  emailVerified?: boolean;

  private readonly searchChanges = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private usersService: UsersService, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(search => {
      this.search = search;
      this.page = 0;
      this.loadUsers();
    });
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.usersService.list({ page: this.page, size: this.pageSize, search: this.search, sortBy: this.sortBy, sortDir: this.sortDir, active: this.active, emailVerified: this.emailVerified })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          const result: PageResponse<UserDto> = response.data;
          this.rows = result.content as UserRow[];
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
          this.error = error.error?.message || 'Unable to load users.';
        }
      });
  }

  onSearchChange(search: string): void { this.searchChanges.next(search.trim()); }
  onPageChange(page: number): void { this.page = page; this.loadUsers(); }
  onPageSizeChange(size: number): void { this.pageSize = size; this.page = 0; this.loadUsers(); }
  onSortChange(sort: DataTableSortChange): void { this.sortBy = sort.sortBy; this.sortDir = sort.sortDir; this.page = 0; this.loadUsers(); }

  onFilterChange(change: DataTableFilterChange): void {
    const selected = change.value || undefined;
    if (change.key === 'active') this.active = selected === undefined ? undefined : selected === 'true';
    if (change.key === 'emailVerified') this.emailVerified = selected === undefined ? undefined : selected === 'true';
    this.filters = this.filters.map(filter => filter.key === change.key ? { ...filter, selected: change.value } : filter);
    this.page = 0;
    this.loadUsers();
  }

  onCreate(): void { this.router.navigate(['/admin/create']); }

  onAction(event: DataTableActionEvent): void {
    const id = Number(event.row['id']);
    if (!Number.isFinite(id)) return;

    if (event.key === 'view') {
      this.usersService.get(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: response => this.viewingUser = response.data,
        error: error => this.toast.error(error.error?.message || 'Unable to load user details.')
      });
      return;
    }
    if (event.key === 'edit') {
      this.router.navigate(['/admin/edit', id]);
      return;
    }
    if (event.key === 'delete') {
      if (window.confirm('Delete this user?')) this.deleteUsers([id]);
      return;
    }

    const active = event.key === 'activate';
    if (window.confirm(`${active ? 'Activate' : 'Deactivate'} this user?`)) {
      this.usersService.setActive(id, active).pipe(takeUntil(this.destroy$)).subscribe({
        next: response => { this.toast.success(response.message); this.loadUsers(); },
        error: error => this.toast.error(error.error?.message || 'Unable to update user status.')
      });
    }
  }

  onBulkDelete(rows: Record<string, unknown>[]): void {
    const ids = rows.map(row => Number(row['id'])).filter(Number.isFinite);
    if (ids.length && window.confirm(`Delete ${ids.length} selected user(s)?`)) this.deleteUsers(ids);
  }

  closeView(): void { this.viewingUser = null; }

  private deleteUsers(ids: number[]): void {
    forkJoin(ids.map(id => this.usersService.delete(id))).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.success(ids.length === 1 ? 'User deleted.' : 'Users deleted.');
        if (this.rows.length === ids.length && this.page > 0) this.page--;
        this.loadUsers();
      },
      error: error => {
        this.toast.error(error.error?.message || 'Unable to delete user.');
        this.loadUsers();
      }
    });
  }
}
