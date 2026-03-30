import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api, setAccessToken } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import type { User, LoginResponse } from '../types/auth';
import type { ApiResponse } from '../types/common';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 refresh token으로 인증 복원
  useEffect(() => {
    (async () => {
      try {
        const refreshRes = await api.post<ApiResponse<LoginResponse>>(
          API_ENDPOINTS.AUTH.REFRESH,
        );
        const token = refreshRes?.data?.access_token;
        if (token) {
          setAccessToken(token);
          const meRes = await api.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.ME);
          setUser(meRes.data);
        }
      } catch {
        // refresh 실패 — 비로그인 상태
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password },
    );
    const token = res?.data?.access_token;
    if (token) {
      setAccessToken(token);
      const meRes = await api.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.ME);
      setUser(meRes.data);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.delete(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // 로그아웃 실패해도 로컬 상태는 정리
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
