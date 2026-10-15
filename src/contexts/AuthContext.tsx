import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authStorage } from "@/utils/auth-storage";
import { authService } from "@/services/auth.service";
import type { UserProfile } from "@/types/auth";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken?: string, user?: UserProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khôi phục trạng thái đăng nhập từ bộ nhớ lưu trữ phía client
  useEffect(() => {
    try {
      const token = authStorage.getToken();
      const savedUser = authStorage.getUser();
      if (token) {
        setIsAuthenticated(true);
        setUser(savedUser);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    (token: string, refreshToken?: string, newUser?: UserProfile) => {
      authStorage.setToken(token);
      if (refreshToken) authStorage.setRefreshToken(refreshToken);
      if (newUser) {
        authStorage.setUser(newUser);
        setUser(newUser);
      }
      setIsAuthenticated(true);
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch {
      // Giữ nguyên thông tin hiện tại nếu chưa thể làm mới
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
}
