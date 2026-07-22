import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent)
  },
  {
    path: 'otp',
    loadComponent: () => import('./pages/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent)
  },
  {
    path: 'password-reset-success',
    loadComponent: () => import('./pages/password-reset-success/password-reset-success.component').then((m) => m.PasswordResetSuccessComponent)
  },
  {
    path: 'email-verification-success',
    loadComponent: () => import('./pages/email-verification-success/email-verification-success.component').then((m) => m.EmailVerificationSuccessComponent)
  },
  {
    path: 'account-activated',
    loadComponent: () => import('./pages/account-activated/account-activated.component').then((m) => m.AccountActivatedComponent)
  },
  {
    path: 'resend-verification',
    loadComponent: () => import('./pages/resend-verification/resend-verification.component').then((m) => m.ResendVerificationComponent)
  },
  {
    path: 'invalid-token',
    loadComponent: () => import('./pages/invalid-token/invalid-token.component').then((m) => m.InvalidTokenComponent)
  },
  {
    path: 'session-expired',
    loadComponent: () => import('./pages/session-expired/session-expired.component').then((m) => m.SessionExpiredComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent)
  },
  {
    path: 'auth-error',
    loadComponent: () => import('./pages/auth-error/auth-error.component').then((m) => m.AuthErrorComponent)
  },
  {
    path: 'states',
    loadComponent: () => import('./pages/auth-states/auth-states.component').then((m) => m.AuthStatesComponent)
  }
];
