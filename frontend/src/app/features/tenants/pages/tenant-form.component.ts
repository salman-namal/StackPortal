import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantsService } from '../services/tenants.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-tenant-form', standalone: true, imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tenant-form.component.html', styleUrls: ['./tenant-form.component.scss']
})
export class TenantFormComponent {
  form = this.fb.group({
    name: ['', [Validators.required]], code: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    adminName: ['', [Validators.required]], adminEmail: ['', [Validators.required, Validators.email]],
    email: ['', Validators.email], website: [''], phone: [''], city: [''], country: [''], logo: [''],
    status: ['ACTIVE' as 'ACTIVE' | 'INACTIVE']
  });
  loading = false; error: string | null = null; isEdit = false; id?: number;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router,
              private tenants: TenantsService, private toast: ToastService) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(id) && id > 0) { this.isEdit = true; this.id = id; this.loadTenant(id); }
  }

  loadTenant(id: number): void {
    this.loading = true;
    this.tenants.get(id).subscribe({ next: response => {
      const tenant = response.data;
      this.form.patchValue({ name: tenant.name, code: tenant.code, email: tenant.email, website: tenant.website,
        phone: tenant.phone, city: tenant.city, country: tenant.country, logo: tenant.logo,
        status: tenant.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' });
      this.form.controls.code.disable(); this.form.controls.adminName.disable(); this.form.controls.adminEmail.disable();
      this.loading = false;
    }, error: err => { this.error = err.error?.message || 'Unable to load tenant.'; this.loading = false; } });
  }

  submit(): void {
    if (this.form.invalid) { this.error = 'Please correct the highlighted fields.'; this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue(); this.loading = true; this.error = null;
    const request = this.isEdit && this.id
      ? this.tenants.update(this.id, { name: value.name!, code: value.code!, email: value.email || undefined, website: value.website || undefined, phone: value.phone || undefined, city: value.city || undefined, country: value.country || undefined, logo: value.logo || undefined, status: value.status! })
      : this.tenants.create({ name: value.name!, code: value.code!, adminName: value.adminName!, adminEmail: value.adminEmail!, email: value.email || undefined, website: value.website || undefined, phone: value.phone || undefined, city: value.city || undefined, country: value.country || undefined, logo: value.logo || undefined, status: value.status! });
    request.subscribe({ next: response => { this.toast.success(response.message); this.router.navigate(['/dashboard/tenants']); },
      error: err => { this.error = err.error?.message || 'Unable to save tenant.'; this.loading = false; } });
  }
  cancel(): void { this.router.navigate(['/dashboard/tenants']); }
}
