import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { appConfig } from '../../../core/config/app-config';
import { ApiResponse } from '../../../core/models/api-response.models';

export interface MediaMetadata { id: string; fileName: string; contentType: string; fileSize: number; }

@Component({
  selector: 'app-image-upload', standalone: true, imports: [CommonModule],
  template: `<section class="logo-upload" [class.readonly]="readonly">
    <ng-container *ngIf="preview; else uploadArea">
      <div class="preview-wrap"><img [src]="preview" alt="Tenant logo preview"><button *ngIf="!readonly" type="button" class="remove-logo" (click)="remove()" aria-label="Remove tenant logo" title="Remove logo"><span class="material-symbols-outlined">delete</span></button></div>
      <p class="preview-hint" *ngIf="!readonly">Select a different image to replace this logo.</p>
      <label *ngIf="!readonly" class="replace-link"><input type="file" accept="image/jpeg,image/png,image/webp" (change)="select($event)">Replace logo</label>
    </ng-container>
    <ng-template #uploadArea><label *ngIf="!readonly" class="drop-zone" [class.dragging]="dragging" (dragover)="dragOver($event)" (dragleave)="dragging=false" (drop)="drop($event)"><input type="file" accept="image/jpeg,image/png,image/webp" (change)="select($event)"><span class="material-symbols-outlined">cloud_upload</span><strong>{{ uploading ? 'Uploading logo…' : 'Drop your logo here or browse' }}</strong><small>PNG, JPG or WebP · maximum 2 MB</small></label><div *ngIf="readonly" class="empty-logo"><span class="material-symbols-outlined">image</span><span>No logo uploaded</span></div></ng-template>
    <p class="upload-error" *ngIf="error">{{ error }}</p>
  </section>`,
  styles: [`.logo-upload{display:grid;justify-items:start;gap:10px}.preview-wrap{position:relative;width:132px;height:132px;border:1px solid var(--auth-border);border-radius:14px;background:var(--auth-input-bg);display:grid;place-items:center;overflow:hidden}.preview-wrap img{width:100%;height:100%;object-fit:contain}.remove-logo{position:absolute;right:8px;top:8px;width:32px;height:32px;border:0;border-radius:50%;display:grid;place-items:center;background:#dc2626;color:#fff;box-shadow:0 3px 9px rgba(127,29,29,.35);cursor:pointer}.remove-logo:hover{background:#b91c1c}.remove-logo .material-symbols-outlined{font-size:18px}.drop-zone{box-sizing:border-box;width:min(100%,520px);min-height:132px;padding:20px;border:1px dashed color-mix(in srgb,var(--auth-primary) 65%,var(--auth-border));border-radius:12px;background:color-mix(in srgb,var(--auth-primary) 4%,var(--auth-input-bg));display:grid;place-items:center;align-content:center;gap:7px;color:var(--auth-muted);cursor:pointer;text-align:center}.drop-zone.dragging{border-style:solid;background:color-mix(in srgb,var(--auth-primary) 12%,var(--auth-input-bg))}.drop-zone input,.replace-link input{position:absolute;width:1px;height:1px;opacity:0}.drop-zone .material-symbols-outlined{font-size:29px;color:var(--auth-primary)}.drop-zone strong{color:var(--auth-heading);font-size:14px}.drop-zone small,.preview-hint{margin:0;color:var(--auth-muted);font-size:12px}.replace-link{color:var(--auth-primary);font-size:13px;font-weight:700;cursor:pointer}.upload-error{margin:0;color:#dc2626;font-size:13px}.empty-logo{width:132px;height:132px;border:1px dashed var(--auth-border);border-radius:14px;display:grid;place-items:center;align-content:center;gap:8px;color:var(--auth-muted);font-size:12px}.empty-logo .material-symbols-outlined{font-size:28px}`]
})
export class ImageUploadComponent implements OnChanges, OnDestroy {
  @Input() readonly = false; @Input() existingMediaId: string | null = null;
  @Output() uploaded = new EventEmitter<MediaMetadata>(); @Output() removed = new EventEmitter<void>();
  preview: string | null = null; error: string | null = null; uploading = false; dragging = false;
  constructor(private readonly http: HttpClient) { }
  ngOnChanges(): void { this.loadExisting(this.existingMediaId); }
  dragOver(event: DragEvent): void { event.preventDefault(); this.dragging = true; }
  drop(event: DragEvent): void { event.preventDefault(); this.dragging = false; const file = event.dataTransfer?.files.item(0); if (file) this.upload(file); }
  select(event: Event): void { const file = (event.target as HTMLInputElement).files?.item(0); if (file) this.upload(file); }
  loadExisting(mediaId: string | null | undefined): void { if (!mediaId || this.preview) return; this.http.get(`${appConfig.apiBaseUrl}/platform/media/${mediaId}/thumbnail`, { responseType: 'blob' }).subscribe({ next: blob => this.setPreview(blob), error: () => this.error = 'Saved logo could not be loaded.' }); }
  remove(): void { this.releasePreview(); this.error = null; this.removed.emit(); }
  ngOnDestroy(): void { this.releasePreview(); }
  private upload(file: File): void { if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { this.error = 'Use a PNG, JPG, or WebP image no larger than 2 MB.'; return; } this.error = null; this.setPreview(file); const form = new FormData(); form.append('file', file); this.uploading = true; this.http.post<ApiResponse<MediaMetadata>>(`${appConfig.apiBaseUrl}/platform/media`, form).subscribe({ next: response => { this.uploading = false; this.uploaded.emit(response.data); }, error: response => { this.uploading = false; this.error = response.error?.message || 'Logo upload failed.'; this.releasePreview(); } }); }
  private setPreview(blob: Blob): void { this.releasePreview(); this.preview = URL.createObjectURL(blob); }
  private releasePreview(): void { if (this.preview?.startsWith('blob:')) URL.revokeObjectURL(this.preview); this.preview = null; }
}
