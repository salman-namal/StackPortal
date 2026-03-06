import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface UserDto {
  id: number;
  name: string;
  email: string;
  active: boolean;
  emailVerified: boolean;
  roles: string[];
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  users: UserDto[] = [];
  loading = false;
  error: string | null = null;

  private readonly apiUrl = 'http://localhost:8080/api/admin/users';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.http
      .get<ApiResponse<PageResponse<UserDto>>>(this.apiUrl)
      .subscribe({
        next: res => {
          this.loading = false;
          this.users = res.data?.content ?? [];
        },
        error: err => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to load users';
        }
      });
  }
}

