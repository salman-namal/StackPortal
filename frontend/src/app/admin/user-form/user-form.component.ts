import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../core/services/users.service';
import { ToastService } from '../../core/services/toast.service';

@Component({ selector: 'app-user-form', templateUrl: './user-form.component.html', styleUrl: './user-form.component.scss' })
export class UserFormComponent implements OnInit {
  loading = false; error: string | null = null; isEdit = false; id: number | null = null;
  readonly roles = ['ADMIN', 'MANAGER', 'USER'];
  form = this.fb.group({ name: ['', [Validators.required, Validators.minLength(2)]], username: ['', [Validators.required, Validators.minLength(3)]], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.minLength(8)]], confirmPassword: [''], role: ['USER', Validators.required], active: [true] });
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private users: UsersService, private toast: ToastService) {}
  ngOnInit(): void { const id = Number(this.route.snapshot.paramMap.get('id')); if (id) { this.isEdit = true; this.id = id; this.loadUser(id); } }
  loadUser(id: number): void { this.loading = true; this.users.get(id).subscribe({ next: response => { const user = response.data; this.form.patchValue({ name: user.name, username: user.username, email: user.email, role: user.roles.find(role => this.roles.includes(role)) ?? 'USER', active: user.active }); this.loading = false; }, error: err => { this.error = err.error?.message || 'Unable to load user.'; this.loading = false; } }); }
  submit(): void { if (this.form.invalid || (!this.isEdit && this.form.value.password !== this.form.value.confirmPassword)) { this.error = !this.isEdit && this.form.value.password !== this.form.value.confirmPassword ? 'Passwords do not match.' : 'Please correct the highlighted fields.'; this.form.markAllAsTouched(); return; } const value = this.form.getRawValue(); this.loading = true; this.error = null; const request = this.isEdit && this.id ? this.users.update(this.id, { name: value.name!, username: value.username!, email: value.email!, roles: [value.role!], active: !!value.active }) : this.users.create({ name: value.name!, username: value.username!, email: value.email!, password: value.password || undefined, roles: [value.role!] }); request.subscribe({ next: response => { this.toast.success(response.message); this.router.navigate(['/dashboard/users']); }, error: err => { this.error = err.error?.message || 'Unable to save user.'; this.loading = false; } }); }
  cancel(): void { this.router.navigate(['/dashboard/users']); }
}
