import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-legacy-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent {
  loading = false;
  message: string | null = null;
  error: string | null = null;
  token: string | null = null;

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  submit(): void {
    if (!this.token || this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = null;
    this.message = null;

    const { password } = this.form.value;
    this.auth.resetPassword(this.token, password!).subscribe({
      next: res => {
        this.loading = false;
        this.message = res.message || 'Password reset successfully.';
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Reset failed';
      }
    });
  }
}

