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
  username: string;
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
