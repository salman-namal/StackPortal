import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeBannerComponent } from './components/welcome-banner/welcome-banner.component';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { Stat } from './dashboard.models';
import { AuthService } from '../../core/services/auth.service';

@Component({ selector: 'app-dashboard-overview', standalone: true, imports: [CommonModule, WelcomeBannerComponent, StatsCardComponent, AnalyticsComponent], templateUrl: './dashboard-overview.component.html', styleUrl: './dashboard-overview.component.scss' })
export class DashboardOverviewComponent {
  constructor(private readonly authService: AuthService) {}
  get userName(): string { const user = this.authService.getCurrentUser(); return user?.name || user?.username || 'User'; }
  readonly stats: Stat[] = [
    { label: 'Total Users', value: '2,847', change: '12.5%', tone: 'blue', icon: 'users', points: '0,24 16,20 30,21 45,13 60,16 75,5 90,8' },
    { label: 'Active Projects', value: '124', change: '8.2%', tone: 'violet', icon: 'folder', points: '0,23 17,19 30,22 43,13 57,17 74,8 90,4' },
    { label: 'Tasks Completed', value: '1,684', change: '18.2%', tone: 'green', icon: 'check-square', points: '0,24 15,23 28,18 43,20 58,12 76,10 90,2' },
    { label: 'Growth Rate', value: '24.8%', change: '4.6%', tone: 'amber', icon: 'bar-chart', points: '0,20 14,23 29,14 44,17 60,9 76,12 90,3' }
  ];
}
