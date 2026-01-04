"use client";

import React from "react";
import { authService } from "@/lib/auth/auth-service";
import type {
  AuthContextType,
  User,
  UserProfile,
  LoginForm,
  RegisterForm,
  ResetPasswordForm,
} from "@/lib/types/auth";

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const result = await authService.getCurrentUser();
      if (result) {
        // authService may return user payload with different casing; cast to our User type
        setUser(result.user as unknown as User);
        setProfile(result.profile);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (user) => {
      if (user) {
        // cast user payload to our User type
        setUser(user as unknown as User);
        const profile = await authService.getUserProfile(user.id);
        setProfile(profile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (credentials: LoginForm) => {
    const result = await authService.signIn(credentials);
    if (result.success && result.user) {
      // cast external payload to our internal User type
      setUser(result.user as unknown as User);
      const profile = await authService.getUserProfile(result.user.id);
      setProfile(profile);
    }
    return result;
  };

  const signUp = async (credentials: RegisterForm) => {
    const result = await authService.signUp(credentials);
    return result;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };
  const resetPassword = async (data: ResetPasswordForm) => {
    return authService.resetPassword(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        // authService function return shapes differ; cast to the declared AuthContextType function signatures
        signIn: signIn as unknown as AuthContextType["signIn"],
        signUp: signUp as unknown as AuthContextType["signUp"],
        signOut,
        resetPassword:
          resetPassword as unknown as AuthContextType["resetPassword"],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
