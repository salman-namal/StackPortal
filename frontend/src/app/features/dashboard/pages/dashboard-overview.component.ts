import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WelcomeBannerComponent } from '../components/welcome-banner/welcome-banner.component';
import { StatsCardComponent } from '../components/stats-card/stats-card.component';
import { AnalyticsComponent } from '../components/analytics/analytics.component';
import { Stat } from '../models/dashboard.models';
import { AuthService } from '../../../core/services/auth.service';
import { TenantDashboard, TenantsService } from '../../tenants/services/tenants.service';

@Component({ selector: 'app-dashboard-overview', standalone: true, imports: [CommonModule, RouterModule, WelcomeBannerComponent, StatsCardComponent, AnalyticsComponent], templateUrl: './dashboard-overview.component.html', styleUrl: './dashboard-overview.component.scss' })
export class DashboardOverviewComponent implements OnInit {
  dashboard: TenantDashboard | null = null; loading = false;
  constructor(private readonly authService: AuthService, private readonly tenants: TenantsService) {}
  get userName(): string { const user = this.authService.getCurrentUser(); return user?.name || user?.username || 'User'; }
  get isSuperAdmin(): boolean { return this.authService.hasRole('SUPER_ADMIN'); }
  stats: Stat[] = [
    { label: 'Total Users', value: 'â€”', change: '', tone: 'blue', icon: 'users', points: '0,24 16,20 30,21 45,13 60,16 75,5 90,8' },
    { label: 'Active Projects', value: 'â€”', change: '', tone: 'violet', icon: 'folder', points: '0,23 17,19 30,22 43,13 57,17 74,8 90,4' },
    { label: 'Tasks Completed', value: 'â€”', change: '', tone: 'green', icon: 'check-square', points: '0,24 15,23 28,18 43,20 58,12 76,10 90,2' },
    { label: 'Growth Rate', value: 'â€”', change: '', tone: 'amber', icon: 'bar-chart', points: '0,20 14,23 29,14 44,17 60,9 76,12 90,3' }
  ];
  ngOnInit(): void { if (this.isSuperAdmin) { this.loading = true; this.tenants.dashboard().subscribe({ next: r => { this.dashboard = r.data; this.stats = [
    { label: 'Total Tenants', value: String(r.data.totalTenants), change: '', tone: 'blue', icon: 'users', points: '0,24 16,20 30,21 45,13 60,16 75,5 90,8' },
    { label: 'Active Tenants', value: String(r.data.activeTenants), change: '', tone: 'green', icon: 'check-square', points: '0,24 15,23 28,18 43,20 58,12 76,10 90,2' },
    { label: 'Inactive Tenants', value: String(r.data.inactiveTenants), change: '', tone: 'amber', icon: 'bar-chart', points: '0,20 14,23 29,14 44,17 60,9 76,12 90,3' }
  ]; this.loading = false; }, error: () => this.loading = false }); } }
}
