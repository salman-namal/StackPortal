import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AuthShellComponent } from '../shared/auth-shell.component';

@Component({
  selector: 'app-legacy-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthShellComponent],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  loading = false;
  message: string | null = null;
  error: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = null;
    this.message = null;

    const { email } = this.form.value;
    this.auth.forgotPassword(email!).subscribe({
      next: res => {
        this.loading = false;
        this.message = res.message || 'If the email exists, a reset link was sent.';
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Request failed';
      }
    });
  }
}

