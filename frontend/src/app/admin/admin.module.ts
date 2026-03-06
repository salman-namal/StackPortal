import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { UserListComponent } from './user-list/user-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@NgModule({
  declarations: [UserListComponent, UserFormComponent],
  imports: [CommonModule, ReactiveFormsModule, AdminRoutingModule, DashboardComponent]
})
export class AdminModule { }

