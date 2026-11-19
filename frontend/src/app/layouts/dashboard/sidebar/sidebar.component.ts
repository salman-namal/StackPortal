import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardIconComponent } from '../../../shared/components/dashboard-icon/dashboard-icon.component';
import { StackPortalLogoComponent } from '../../../shared/components/stack-portal-logo/stack-portal-logo.component';
import { AuthService } from '../../../core/services/auth.service';

interface NavigationItem { label: string; icon: 'dashboard' | 'folder' | 'check-square' | 'users' | 'file-chart' | 'bar-chart' | 'calendar' | 'message' | 'settings'; route: string; superAdminOnly?: boolean; }

@Component({ selector: 'app-dashboard-sidebar', standalone: true, imports: [CommonModule, RouterModule, DashboardIconComponent, StackPortalLogoComponent], templateUrl: './sidebar.component.html', styleUrl: './sidebar.component.scss' })
export class SidebarComponent {
  constructor(private readonly auth: AuthService) {}
  @Input() open = false;
  @Input() collapsed = false;
  @Input() userName = 'User';
  @Output() close = new EventEmitter<void>();
  @Output() collapse = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  readonly links: NavigationItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Projects', icon: 'folder', route: '/upcoming/projects' },
    { label: 'Tasks', icon: 'check-square', route: '/upcoming/tasks' },
    { label: 'Teams', icon: 'users', route: '/upcoming/teams' },
    { label: 'Users', icon: 'users', route: '/dashboard/users' },
    { label: 'Tenant Management', icon: 'settings', route: '/dashboard/tenants', superAdminOnly: true },
    { label: 'Reports', icon: 'file-chart', route: '/upcoming/reports' },
    { label: 'Analytics', icon: 'bar-chart', route: '/upcoming/analytics' },
    { label: 'Calendar', icon: 'calendar', route: '/upcoming/calendar' },
    { label: 'Messages', icon: 'message', route: '/upcoming/messages' },
    { label: 'Settings', icon: 'settings', route: '/upcoming/settings' }
  ];
  get visibleLinks(): NavigationItem[] { return this.links.filter(link => !link.superAdminOnly || this.auth.hasRole('SUPER_ADMIN')); }
}
