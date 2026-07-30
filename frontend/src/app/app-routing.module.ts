import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { DashboardOverviewComponent } from './admin/dashboard/dashboard-overview.component';

const routes: Routes = [
  {
    path: 'auth',
    children: AUTH_ROUTES
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] }
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardOverviewComponent, pathMatch: 'full' },
      { path: 'users', loadComponent: () => import('./dashboard/users/dashboard-users.component').then((m) => m.DashboardUsersComponent) }
    ]
  },
  {
    path: 'upcoming/:feature',
    loadComponent: () => import('./shared/components/upcoming/upcoming.component').then((m) => m.UpcomingComponent),
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

