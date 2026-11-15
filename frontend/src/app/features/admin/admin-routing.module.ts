import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserFormComponent } from '../users/pages/user-form/user-form.component';
import { DashboardComponent } from '../../layouts/dashboard/dashboard-layout.component';
import { TenantFormComponent } from '../tenants/pages/tenant-form.component';

const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'create', component: UserFormComponent },
  { path: 'edit/:id', component: UserFormComponent },
  { path: 'tenants/create', component: TenantFormComponent },
    { path: 'tenants/edit/:id', component: TenantFormComponent },
  { path: '', redirectTo: '/dashboard/users', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}

