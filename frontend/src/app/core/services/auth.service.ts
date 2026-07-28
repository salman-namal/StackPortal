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

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  emailVerified: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: AuthenticatedUser;
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
  private readonly userKey = 'authenticated_user';

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasValidToken());
  private roles$ = new BehaviorSubject<string[]>(this.getStoredRoles());

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.handleLoginSuccess(res)));
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

  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
      confirmPassword
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

  getCurrentUser(): AuthenticatedUser | null {
    const rawUser = localStorage.getItem(this.userKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthenticatedUser;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
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

  private handleLoginSuccess(res: LoginResponse): void {
    if (!res.success || !res.data?.accessToken || !res.data?.refreshToken || !res.data.user) {
      return;
    }

    localStorage.setItem(this.accessTokenKey, res.data.accessToken);
    localStorage.setItem(this.refreshTokenKey, res.data.refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(res.data.user));
    localStorage.setItem(this.rolesKey, JSON.stringify(res.data.user.roles || []));
    this.loggedIn$.next(true);
    this.roles$.next(res.data.user.roles || []);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.rolesKey);
    localStorage.removeItem(this.userKey);
    this.loggedIn$.next(false);
    this.roles$.next([]);
  }
}

