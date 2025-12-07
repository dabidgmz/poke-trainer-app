// interfaces/Auth.ts

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  hCaptchaToken: string;
}

export interface LoginData {
  email: string;
  password: string;
  hCaptchaToken: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  role: 'entrenador' | 'profesor';
  isVerified: boolean;
  isBanned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  type: string;
  token: string;
  user: User;
}

export interface LoginResponse2FA {
  message: string;
  requiresCode: boolean;
  user: User;
}

export interface VerifyCodeData {
  email: string;
  code: string;
  hCaptchaToken: string;
}

export interface ResendCodeData {
  email: string;
  hCaptchaToken: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
}