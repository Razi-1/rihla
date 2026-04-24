import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { AccountType } from '@/types/common';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AccountType[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, account, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return null;

  if (!isAuthenticated || !account) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(account.account_type)) {
    return <Navigate to={`/${account.account_type}/dashboard`} replace />;
  }

  return <>{children}</>;
}
