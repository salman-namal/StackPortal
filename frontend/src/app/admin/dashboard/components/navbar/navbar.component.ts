import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../../features/auth/services/theme.service';
import { DashboardIconComponent } from '../../../../shared/components/dashboard-icon/dashboard-icon.component';

@Component({ selector: 'app-dashboard-navbar', standalone: true, imports: [CommonModule, RouterModule, DashboardIconComponent], templateUrl: './navbar.component.html', styleUrl: './navbar.component.scss' })
export class NavbarComponent {
  @Input() userName = 'User';
  @Output() menu = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  profileOpen = false;
  notificationsOpen = false;
  searchFocused = false;
  searchTerm = '';
  readonly notifications = ['Quarterly report is ready to review', 'Three tasks are due today', 'A new team member joined your workspace'];

  constructor(readonly theme: ThemeService) {}
  toggleTheme(): void { this.theme.toggleTheme(); }
}
