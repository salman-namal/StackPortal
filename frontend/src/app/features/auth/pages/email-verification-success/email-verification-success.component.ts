import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-email-verification-success',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthLayoutComponent],
  templateUrl: './email-verification-success.component.html',
  styleUrls: ['./email-verification-success.component.scss']
})
export class EmailVerificationSuccessComponent {}
