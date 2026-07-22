import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-social-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-login.component.html',
  styleUrls: ['./social-login.component.scss']
})
export class SocialLoginComponent {
  @Input() label = 'Continue with Google';
  @Input() loading = false;
  @Output() googleClick = new EventEmitter<void>();

  onGoogleLogin(): void {
    if (!this.loading) {
      this.googleClick.emit();
    }
  }
}
