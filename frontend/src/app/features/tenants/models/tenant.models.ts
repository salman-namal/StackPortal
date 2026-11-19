export interface TenantDto {
  id: number;
  name: string;
  code: string;
  email?: string;
  website?: string;
  phone?: string;
  city?: string;
  country?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantQuery {
  page: number;
  size: number;
  search?: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  status?: 'ACTIVE' | 'INACTIVE';
}
