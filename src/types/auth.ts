export interface User {
  id: number;
  email: string;
  nickname: string;
  profile_image: string | null;
  bio: string | null;
  distro: string | null;
  role: 'user' | 'admin';
  email_verified: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}
