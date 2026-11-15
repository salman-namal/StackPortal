export interface UserDto {
  id: number;
  name: string;
  username: string;
  email: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface UserQuery {
  page: number;
  size: number;
  search?: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  active?: boolean;
  emailVerified?: boolean;
}
