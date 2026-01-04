// Authentication Types
export interface User {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface ResetPasswordForm {
  email: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (
    credentials: LoginForm
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    credentials: RegisterForm
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (
    data: ResetPasswordForm
  ) => Promise<{ success: boolean; error?: string }>;
}
