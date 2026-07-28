import { Component } from '@angular/core';
import { AuthenticatedUser, AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  readonly user: AuthenticatedUser | null;

  constructor(authService: AuthService) {
    this.user = authService.getCurrentUser();
  }
}
