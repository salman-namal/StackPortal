import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DashboardIconComponent } from '../dashboard-icon/dashboard-icon.component';

@Component({ selector: 'app-upcoming', standalone: true, imports: [RouterModule, DashboardIconComponent], templateUrl: './upcoming.component.html', styleUrl: './upcoming.component.scss' })
export class UpcomingComponent implements OnInit {
  title = 'Feature';
  description = 'This feature is currently under development.';
  icon: 'rocket' = 'rocket';
  constructor(private readonly route: ActivatedRoute) {}
  ngOnInit(): void { const feature = this.route.snapshot.paramMap.get('feature') || 'feature'; this.title = feature.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }
}
