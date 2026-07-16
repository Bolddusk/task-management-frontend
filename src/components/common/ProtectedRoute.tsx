import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { PermissionCode } from '../../types';

interface Props {
  children: React.ReactNode;
  permission?: PermissionCode;
  anyPermission?: PermissionCode[];
}

export function ProtectedRoute({
  children,
  permission,
  anyPermission,
}: Props) {
  const { isAuthenticated, isLoading, hasPermission, hasAnyPermission, user } =
    useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (
    user?.must_change_password &&
    !location.pathname.includes('/change-password')
  ) {
    return <Navigate to="/change-password" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (anyPermission?.length && !hasAnyPermission(...anyPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
