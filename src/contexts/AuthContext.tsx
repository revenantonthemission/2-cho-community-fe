import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { api, setAccessToken } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import type { User, LoginResponse } from '../types/auth';
import type { ApiResponse } from '../types/common';

// BE serialize_user() → FE User 필드 매핑
interface MeResponse {
  user: {
    user_id: number;
    email: string;
    email_verified: boolean;
    nickname: string;
    profileImageUrl: string | null;
    role: 'user' | 'admin';
    distro: string | null;
  };
}

function mapToUser(raw: MeResponse['user']): User {
  return {
    id: raw.user_id,
    email: raw.email,
    nickname: raw.nickname,
    profile_image: raw.profileImageUrl,
    bio: null,
    distro: raw.distro,
    role: raw.role,
    email_verified: raw.email_verified,
    created_at: '',
  };
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  fetchUser: () => Promise<void>;
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
          const meRes = await api.get<ApiResponse<MeResponse>>(API_ENDPOINTS.AUTH.ME);
          setUser(mapToUser(meRes.data.user));
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
      const meRes = await api.get<ApiResponse<MeResponse>>(API_ENDPOINTS.AUTH.ME);
      setUser(mapToUser(meRes.data.user));
    }
  }, []);

  // /me 재조회 — 소셜 가입 닉네임 설정 후 user 상태 갱신용
  const fetchUser = useCallback(async () => {
    const meRes = await api.get<ApiResponse<MeResponse>>(API_ENDPOINTS.AUTH.ME);
    setUser(mapToUser(meRes.data.user));
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

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      setUser,
      fetchUser,
    }),
    [user, isLoading, login, logout, fetchUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
