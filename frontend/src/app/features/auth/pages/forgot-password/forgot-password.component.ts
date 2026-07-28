import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { ApiResponse, AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AuthLayoutComponent],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  loading = false;
  redirecting = false;
  submitted = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.forgotForm.get(controlName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  onSubmit(): void {
    if (this.loading || this.redirecting) {
      return;
    }

    this.submitted = true;
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const email = this.forgotForm.getRawValue().email.trim();

    this.authService.forgotPassword(email)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Password reset link has been sent to your email.');
            this.redirecting = true;
            window.setTimeout(() => void this.router.navigate(['/auth/login']), 1500);
            return;
          }

          this.toastService.error(response.message || 'Unable to send a password reset link. Please try again.');
        },
        error: (error: HttpErrorResponse) => this.toastService.error(this.getBackendErrorMessage(error))
      });
  }

  private getBackendErrorMessage(error: HttpErrorResponse): string {
    const response = error.error as ApiResponse<Record<string, string>> | undefined;
    const validationErrors = response?.data;
    return validationErrors && typeof validationErrors === 'object'
      ? Object.values(validationErrors).join(' ') || response.message
      : response?.message || 'Unable to send a password reset link. Please try again.';
  }
}
