import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { finalize } from 'rxjs';
import { ApiResponse, AuthService, LoginResponse } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AuthLayoutComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  loading = false;
  submitted = false;
  errorMessage: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', [Validators.required]],
      rememberMe: [true]
    });
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email.trim(), password)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => this.handleLoginResponse(response),
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.getBackendErrorMessage(error);
        }
      });
  }

  private handleLoginResponse(response: LoginResponse): void {
    if (!response.success || !response.data?.accessToken || !response.data?.refreshToken || !response.data.user) {
      this.errorMessage = response.message || 'Login failed. Please try again.';
      return;
    }

    void this.router.navigate(['/dashboard']);
  }

  private getBackendErrorMessage(error: HttpErrorResponse): string {
    const response = error.error as ApiResponse<Record<string, string>> | undefined;
    const validationErrors = response?.data;

    if (validationErrors && typeof validationErrors === 'object') {
      return Object.values(validationErrors).join(' ') || response.message;
    }

    return response?.message || 'Unable to sign in. Please try again.';
  }
}
