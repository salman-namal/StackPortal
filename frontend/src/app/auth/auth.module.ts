import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent as LegacyLoginComponent } from './login/login.component';
import { RegisterComponent as LegacyRegisterComponent } from './register/register.component';
import { ForgotPasswordComponent as LegacyForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent as LegacyResetPasswordComponent } from './reset-password/reset-password.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    LegacyLoginComponent,
    LegacyRegisterComponent,
    LegacyForgotPasswordComponent,
    LegacyResetPasswordComponent
  ]
})
export class AuthModule {}

