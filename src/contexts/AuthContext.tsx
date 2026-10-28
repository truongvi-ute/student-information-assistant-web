
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authStorage } from "@/utils/auth-storage";
import { authService } from "@/services/auth.service";
import type { UserProfile } from "@/types/auth";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  postLoginRedirect: string | null;
  login: (token: string, refreshToken?: string, user?: UserProfile, redirectTo?: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  clearPostLoginRedirect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [postLoginRedirect, setPostLoginRedirect] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error) {
      console.error("Không thể cập nhật thông tin người dùng:", error);
    }
  }, []);

  // Khôi phục thông tin đăng nhập khi ứng dụng khởi tạo.
  useEffect(() => {
    try {
      const token = authStorage.getToken();
      const savedUser = token ? authStorage.getUser() : null;

      setUser(savedUser);
      setIsAuthenticated(Boolean(token));

      if (token && (!savedUser || !savedUser.fullName)) {
        void refreshProfile();
      }
    } catch (error) {
      console.error("Không thể khôi phục phiên đăng nhập:", error);

      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  // Cập nhật trạng thái sau khi đăng nhập thành công.
  const login = useCallback(
    (token: string, refreshToken?: string, newUser?: UserProfile, redirectTo?: string) => {
      if (!token.trim()) {
        throw new Error("Không tìm thấy token đăng nhập.");
      }

      const currentToken = authStorage.getToken();

      // Chỉ thay phiên lưu trữ nếu token đã thay đổi.
      if (currentToken !== token) {
        authStorage.clearAuth();
        authStorage.setToken(token);
      }
      if (refreshToken) authStorage.setRefreshToken(refreshToken);
      if (newUser) {
        authStorage.setUser(newUser);
      }
      // Nếu service đã lưu user thì sử dụng lại.
      const currentUser = newUser ?? authStorage.getUser();

      setUser(currentUser);
      setPostLoginRedirect(redirectTo ?? null);
      setIsAuthenticated(true);
    },
    []
  );

  // Xóa thông tin đăng nhập.
  const logout = useCallback(() => {
    void authService.logout();

    setUser(null);
    setIsAuthenticated(false);
    setPostLoginRedirect(null);
  }, []);


  // Xóa đường dẫn chuyển hướng sau khi đã sử dụng.
  const clearPostLoginRedirect = useCallback(() => {
    setPostLoginRedirect(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        postLoginRedirect,
        login,
        logout,
        refreshProfile,
        clearPostLoginRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth phải được sử dụng bên trong AuthProvider"
    );
  }

  return context;
}
