import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;

  readonly socialProviders = [
    { name: 'Google', icon: 'G' },
    { name: 'GitHub', icon: '▶' },
    { name: 'Microsoft', icon: '◻' }
  ];

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [true]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    window.setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
