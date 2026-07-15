import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-social-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-login.component.html',
  styleUrls: ['./social-login.component.scss']
})
export class SocialLoginComponent {
  @Input() mode: 'login' | 'signup' = 'login';

  readonly providers = [
    { name: 'Google', icon: 'G' },
    { name: 'GitHub', icon: '◉' },
    { name: 'Microsoft', icon: '▣' }
  ];
}
