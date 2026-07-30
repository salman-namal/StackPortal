import { Component } from '@angular/core';
import { DataTableColumn, DataTableComponent, DataTableFilter } from '../../shared/components/data-table/data-table.component';

interface UserRow extends Record<string, unknown> { id: number; name: string; email: string; username: string; department: string; role: string; country: string; status: string; createdDate: string; avatar: string | null; }

@Component({ selector: 'app-dashboard-users', standalone: true, imports: [DataTableComponent], templateUrl: './dashboard-users.component.html', styleUrl: './dashboard-users.component.scss' })
export class DashboardUsersComponent {
  readonly columns: DataTableColumn[] = [
    { key: 'name', label: 'User', sortable: true, avatar: true }, { key: 'email', label: 'Email', sortable: true }, { key: 'username', label: 'Username', sortable: true }, { key: 'department', label: 'Department', sortable: true }, { key: 'role', label: 'Role', sortable: true, badge: true }, { key: 'country', label: 'Country', sortable: true }, { key: 'status', label: 'Status', sortable: true, badge: true }, { key: 'createdDate', label: 'Created', sortable: true }
  ];
  readonly filters: DataTableFilter[] = [
    { key: 'department', label: 'Department', options: ['Engineering', 'HR', 'Finance', 'Marketing'] }, { key: 'role', label: 'Role', options: ['Admin', 'Manager', 'User'] }, { key: 'status', label: 'Status', options: ['Active', 'Pending', 'Suspended', 'Inactive'] }
  ];
  readonly users: UserRow[] = [
    ['Aisha Khan','aisha.khan@stackportal.io','aisha.khan','Engineering','Admin','United States','Active','2026-01-08'],['Daniel Brooks','daniel.brooks@stackportal.io','dbrooks','Engineering','Manager','Canada','Active','2026-01-12'],['Maya Patel','maya.patel@stackportal.io','maya.p','Marketing','User','India','Pending','2026-01-18'],['Noah Williams','noah.williams@stackportal.io','nwilliams','Finance','Manager','United Kingdom','Active','2026-02-02'],['Sofia Martinez','sofia.martinez@stackportal.io','smartinez','HR','User','Spain','Inactive','2026-02-11'],['Ethan Chen','ethan.chen@stackportal.io','echen','Engineering','User','Singapore','Active','2026-02-19'],['Olivia Brown','olivia.brown@stackportal.io','obrown','Marketing','Manager','Australia','Active','2026-03-01'],['Liam Johnson','liam.johnson@stackportal.io','ljohnson','Finance','User','United States','Suspended','2026-03-08'],['Emma Davis','emma.davis@stackportal.io','edavis','HR','Admin','Canada','Active','2026-03-14'],['James Wilson','james.wilson@stackportal.io','jwilson','Engineering','User','Germany','Pending','2026-03-21'],['Isabella Moore','isabella.moore@stackportal.io','imoore','Marketing','User','Italy','Active','2026-04-03'],['Benjamin Lee','benjamin.lee@stackportal.io','blee','Finance','Manager','South Korea','Active','2026-04-10'],['Charlotte Taylor','charlotte.taylor@stackportal.io','ctaylor','HR','User','France','Inactive','2026-04-17'],['Henry Anderson','henry.anderson@stackportal.io','handerson','Engineering','User','United States','Active','2026-04-23'],['Amelia Thomas','amelia.thomas@stackportal.io','athomas','Marketing','Admin','Brazil','Active','2026-05-02'],['Lucas Martin','lucas.martin@stackportal.io','lmartin','Finance','User','Mexico','Pending','2026-05-09'],['Harper Clark','harper.clark@stackportal.io','hclark','HR','Manager','Ireland','Active','2026-05-16'],['Alexander Lewis','alexander.lewis@stackportal.io','alewis','Engineering','User','Japan','Suspended','2026-05-23'],['Evelyn Walker','evelyn.walker@stackportal.io','ewalker','Marketing','User','New Zealand','Active','2026-06-02'],['Michael Hall','michael.hall@stackportal.io','mhall','Finance','Manager','United States','Active','2026-06-11']
  ].map(([name, email, username, department, role, country, status, createdDate], index) => ({ id: index + 1, name, email, username, department, role, country, status, createdDate, avatar: null }));

  onCreate(): void {}
  onDeleteSelected(_rows: Record<string, unknown>[]): void {}
  onView(_row: Record<string, unknown>): void {}
  onEdit(_row: Record<string, unknown>): void {}
  onDelete(_row: Record<string, unknown>): void {}
}
