export interface TenantDto {
  id: number;
  name: string;
  code: string;
  /** Generated tenant-specific sign-in URL (platform-managed; read-only). */
  loginUrl?: string;
  adminName?: string;
  adminEmail?: string;
  email?: string;
  website?: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  logo?: string;
  logoId?: string;
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
