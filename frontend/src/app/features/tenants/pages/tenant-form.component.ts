import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { TenantDto } from '../models/tenant.models';
import { TenantsService } from '../services/tenants.service';

const trimmedRequired = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length === 0 ? { required: true } : null;

@Component({
  selector: 'app-tenant-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tenant-form.component.html', styleUrls: ['./tenant-form.component.scss']
})
export class TenantFormComponent {
  @ViewChild('formTop') formTop?: ElementRef<HTMLElement>;
  readonly form = this.fb.nonNullable.group({
    name: ['', [trimmedRequired, Validators.minLength(3), Validators.maxLength(100)]],
    adminName: ['', [trimmedRequired, Validators.minLength(3), Validators.maxLength(100)]],
    adminEmail: ['', [trimmedRequired, Validators.email, Validators.maxLength(254)]],
    phone: ['', [trimmedRequired, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
    notes: ['', Validators.maxLength(1000)],
    logo: ['']
  });
  loading = false;
  saving = false;
  submitted = false;
  error: string | null = null;
  isEdit = false;
  isView = false;
  id?: number;
  logoPreview: string | null = null;
  logoError: string | null = null;
  private logoFile: File | null = null;
  existing?: TenantDto;

  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router,
              private readonly tenants: TenantsService, private readonly toast: ToastService) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(id) && id > 0) { this.isView = this.route.snapshot.data['readOnly'] === true; this.isEdit = !this.isView; this.id = id; this.loadTenant(id); }
  }

  get title(): string { return this.isView ? 'Tenant Details' : this.isEdit ? 'Edit Tenant' : 'Create Tenant'; }
  get submitLabel(): string { return this.isEdit ? 'Save Changes' : 'Create Tenant'; }
  control(name: keyof typeof this.form.controls) { return this.form.controls[name]; }
  invalid(name: keyof typeof this.form.controls): boolean { const c = this.control(name); return c.invalid && (c.touched || this.submitted); }

  loadTenant(id: number): void {
    this.loading = true;
    this.tenants.get(id).pipe(finalize(() => this.loading = false)).subscribe({
      next: ({ data }) => {
        this.existing = data;
        this.logoPreview = data.logo || null;
        this.form.patchValue({ name: data.name ?? '', phone: data.phone ?? '', logo: data.logo ?? '' });
        // The current response has no admin fields or notes. Do not invent values.
        this.form.controls.adminName.disable();
        this.form.controls.adminEmail.disable();
        if (this.isView) this.form.disable();
      },
      error: err => this.error = err.error?.message || 'Unable to load tenant details.'
    });
  }

  onFileSelected(event: Event): void { const input = event.target as HTMLInputElement; if (input.files?.[0]) this.readLogo(input.files[0]); }
  onDrop(event: DragEvent): void { event.preventDefault(); if (event.dataTransfer?.files[0]) this.readLogo(event.dataTransfer.files[0]); }
  onDragOver(event: DragEvent): void { event.preventDefault(); }
  removeLogo(): void { this.logoFile = null; this.logoPreview = null; this.logoError = null; this.form.controls.logo.setValue(''); this.form.controls.logo.markAsDirty(); }

  submit(): void {
    this.submitted = true; this.error = null;
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); this.focusFirstInvalid(); return; }
    const value = this.form.getRawValue();
    if (this.isView) return;
    this.saving = true;
    const request = this.isEdit
      ? this.tenants.update(this.id!, { name: value.name.trim(), phone: value.phone.trim(), logo: value.logo || undefined })
      : this.tenants.create({ name: value.name.trim(), adminName: value.adminName.trim(), adminEmail: value.adminEmail.trim(), email: value.adminEmail.trim(), phone: value.phone.trim(), logo: value.logo || undefined });
    (this.logoFile ? this.tenants.uploadLogo(this.logoFile).pipe(switchMap(({ data }) => this.isEdit
      ? this.tenants.update(this.id!, { name: value.name.trim(), phone: value.phone.trim(), logo: data })
      : this.tenants.create({ name: value.name.trim(), adminName: value.adminName.trim(), adminEmail: value.adminEmail.trim(), email: value.adminEmail.trim(), phone: value.phone.trim(), logo: data }))) : request)
      .pipe(finalize(() => this.saving = false)).subscribe({
        next: response => { this.toast.success(response.message || 'Tenant updated.'); this.router.navigate(['/dashboard/tenants']); },
        error: err => this.applyApiError(err)
      });
  }

  cancel(): void { this.router.navigate(['/dashboard/tenants']); }

  private readLogo(file: File): void {
    this.logoError = null;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { this.logoError = 'Use a JPG, PNG, or WebP image.'; return; }
    if (file.size > 2 * 1024 * 1024) { this.logoError = 'The logo must be 2 MB or smaller.'; return; }
    const reader = new FileReader();
    reader.onload = () => { this.logoFile = file; this.logoPreview = String(reader.result); this.form.controls.logo.setValue(''); this.form.controls.logo.markAsDirty(); };
    reader.readAsDataURL(file);
  }

  private focusFirstInvalid(): void { setTimeout(() => this.formTop?.nativeElement.querySelector<HTMLElement>('.is-invalid')?.focus()); }
  private applyApiError(err: any): void {
    const fields = err.error?.data;
    if (fields && typeof fields === 'object') Object.entries(fields).forEach(([name, message]) => {
      const control = this.form.get(name); if (control) control.setErrors({ server: String(message) });
    });
    this.error = err.error?.message || 'Unable to save tenant. Your changes are still in the form.';
  }
}
