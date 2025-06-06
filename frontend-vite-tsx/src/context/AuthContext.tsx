import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { loginUser, refreshToken as apiRefreshToken } from '../api/authApi';
import type { AuthContextType } from '../interfaces';
import type { User } from '../interfaces';
import { setAuthTokens, getAccessToken, getRefreshToken, clearAuthTokens } from '../utils/authUtils';
import { fetchUserProfile as apiFetchUserProfile } from '../api/userApi';



export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 检查初始认证状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      if (accessToken && refreshToken) {
        try {
          await fetchUserProfile(); // 尝试获取用户信息，如果成功则认为已认证
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Initial access token invalid, attempting refresh:", error);
          const refreshed = await apiRefreshToken();
          if (refreshed) {
            setIsAuthenticated(true);
            await fetchUserProfile();
          } else {
            clearAuthTokens();
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } else {
        clearAuthTokens();
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await apiFetchUserProfile();
      setUser(data);
      return true;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      clearAuthTokens();
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const data = await loginUser(username, password);
      setAuthTokens(data.access_token, data.refresh_token);
      await fetchUserProfile();
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      clearAuthTokens();
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
  }, [fetchUserProfile]);

  const logout = useCallback(() => {
    clearAuthTokens();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const success = await apiRefreshToken();
      if (success) {
        await fetchUserProfile();
        setIsAuthenticated(true);
        return true;
      }
      logout();
      return false;
    } catch (error) {
      console.error("Refresh token failed:", error);
      logout();
      return false;
    }
  }, [logout, fetchUserProfile]);

  const contextValue = {
    user,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
