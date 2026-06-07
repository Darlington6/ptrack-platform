import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { AuthContextType, RegisterPayload, RegisterRequest, User } from "../types";
import client from "../api/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      client
        .get("/auth/me/")
        .then((res) => setUser(res.data as User))
        .catch(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  /** Stores tokens, fetches user profile, returns user object. */
  async function login(email: string, password: string): Promise<User> {
    const res = await client.post("/auth/login/", { email, password });
    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);
    const userData = res.data.user as User;
    setUser(userData);
    return userData;
  }

  /** Registers, stores tokens, sets user. */
  async function register(payload: RegisterPayload): Promise<User> {
    const res = await client.post("/auth/register/", payload as RegisterRequest);
    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);
    const userData = res.data.user as User;
    setUser(userData);
    return userData;
  }

  function logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }

  /** Refresh user data from /auth/me/ after points change etc. */
  async function refreshUser(): Promise<User> {
    const res = await client.get("/auth/me/");
    const userData = res.data as User;
    setUser(userData);
    return userData;
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
