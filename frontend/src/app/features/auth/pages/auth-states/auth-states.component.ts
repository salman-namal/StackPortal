import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-auth-states',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthLayoutComponent],
  templateUrl: './auth-states.component.html',
  styleUrls: ['./auth-states.component.scss']
})
export class AuthStatesComponent {
  activeTab: 'loading' | 'empty' | 'success' | 'error' = 'loading';
}
