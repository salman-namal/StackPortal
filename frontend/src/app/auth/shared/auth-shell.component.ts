import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../features/auth/services/theme.service';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './auth-shell.component.html',
  styleUrls: ['./auth-shell.component.scss']
})
export class AuthShellComponent implements OnInit {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showThemeToggle = true;
  isDark = false;

  constructor(private readonly themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.theme$.subscribe((isDark) => {
      this.isDark = isDark;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
