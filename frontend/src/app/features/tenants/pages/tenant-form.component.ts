import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { TenantDto } from '../models/tenant.models';
import { AdminPasswordReset, TenantAdministratorAccess, TenantPayload, TenantsService } from '../services/tenants.service';
import { ImageUploadComponent, MediaMetadata } from '../../../shared/components/image-upload/image-upload.component';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog/confirmation-dialog.service';

const trimmedRequired = (c: AbstractControl): ValidationErrors | null => typeof c.value === 'string' && !c.value.trim() ? { required: true } : null;
const optionalUrl = (c: AbstractControl): ValidationErrors | null => !c.value || /^https?:\/\/[^\s]+$/i.test(c.value.trim()) ? null : { url: true };

@Component({ selector: 'app-tenant-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule, ImageUploadComponent], templateUrl: './tenant-form.component.html', styleUrls: ['./tenant-form.component.scss'] })
export class TenantFormComponent {
  @ViewChild('formTop') formTop?: ElementRef<HTMLElement>;
  @ViewChild(ImageUploadComponent) logoUploader?: ImageUploadComponent;
  readonly countries = ['Pakistan', 'United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'United States', 'Canada', 'Australia', 'India'];
  readonly form = this.fb.nonNullable.group({
    name: ['', [trimmedRequired, Validators.minLength(3), Validators.maxLength(100)]],
    adminName: ['', [trimmedRequired, Validators.minLength(3), Validators.maxLength(100)]],
    adminEmail: ['', [trimmedRequired, Validators.email, Validators.maxLength(254)]],
    phone: ['', [trimmedRequired, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
    country: ['', Validators.maxLength(100)], city: ['', Validators.maxLength(100)],
    address: ['', Validators.maxLength(500)], website: ['', [Validators.maxLength(255), optionalUrl]],
    notes: ['', Validators.maxLength(1000)], logoId: ['']
  });
  loading = false; saving = false; submitted = false; error: string | null = null;
  isEdit = false; isView = false; id?: number; logoPreview: string | null = null; logoError: string | null = null; existing?: TenantDto;
  administratorAccess?: TenantAdministratorAccess; resetPassword?: AdminPasswordReset; resettingPassword = false;
  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly tenants: TenantsService, private readonly toast: ToastService, private readonly confirmation: ConfirmationDialogService) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(id) && id > 0) { this.isView = this.route.snapshot.data['readOnly'] === true; this.isEdit = !this.isView; this.id = id; this.loadTenant(id); }
  }
  get title() { return this.isView ? 'Tenant Details' : this.isEdit ? 'Edit Tenant' : 'Create Tenant'; }
  get submitLabel() { return this.isEdit ? 'Save Changes' : 'Create Tenant'; }
  control(name: keyof typeof this.form.controls) { return this.form.controls[name]; }
  invalid(name: keyof typeof this.form.controls) { const c = this.control(name); return c.invalid && (c.touched || this.submitted); }
  loadTenant(id: number) { this.loading = true; this.tenants.get(id).pipe(finalize(() => this.loading = false)).subscribe({ next: ({ data }) => { this.existing = data; this.form.patchValue({ name: data.name || '', adminName: data.adminName || '', adminEmail: data.adminEmail || data.email || '', phone: data.phone || '', country: data.country || '', city: data.city || '', address: data.address || '', website: data.website || '', notes: data.notes || '', logoId: data.logoId || '' }); setTimeout(() => this.logoUploader?.loadExisting(data.logoId)); if (this.isView) { this.form.disable(); this.loadAdministratorAccess(id); } }, error: e => this.error = e.error?.message || 'Unable to load tenant details.' }); }
  onLogoUploaded(media: MediaMetadata) { this.form.controls.logoId.setValue(media.id); this.form.controls.logoId.markAsDirty(); }
  removeLogo() { this.form.controls.logoId.setValue(''); this.form.controls.logoId.markAsDirty(); }
  submit() { this.submitted = true; this.error = null; if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); this.focusFirstInvalid(); return; } if (this.isView) return; const v = this.form.getRawValue(); const payload: TenantPayload = { name: v.name.trim(), adminName: v.adminName.trim(), adminEmail: v.adminEmail.trim(), phone: v.phone.trim(), country: v.country.trim() || undefined, city: v.city.trim() || undefined, address: v.address.trim() || undefined, website: v.website.trim() || undefined, notes: v.notes.trim() || undefined, logoId: v.logoId || undefined }; this.saving = true; (this.isEdit ? this.tenants.update(this.id!, payload) : this.tenants.create(payload)).pipe(finalize(() => this.saving = false)).subscribe({ next: r => { this.toast.success(r.message || 'Tenant saved successfully.'); this.router.navigate(['/dashboard/tenants']); }, error: e => this.applyApiError(e) }); }
  cancel() { this.router.navigate(['/dashboard/tenants']); }
  async copyLoginUrl() {
    const loginUrl = this.existing?.loginUrl;
    if (!loginUrl) return;
    try {
      await navigator.clipboard.writeText(loginUrl);
      this.toast.success('Tenant login URL copied.');
    } catch {
      this.error = 'Unable to copy the tenant login URL. Please copy it manually.';
    }
  }
  openLoginUrl() {
    const loginUrl = this.existing?.loginUrl;
    if (loginUrl) window.open(loginUrl, '_blank', 'noopener');
  }
  async resetAdminPassword() {
    if (!this.id || this.resettingPassword || !await this.confirmation.confirm({ type: 'warning', title: 'Reset administrator password?', message: 'The existing administrator password will stop working immediately.', confirmText: 'Reset Password' })) return;
    this.resettingPassword = true;
    this.tenants.resetAdministratorPassword(this.id).pipe(finalize(() => this.resettingPassword = false)).subscribe({ next: ({ data, message }) => { this.resetPassword = data; this.administratorAccess = { administratorName: data.administratorName, administratorEmail: data.administratorEmail, administratorUsername: data.administratorUsername }; this.toast.success(message || 'Administrator password reset. Copy the new password now.'); }, error: e => this.error = e.error?.message || 'Unable to reset the administrator password.' });
  }
  async copyText(value?: string, label = 'Value') {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); this.toast.success(`${label} copied.`); }
    catch { this.error = `Unable to copy ${label.toLowerCase()}. Please copy it manually.`; }
  }
  private loadAdministratorAccess(id: number) {
    this.tenants.administratorAccess(id).subscribe({ next: ({ data }) => this.administratorAccess = data, error: e => this.error = e.error?.message || 'Unable to load administrator access details.' });
  }
  private focusFirstInvalid() { setTimeout(() => this.formTop?.nativeElement.querySelector<HTMLElement>('.is-invalid')?.focus()); }
  private applyApiError(e: any) { const fields = e.error?.data; if (fields && typeof fields === 'object') Object.entries(fields).forEach(([name, message]) => this.form.get(name)?.setErrors({ server: String(message) })); this.error = e.error?.message || 'Unable to save tenant. Your entered values are still available.'; }
}
