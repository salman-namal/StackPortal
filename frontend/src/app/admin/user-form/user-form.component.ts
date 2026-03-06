import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html'
})
export class UserFormComponent {
  loading = false;
  error: string | null = null;
  isEdit = false;
  id: number | null = null;

  roles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    active: [true],
    roles: [[] as string[]]
  });

  private readonly apiUrl = 'http://localhost:8080/api/admin/users';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = +idParam;
      this.loadUser(this.id);
    }
  }

  loadUser(id: number): void {
    this.loading = true;
    this.http
      .get<ApiResponse<any>>(`${this.apiUrl}?page=0&size=1&search=`)
      .subscribe({
        next: () => {
          this.loading = false;
          // For brevity, not loading single user; normally add dedicated GET /{id}
        },
        error: err => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load user';
        }
      });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.error = null;

    const value = this.form.value;
    const payload: any = {
      name: value.name,
      email: value.email,
      roles: value.roles
    };

    let request$;
    if (this.isEdit && this.id != null) {
      payload.active = value.active;
      request$ = this.http.put<ApiResponse<any>>(
        `${this.apiUrl}/${this.id}`,
        payload
      );
    } else {
      payload.password = value.password;
      request$ = this.http.post<ApiResponse<any>>(this.apiUrl, payload);
    }

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin']);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Save failed';
      }
    });
  }

  onRoleToggle(role: string, checked: boolean): void {
    const control = this.form.controls.roles;
    const current = (control.value as string[] | null) || [];

    if (checked) {
      if (!current.includes(role)) {
        control.setValue([...current, role]);
      }
    } else {
      control.setValue(current.filter(r => r !== role));
    }
  }
}

