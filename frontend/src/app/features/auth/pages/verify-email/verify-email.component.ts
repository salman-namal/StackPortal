import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthLayoutComponent, OtpInputComponent],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent {
  userEmail = 'you@company.com';
  otpCode = '';
  loading = false;

  constructor(private router: Router) {}

  handleOtpSubmit(code: string): void {
    this.otpCode = code;
    this.verifyCode();
  }

  verifyCode(): void {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/auth/email-verification-success']);
    }, 1200);
  }

  handleResendOtp(): void {
    console.log('Resending OTP code to', this.userEmail);
  }
}
