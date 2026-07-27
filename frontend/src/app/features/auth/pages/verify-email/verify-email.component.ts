import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';
import { AuthService } from '../../../../core/services/auth.service';

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
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private router: Router, private authService: AuthService) {
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
  console.log("1. Verify button clicked");

  console.log("2. OTP Component:", this.otpInputComponent);

  if (this.otpInputComponent) {
    this.otpCode = this.otpInputComponent.digits.join('');
  }

  console.log("Digits Array:", this.otpInputComponent.digits);
  console.log("Digits Length:", this.otpInputComponent.digits.length);
  console.log("Joined OTP:", this.otpInputComponent.digits.join(""));

  if (!this.otpCode || this.otpCode.length !== 6) {
    console.log("4. Validation failed");
    this.errorMessage = 'Please enter a valid 6-digit code';
    return;
  }

  console.log("5. Calling verifyEmail API");

  this.loading = true;

  this.authService.verifyEmail(this.otpCode).subscribe({
    next: (res) => {
      console.log("6. API Success", res);
      this.loading = false;
    },
    error: (err) => {
      console.log("7. API Error", err);
      this.loading = false;
    }
  });
}

  handleResendOtp(): void {
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.resendVerification(this.userEmail).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage = 'A new verification code has been sent to your email.';
        } else {
          this.errorMessage = res.message || 'Failed to resend code.';
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error resending verification code.';
      }
    });
  }
}

