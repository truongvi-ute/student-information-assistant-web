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
import { ApiClientError } from "@/lib/api/api-error";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  postLoginRedirect: string | null;
  profileError: string | null
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
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    setProfileError(null);

    try {
      const profile = await authService.getProfile();

      setUser(profile);
      setIsAuthenticated(true);
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.status === 401) {
        authStorage.clearAuth();
        setUser(null);
        setIsAuthenticated(false);
        setPostLoginRedirect(null);
      } else {
        setProfileError(
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin tài khoản."
        );
      }

      throw error;
    }
  }, []);

  // Khôi phục thông tin đăng nhập khi ứng dụng khởi tạo.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const token = authStorage.getToken();

        if (!token) {
          if (!cancelled) {
            setUser(null);
            setIsAuthenticated(false);
          }
          return;
        }

        const profile = await authService.getProfile();

        if (!cancelled) {
          setUser(profile);
          setIsAuthenticated(true);
          setProfileError(null);
        }
      } catch (error: unknown) {
        if (cancelled) return;

        setUser(null);
        setIsAuthenticated(false);

        if (error instanceof ApiClientError && error.status === 401) {
          authStorage.clearAuth();
        } else {
          setProfileError(
            error instanceof Error
              ? error.message
              : "Không thể kiểm tra phiên đăng nhập."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

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
      setProfileError(null);
    },
    []
  );

  // Xóa thông tin đăng nhập.
  const logout = useCallback(() => {
    void authService.logout();

    setUser(null);
    setIsAuthenticated(false);
    setPostLoginRedirect(null);
    setProfileError(null);
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
        profileError,
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
