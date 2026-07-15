import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent as LegacyLoginComponent } from './login/login.component';
import { RegisterComponent as LegacyRegisterComponent } from './register/register.component';
import { ForgotPasswordComponent as LegacyForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent as LegacyResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Routes = [
  { path: 'login', component: LegacyLoginComponent },
  { path: 'register', component: LegacyRegisterComponent },
  { path: 'forgot-password', component: LegacyForgotPasswordComponent },
  { path: 'reset-password', component: LegacyResetPasswordComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}

