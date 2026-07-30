import { Component, Input } from '@angular/core';
import { Stat } from '../../dashboard.models';
import { DashboardIconComponent } from '../../../../shared/components/dashboard-icon/dashboard-icon.component';
@Component({ selector: 'app-stats-card', standalone: true, imports: [DashboardIconComponent], templateUrl: './stats-card.component.html', styleUrl: './stats-card.component.scss' })
export class StatsCardComponent { @Input({required:true}) stat!: Stat; }
