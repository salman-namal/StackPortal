import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantsService } from '../core/services/tenants.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tenant-form.component.html',
  styleUrls: ['./tenant-form.component.scss']
})
export class TenantFormComponent {
  form = this.fb.group({
    name: [''],
    code: [''],
    email: [''],
    website: [''],
    phone: [''],
    city: [''],
    country: [''],
    active: [true],
    logoUrl: ['']
  });

  loading = false;
  error: string | null = null;
  isEdit = false;
  id?: number;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private tenants: TenantsService, private toast: ToastService) {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = Number(idParam);
      if (Number.isFinite(this.id)) this.loadTenant(this.id);
    }
  }

  loadTenant(id: number): void {
    this.loading = true;
    this.tenants.get(id).subscribe({
      next: response => {
        const tenant = response.data;
        this.form.patchValue({ name: tenant.name, code: tenant.code, email: tenant.email, website: tenant.website, phone: tenant.phone, city: tenant.city, country: tenant.country, active: tenant.active, logoUrl: tenant.logoUrl });
        this.loading = false;
      },
      error: err => { this.error = err.error?.message || 'Unable to load tenant.'; this.loading = false; }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.error = 'Please correct the highlighted fields.';
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.loading = true;
    this.error = null;
    const request = this.isEdit && this.id ? this.tenants.update(this.id, { name: value.name!, code: value.code!, email: value.email!, website: value.website, phone: value.phone, city: value.city, country: value.country, active: !!value.active, logoUrl: value.logoUrl }) : this.tenants.create({ name: value.name!, code: value.code!, email: value.email!, website: value.website, phone: value.phone, city: value.city, country: value.country, active: !!value.active, logoUrl: value.logoUrl });
    request.subscribe({
      next: response => { this.toast.success(response.message); this.router.navigate(['/dashboard/tenants']); },
      error: err => { this.error = err.error?.message || 'Unable to save tenant.'; this.loading = false; }
    });
  }

  cancel(): void { this.router.navigate(['/dashboard/tenants']); }
}
