import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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

