import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({ selector: 'app-global-loading', standalone: true, imports: [CommonModule], template: '<div *ngIf="loading.loading$ | async" class="loading-overlay" role="status" aria-live="polite" aria-label="Loading"><span class="spinner"></span><span>Loadingâ€¦</span></div>', styles: ['.loading-overlay{position:fixed;inset:0;z-index:3000;display:grid;place-content:center;gap:12px;justify-items:center;background:rgba(15,23,42,.28);backdrop-filter:blur(2px);color:var(--auth-heading,#0f172a);font-weight:700}.spinner{width:42px;height:42px;border:4px solid rgba(59,130,246,.22);border-top-color:#2563eb;border-radius:50%;animation:spin .75s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}'] })
export class GlobalLoadingComponent { constructor(readonly loading: LoadingService) {} }

