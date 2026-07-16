import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { MeResponse, PermissionCode } from '../types';
import { login as apiLogin, getMe } from '../api/auth';

interface AuthContextType {
  user: MeResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ mustChangePassword: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: PermissionCode) => boolean;
  hasAnyPermission: (...permissions: PermissionCode[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Officers must have task.view_own (not legacy task.view_dept). Force re-login if JWT is stale. */
function isStaleOfficerSession(me: MeResponse): boolean {
  if (me.role_name !== 'officer') return false;
  return !me.permissions.includes('task.view_own');
}

function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token'),
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await getMe();
    if (isStaleOfficerSession(me)) {
      clearAuthStorage();
      setToken(null);
      setUser(null);
      throw new Error('Session outdated — please sign in again');
    }
    setUser(me);
    // Do not trust cached permissions; always overwrite from /auth/me
    localStorage.setItem('user', JSON.stringify(me));
  }, []);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        clearAuthStorage();
        setIsLoading(false);
        return;
      }
      try {
        setToken(savedToken);
        await refreshUser();
      } catch {
        clearAuthStorage();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    clearAuthStorage();
    const res = await apiLogin(email, password);
    localStorage.setItem('token', res.token);
    setToken(res.token);
    const me = await getMe();
    if (isStaleOfficerSession(me)) {
      clearAuthStorage();
      setToken(null);
      setUser(null);
      throw new Error(
        'Officer account is missing task.view_own. Ask admin to re-seed permissions.',
      );
    }
    setUser(me);
    localStorage.setItem('user', JSON.stringify(me));
    return {
      mustChangePassword:
        !!res.must_change_password || me.must_change_password,
    };
  };

  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission: PermissionCode) =>
    user?.permissions?.includes(permission) ?? false;

  const hasAnyPermission = (...permissions: PermissionCode[]) =>
    permissions.some((p) => hasPermission(p));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
