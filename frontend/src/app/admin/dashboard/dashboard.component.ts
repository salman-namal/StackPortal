import { Component } from '@angular/core';
import { AuthenticatedUser, AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SidebarService } from '../../core/services/sidebar.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  readonly user: AuthenticatedUser | null;
  sidebarOpen = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    readonly sidebarState: SidebarService
  ) {
    this.user = authService.getCurrentUser();
  }

  get userName(): string {
    return this.user?.name || this.user?.username || 'User';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  toggleSidebarCollapse(): void {
    this.sidebarState.toggle();
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }
}
