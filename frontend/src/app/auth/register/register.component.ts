import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthShellComponent } from '../shared/auth-shell.component';

@Component({
  selector: 'app-legacy-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthShellComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  loading = false;
  message: string | null = null;
  error: string | null = null;
  showPassword = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = null;
    this.message = null;

    const { name, email, password } = this.form.value;
    this.auth.register(name!, email!, password!).subscribe({
      next: res => {
        this.loading = false;
        this.message = res.message || 'Registration successful. Please verify your email.';
        this.form.reset();
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }
}

