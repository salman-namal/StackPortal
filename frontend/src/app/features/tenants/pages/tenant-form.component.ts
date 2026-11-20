import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { TenantDto } from '../models/tenant.models';
import { TenantPayload, TenantsService } from '../services/tenants.service';

const trimmedRequired = (c: AbstractControl): ValidationErrors | null => typeof c.value === 'string' && !c.value.trim() ? { required: true } : null;
const optionalUrl = (c: AbstractControl): ValidationErrors | null => !c.value || /^https?:\/\/[^\s]+$/i.test(c.value.trim()) ? null : { url: true };

@Component({ selector: 'app-tenant-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule], templateUrl: './tenant-form.component.html', styleUrls: ['./tenant-form.component.scss'] })
export class TenantFormComponent {
  @ViewChild('formTop') formTop?: ElementRef<HTMLElement>;
  readonly countries = ['Pakistan', 'United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'United States', 'Canada', 'Australia', 'India'];
  readonly form = this.fb.nonNullable.group({
    name: ['', [trimmedRequired, Validators.minLength(3), Validators.maxLength(100)]],
    adminName: ['', [trimmedRequired, Validators.minLength(3), Validators.maxLength(100)]],
    adminEmail: ['', [trimmedRequired, Validators.email, Validators.maxLength(254)]],
    phone: ['', [trimmedRequired, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
    country: ['', Validators.maxLength(100)], city: ['', Validators.maxLength(100)],
    address: ['', Validators.maxLength(500)], website: ['', [Validators.maxLength(255), optionalUrl]],
    notes: ['', Validators.maxLength(1000)], logo: ['']
  });
  loading = false; saving = false; submitted = false; error: string | null = null;
  isEdit = false; isView = false; id?: number; logoPreview: string | null = null; logoError: string | null = null; existing?: TenantDto;
  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly tenants: TenantsService, private readonly toast: ToastService) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(id) && id > 0) { this.isView = this.route.snapshot.data['readOnly'] === true; this.isEdit = !this.isView; this.id = id; this.loadTenant(id); }
  }
  get title() { return this.isView ? 'Tenant Details' : this.isEdit ? 'Edit Tenant' : 'Create Tenant'; }
  get submitLabel() { return this.isEdit ? 'Save Changes' : 'Create Tenant'; }
  control(name: keyof typeof this.form.controls) { return this.form.controls[name]; }
  invalid(name: keyof typeof this.form.controls) { const c = this.control(name); return c.invalid && (c.touched || this.submitted); }
  loadTenant(id: number) { this.loading = true; this.tenants.get(id).pipe(finalize(() => this.loading = false)).subscribe({ next: ({ data }) => { this.existing = data; this.logoPreview = data.logo || null; this.form.patchValue({ name: data.name || '', adminName: data.adminName || '', adminEmail: data.adminEmail || data.email || '', phone: data.phone || '', country: data.country || '', city: data.city || '', address: data.address || '', website: data.website || '', notes: data.notes || '', logo: data.logo || '' }); if (this.isView) this.form.disable(); }, error: e => this.error = e.error?.message || 'Unable to load tenant details.' }); }
  onFileSelected(e: Event) { const file = (e.target as HTMLInputElement).files?.[0]; if (file) this.readLogo(file); }
  onDrop(e: DragEvent) { e.preventDefault(); const file = e.dataTransfer?.files[0]; if (file) this.readLogo(file); }
  onDragOver(e: DragEvent) { e.preventDefault(); }
  removeLogo() { this.logoPreview = null; this.logoError = null; this.form.controls.logo.setValue(''); this.form.controls.logo.markAsDirty(); }
  submit() { this.submitted = true; this.error = null; if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); this.focusFirstInvalid(); return; } if (this.isView) return; const v = this.form.getRawValue(); const payload: TenantPayload = { name: v.name.trim(), adminName: v.adminName.trim(), adminEmail: v.adminEmail.trim(), phone: v.phone.trim(), country: v.country.trim() || undefined, city: v.city.trim() || undefined, address: v.address.trim() || undefined, website: v.website.trim() || undefined, notes: v.notes.trim() || undefined, logo: v.logo || undefined }; this.saving = true; (this.isEdit ? this.tenants.update(this.id!, payload) : this.tenants.create(payload)).pipe(finalize(() => this.saving = false)).subscribe({ next: r => { this.toast.success(r.message || 'Tenant saved successfully.'); this.router.navigate(['/dashboard/tenants']); }, error: e => this.applyApiError(e) }); }
  cancel() { this.router.navigate(['/dashboard/tenants']); }
  private readLogo(file: File) { this.logoError = null; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { this.logoError = 'Use a JPG, PNG, or WebP image.'; return; } if (file.size > 2 * 1024 * 1024) { this.logoError = 'The logo must be 2 MB or smaller.'; return; } const reader = new FileReader(); reader.onload = () => { const base64 = String(reader.result); this.logoPreview = base64; this.form.controls.logo.setValue(base64); this.form.controls.logo.markAsDirty(); }; reader.readAsDataURL(file); }
  private focusFirstInvalid() { setTimeout(() => this.formTop?.nativeElement.querySelector<HTMLElement>('.is-invalid')?.focus()); }
  private applyApiError(e: any) { const fields = e.error?.data; if (fields && typeof fields === 'object') Object.entries(fields).forEach(([name, message]) => this.form.get(name)?.setErrors({ server: String(message) })); this.error = e.error?.message || 'Unable to save tenant. Your entered values are still available.'; }
}
