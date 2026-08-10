import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../config/app-config';

export interface TenantDto {
  id: number;
  name: string;
  code: string;
  email?: string;
  website?: string;
  phone?: string;
  city?: string;
  country?: string;
  active: boolean;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  number?: number;
  page?: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TenantQuery {
  page: number;
  size: number;
  search?: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  active?: boolean;
}

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
    if (query.active !== undefined) params = params.set('active', String(query.active));
    return this.http.get<ApiResponse<PageResponse<TenantDto>>>(this.tenantsUrl, { params });
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<void>>(`${this.tenantsUrl}/${id}`);
  }

  get(id: number) {
    return this.http.get<ApiResponse<TenantDto>>(`${this.tenantsUrl}/${id}`);
  }

  create(payload: { name: string; code: string; email?: string; website?: string; phone?: string; city?: string; country?: string; active?: boolean; logoUrl?: string }) {
    return this.http.post<ApiResponse<TenantDto>>(this.tenantsUrl, payload);
  }

  update(id: number, payload: { name: string; code: string; email?: string; website?: string; phone?: string; city?: string; country?: string; active?: boolean; logoUrl?: string }) {
    return this.http.put<ApiResponse<TenantDto>>(`${this.tenantsUrl}/${id}`, payload);
  }

  setActive(id: number, active: boolean) {
    return this.http.patch<ApiResponse<void>>(`${this.tenantsUrl}/${id}/status`, {}, { params: new HttpParams().set('active', String(active)) });
  }
}
