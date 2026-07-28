import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthLayoutComponent, OtpInputComponent],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  @ViewChild(OtpInputComponent) otpInputComponent!: OtpInputComponent;

  userEmail = 'you@company.com';
  otpCode = '';
  loading = false;

  constructor(private router: Router, private authService: AuthService, private toastService: ToastService) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['email']) {
      this.userEmail = navigation.extras.state['email'];
    }
  }

  ngOnInit(): void {
    if (history.state && history.state.email) {
      this.userEmail = history.state.email;
    }
  }

  handleOtpSubmit(code: string): void {
    this.otpCode = code;
    this.verifyCode();
  }

 verifyCode(): void {
  if (this.loading) {
    return;
  }

  if (this.otpInputComponent) {
    this.otpCode = this.otpInputComponent.digits.join('');
  }

  if (!this.otpCode || this.otpCode.length !== 6) {
    this.toastService.error('Please enter a valid 6-digit code.');
    return;
  }

  this.loading = true;

  this.authService.verifyEmail(this.otpCode).subscribe({
    next: (res) => {
      this.loading = false;
      if (!res.success) {
        this.toastService.error(res.message || 'Unable to verify your email.');
        return;
      }

      this.toastService.success('Email verified successfully.');
      window.setTimeout(() => void this.router.navigate(['/auth/login']), 1000);
    },
    error: (err) => {
      this.loading = false;
      this.toastService.error(err.error?.message || 'Unable to verify your email.');
    }
  });
}

  handleResendOtp(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;

    this.authService.resendVerification(this.userEmail).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toastService.success(res.message || 'A new verification code has been sent to your email.');
        } else {
          this.toastService.error(res.message || 'Failed to resend code.');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Error resending verification code.');
      }
    });
  }
}
