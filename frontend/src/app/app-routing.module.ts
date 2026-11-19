import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { DashboardComponent } from './layouts/dashboard/dashboard-layout.component';
import { DashboardOverviewComponent } from './features/dashboard/pages/dashboard-overview.component';

const routes: Routes = [
  {
    path: 'auth',
    children: AUTH_ROUTES
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] }
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardOverviewComponent, pathMatch: 'full' },
      { path: 'users', loadComponent: () => import('./features/users/pages/users-list/dashboard-users.component').then((m) => m.DashboardUsersComponent), canActivate: [RoleGuard], data: { roles: ['ADMIN'] } },
      { path: 'tenants', loadComponent: () => import('./features/tenants/pages/tenants-list.component').then((m) => m.DashboardTenantsComponent), canActivate: [RoleGuard], data: { roles: ['SUPER_ADMIN'] } }
    ]
  },

  {
    path: 'upcoming/:feature',
    loadComponent: () => import('./features/upcoming/pages/upcoming/upcoming.component').then((m) => m.UpcomingComponent),
    canActivate: [AuthGuard]
  },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

