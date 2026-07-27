import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    roles: string[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api';
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly rolesKey = 'roles';

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasValidToken());
  private roles$ = new BehaviorSubject<string[]>(this.getStoredRoles());

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.handleAuthSuccess(res)));
  }

  register(name: string, email: string, password: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/register`, {
      name,
      email,
      password
    });
  }

  verifyEmail(token: string): Observable<ApiResponse<void>> {
    console.log("3. Calling verifyEmail API with token:", token);
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/verify-email`, { token });
  }

  resendVerification(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/resend-verification`, { email });
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/google-login`, { idToken })
      .pipe(tap(res => this.handleAuthSuccess(res)));
  }

  logout(): Observable<ApiResponse<void>> {
    const refreshToken = this.getRefreshToken();
    this.clearAuth();
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/auth/logout?refreshToken=${encodeURIComponent(refreshToken ?? '')}`,
      {}
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  rolesStream$(): Observable<string[]> {
    return this.roles$.asObservable();
  }

  hasRole(role: string): boolean {
    return this.roles$.value.includes(role);
  }

  private hasValidToken(): boolean {
    return !!this.getAccessToken();
  }

  private getStoredRoles(): string[] {
    const raw = localStorage.getItem(this.rolesKey);
    return raw ? JSON.parse(raw) : [];
  }

  private handleAuthSuccess(res: AuthResponse): void {
    if (!res.success || !res.data) {
      return;
    }
    localStorage.setItem(this.accessTokenKey, res.data.accessToken);
    localStorage.setItem(this.refreshTokenKey, res.data.refreshToken);
    localStorage.setItem(this.rolesKey, JSON.stringify(res.data.roles || []));
    this.loggedIn$.next(true);
    this.roles$.next(res.data.roles || []);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.rolesKey);
    this.loggedIn$.next(false);
    this.roles$.next([]);
  }
}

