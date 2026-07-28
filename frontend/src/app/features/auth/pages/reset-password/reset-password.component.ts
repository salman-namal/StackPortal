import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { ApiResponse, AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AuthLayoutComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  submitted = false;
  errorMessage: string | null = null;
  token: string | null = null;

  strengthScore = 0;
  strengthLabel = 'Weak';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );

    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.errorMessage = 'This password reset link is invalid.';
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.resetForm.get(controlName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  onPasswordInput(): void {
    const pwd = this.resetForm.get('password')?.value || '';
    let score = 0;

    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    this.strengthScore = score;
    if (score <= 1) this.strengthLabel = 'Weak';
    else if (score === 2 || score === 3) this.strengthLabel = 'Good';
    else this.strengthLabel = 'Strong';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.errorMessage = 'This password reset link is invalid.';
      return;
    }

    this.loading = true;
    const { password, confirmPassword } = this.resetForm.getRawValue();

    this.authService.resetPassword(this.token, password, confirmPassword)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => void this.router.navigate(['/auth/login']),
        error: (error: HttpErrorResponse) => this.errorMessage = this.getBackendErrorMessage(error)
      });
  }

  private getBackendErrorMessage(error: HttpErrorResponse): string {
    const response = error.error as ApiResponse<Record<string, string>> | undefined;
    const validationErrors = response?.data;
    return validationErrors && typeof validationErrors === 'object'
      ? Object.values(validationErrors).join(' ') || response.message
      : response?.message || 'Unable to reset your password. Please try again.';
  }
}
