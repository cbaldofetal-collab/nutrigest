export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'premium';
  emailVerified: boolean;
  metadata?: Record<string, any>;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  plan: 'free' | 'premium';
  iat: number;
  exp: number;
}