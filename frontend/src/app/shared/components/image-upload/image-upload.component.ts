import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '../../../core/config/app-config';
import { ApiResponse } from '../../../core/models/api-response.models';

export interface MediaMetadata { id: string; fileName: string; contentType: string; fileSize: number; }
@Component({ selector: 'app-image-upload', standalone: true, imports: [CommonModule], template: `<div class="upload"><img *ngIf="preview" [src]="preview" alt="Logo preview"><label *ngIf="!readonly"><input type="file" accept="image/jpeg,image/png,image/webp" (change)="select($event)"><span>{{ uploading ? 'Uploading…' : 'Drop image here or browse' }}</span><small>JPG, PNG or WebP · maximum 2 MB</small></label><button *ngIf="preview && !readonly" type="button" (click)="remove()">Remove</button><p *ngIf="error">{{error}}</p></div>`, styles:[`.upload{display:grid;gap:10px}.upload img{width:110px;height:110px;object-fit:contain;border:1px solid var(--auth-border);border-radius:10px}.upload label{min-height:100px;border:1px dashed var(--auth-primary);border-radius:10px;display:grid;place-items:center;cursor:pointer}.upload input{position:absolute;opacity:0}.upload p{color:#e74c3c;margin:0}`] })
export class ImageUploadComponent implements OnChanges, OnDestroy {
 @Input() readonly = false; @Input() existingMediaId: string | null = null; @Output() uploaded = new EventEmitter<MediaMetadata>(); @Output() removed = new EventEmitter<void>(); preview: string | null = null; error: string | null = null; uploading = false;
 constructor(private http: HttpClient) {}
 select(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2*1024*1024) { this.error='Use a JPG, PNG, or WebP image no larger than 2 MB.'; return; } this.error=null; this.releasePreview(); this.preview=URL.createObjectURL(file); const form=new FormData();form.append('file',file);this.uploading=true;this.http.post<ApiResponse<MediaMetadata>>(`${appConfig.apiBaseUrl}/platform/media`,form).subscribe({next:r=>{this.uploading=false;this.uploaded.emit(r.data);},error:e=>{this.uploading=false;this.error=e.error?.message||'Logo upload failed.';this.releasePreview();}}); }
 ngOnChanges(){ this.loadExisting(this.existingMediaId); }
 loadExisting(mediaId: string | null | undefined){ if(mediaId&&!this.preview)this.http.get(`${appConfig.apiBaseUrl}/platform/media/${mediaId}/thumbnail`,{responseType:'blob'}).subscribe({next:b=>this.preview=URL.createObjectURL(b),error:()=>this.error='Saved logo could not be loaded.'}); }
 remove(){this.releasePreview();this.removed.emit();} ngOnDestroy(){this.releasePreview();} private releasePreview(){if(this.preview?.startsWith('blob:'))URL.revokeObjectURL(this.preview);this.preview=null;}
}
