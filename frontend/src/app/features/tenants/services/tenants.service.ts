import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../core/config/app-config';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.models';
import { TenantDto, TenantQuery } from '../models/tenant.models';
export interface TenantDashboard { totalTenants: number; activeTenants: number; inactiveTenants: number; recentTenants: TenantDto[]; }

export type { TenantDto, TenantQuery } from '../models/tenant.models';
export type { ApiResponse, PageResponse } from '../../../core/models/api-response.models';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private readonly tenantsUrl = `${appConfig.apiBaseUrl}/tenants`;

  constructor(private http: HttpClient) {}

  list(query: TenantQuery): Observable<ApiResponse<PageResponse<TenantDto>>> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('size', String(query.size))
      .set('sortBy', query.sortBy)
      .set('sortDir', query.sortDir);
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<ApiResponse<PageResponse<TenantDto>>>(this.tenantsUrl, { params });
  }

  delete(id: number, tenantName: string) {
    return this.http.delete<ApiResponse<void>>(`${this.tenantsUrl}/${id}`, { body: { tenantName } });
  }

  get(id: number) {
    return this.http.get<ApiResponse<TenantDto>>(`${this.tenantsUrl}/${id}`);
  }

  dashboard() { return this.http.get<ApiResponse<TenantDashboard>>(`${this.tenantsUrl}/dashboard`); }

  create(payload: { name: string; code: string; adminName: string; adminEmail: string; email?: string; website?: string; phone?: string; city?: string; country?: string; status?: 'ACTIVE' | 'INACTIVE'; logo?: string }) {
    return this.http.post<ApiResponse<TenantDto>>(this.tenantsUrl, payload);
  }

  update(id: number, payload: { name: string; code: string; email?: string; website?: string; phone?: string; city?: string; country?: string; status?: 'ACTIVE' | 'INACTIVE'; logo?: string }) {
    return this.http.put<ApiResponse<TenantDto>>(`${this.tenantsUrl}/${id}`, payload);
  }

  setStatus(id: number, status: 'ACTIVE' | 'INACTIVE') {
    return this.http.patch<ApiResponse<TenantDto>>(`${this.tenantsUrl}/${id}/status`, {}, { params: new HttpParams().set('status', status) });
  }
}
