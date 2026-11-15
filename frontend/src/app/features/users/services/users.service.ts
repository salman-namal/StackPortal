import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../core/config/app-config';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.models';
import { UserDto, UserQuery } from '../models/user.models';

export type { UserDto, UserQuery } from '../models/user.models';
export type { ApiResponse, PageResponse } from '../../../core/models/api-response.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly usersUrl = `${appConfig.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  list(query: UserQuery): Observable<ApiResponse<PageResponse<UserDto>>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sortBy', query.sortBy)
      .set('sortDir', query.sortDir);
    if (query.search) params = params.set('search', query.search);
    if (query.active !== undefined) params = params.set('active', query.active);
    if (query.emailVerified !== undefined) params = params.set('emailVerified', query.emailVerified);
    return this.http.get<ApiResponse<PageResponse<UserDto>>>(this.usersUrl, { params });
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.usersUrl}/${id}`);
  }

  get(id: number): Observable<ApiResponse<UserDto>> { return this.http.get<ApiResponse<UserDto>>(`${this.usersUrl}/${id}`); }
  create(payload: { name: string; username: string; email: string; password?: string; roles: string[] }): Observable<ApiResponse<UserDto>> { return this.http.post<ApiResponse<UserDto>>(this.usersUrl, payload); }
  update(id: number, payload: { name: string; username: string; email: string; active: boolean; roles: string[] }): Observable<ApiResponse<UserDto>> { return this.http.put<ApiResponse<UserDto>>(`${this.usersUrl}/${id}`, payload); }
  setActive(id: number, active: boolean): Observable<ApiResponse<void>> { return this.http.patch<ApiResponse<void>>(`${this.usersUrl}/${id}/status`, {}, { params: new HttpParams().set('active', active) }); }
}
