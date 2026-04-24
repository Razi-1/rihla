import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AdminShell } from '@/components/layout/AdminShell';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import AccountListPage from '@/pages/AccountList';
import AccountDetailPage from '@/pages/AccountDetail';
import ReviewListPage from '@/pages/ReviewList';
import ReviewDetailPage from '@/pages/ReviewDetail';
import AuditLogPage from '@/pages/AuditLog';
import SubjectManagementPage from '@/pages/SubjectManagement';
import AdminTeamPage from '@/pages/AdminTeam';
import AdminProfilePage from '@/pages/AdminProfile';

function LoginGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginGuard>
              <LoginPage />
            </LoginGuard>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="accounts" element={<AccountListPage />} />
          <Route path="accounts/:id" element={<AccountDetailPage />} />
          <Route path="reviews" element={<ReviewListPage />} />
          <Route path="reviews/:id" element={<ReviewDetailPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="subjects" element={<SubjectManagementPage />} />
          <Route path="team" element={<AdminTeamPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
