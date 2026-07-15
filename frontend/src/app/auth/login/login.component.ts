import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthShellComponent } from '../shared/auth-shell.component';

@Component({
  selector: 'app-legacy-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthShellComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loading = false;
  error: string | null = null;
  showPassword = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) { }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = null;

    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.loading = false;
        if (this.auth.hasRole('ADMIN') || this.auth.hasRole('SUPER_ADMIN')) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.auth.logout().subscribe();
          this.error = 'You do not have permission to access the admin portal.';
        }
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed';
      }
    });
  }
}

