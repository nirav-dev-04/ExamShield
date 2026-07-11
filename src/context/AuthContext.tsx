import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { UserResponseDTO, UserRole } from "../types/auth";
import { apiClient } from "../config/axios";

interface AuthContextType {
  user: UserResponseDTO | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserResponseDTO>;
  logout: () => Promise<void>;
  register: (fullName: string, email: string, password: string, role: UserRole, enrollmentNo: string) => Promise<UserResponseDTO>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const response = await apiClient.get<UserResponseDTO>("/auth/me");
      setUser(response.data);
    } catch (error: any) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string): Promise<UserResponseDTO> => {
    const response = await apiClient.post<UserResponseDTO>("/auth/login", { email, password });
    setUser(response.data);
    return response.data;
  };

  const logout = async (): Promise<void> => {
    await apiClient.post("/auth/logout");
    setUser(null);
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole,
    enrollmentNo: string
  ): Promise<UserResponseDTO> => {
    const response = await apiClient.post<UserResponseDTO>("/auth/register", {
      fullName,
      email,
      password,
      role,
      enrollmentNo,
    });
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
