import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ProtectedRoute from '@/components/common/ProtectedRoute';

const AppShell = lazy(() => import('@/components/layout/AppShell'));
const PublicLayout = lazy(() => import('@/components/layout/PublicLayout'));

// Public pages
const Landing = lazy(() => import('@/pages/public/Landing'));
const Login = lazy(() => import('@/pages/public/Login'));
const Register = lazy(() => import('@/pages/public/Register'));
const PasswordRecovery = lazy(() => import('@/pages/public/PasswordRecovery'));
const VerifyEmail = lazy(() => import('@/pages/public/VerifyEmail'));
const TutorSearchPublic = lazy(() => import('@/pages/public/TutorSearchPublic'));
const TutorProfilePublic = lazy(() => import('@/pages/public/TutorProfilePublic'));
const TermsPrivacy = lazy(() => import('@/pages/public/TermsPrivacy'));

// Student pages
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const TutorSearch = lazy(() => import('@/pages/student/TutorSearch'));
const TutorProfile = lazy(() => import('@/pages/student/TutorProfile'));
const StudentProfile = lazy(() => import('@/pages/student/Profile'));
const ClassInvite = lazy(() => import('@/pages/student/ClassInvite'));
const ClassDetail = lazy(() => import('@/pages/student/ClassDetail'));

// Tutor pages
const TutorDashboard = lazy(() => import('@/pages/tutor/Dashboard'));
const EditProfile = lazy(() => import('@/pages/tutor/EditProfile'));
const ProfilePreview = lazy(() => import('@/pages/tutor/ProfilePreview'));
const CreateClass = lazy(() => import('@/pages/tutor/CreateClass'));
const ClassSpace = lazy(() => import('@/pages/tutor/ClassSpace'));

// Parent pages
const ParentDashboard = lazy(() => import('@/pages/parent/Dashboard'));
const ChildOverview = lazy(() => import('@/pages/parent/ChildOverview'));
const ParentProfile = lazy(() => import('@/pages/parent/Profile'));
const LinkChild = lazy(() => import('@/pages/parent/LinkChild'));

// Shared pages
const Calendar = lazy(() => import('@/pages/shared/Calendar'));
const ChatList = lazy(() => import('@/pages/shared/ChatList'));
const ChatConversation = lazy(() => import('@/pages/shared/ChatConversation'));
const VideoCall = lazy(() => import('@/pages/shared/VideoCall'));
const MySessions = lazy(() => import('@/pages/shared/MySessions'));
const Settings = lazy(() => import('@/pages/shared/Settings'));
const Notifications = lazy(() => import('@/pages/shared/Notifications'));
const HelpSupport = lazy(() => import('@/pages/shared/HelpSupport'));

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-surface)',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid var(--color-surface-high)',
        borderTopColor: 'var(--color-primary-blue)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const { initAuth } = useAuth();
  const account = useAuthStore((s) => s.account);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<PasswordRecovery />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/tutors" element={<TutorSearchPublic />} />
              <Route path="/tutors/:id" element={<TutorProfilePublic />} />
              <Route path="/terms" element={<TermsPrivacy />} />
              <Route path="/privacy" element={<TermsPrivacy />} />
            </Route>

            {/* Authenticated routes */}
            <Route element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }>
              {/* Student routes */}
              <Route path="/student/dashboard" element={
                <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
              } />
              <Route path="/student/search" element={
                <ProtectedRoute allowedRoles={['student']}><TutorSearch /></ProtectedRoute>
              } />
              <Route path="/student/tutors/:id" element={
                <ProtectedRoute allowedRoles={['student']}><TutorProfile /></ProtectedRoute>
              } />
              <Route path="/student/profile" element={
                <ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>
              } />
              <Route path="/student/invites" element={
                <ProtectedRoute allowedRoles={['student']}><ClassInvite /></ProtectedRoute>
              } />
              <Route path="/student/classes/:id" element={
                <ProtectedRoute allowedRoles={['student']}><ClassDetail /></ProtectedRoute>
              } />

              {/* Tutor routes */}
              <Route path="/tutor/dashboard" element={
                <ProtectedRoute allowedRoles={['tutor']}><TutorDashboard /></ProtectedRoute>
              } />
              <Route path="/tutor/edit-profile" element={
                <ProtectedRoute allowedRoles={['tutor']}><EditProfile /></ProtectedRoute>
              } />
              <Route path="/tutor/preview" element={
                <ProtectedRoute allowedRoles={['tutor']}><ProfilePreview /></ProtectedRoute>
              } />
              <Route path="/tutor/create-class" element={
                <ProtectedRoute allowedRoles={['tutor']}><CreateClass /></ProtectedRoute>
              } />
              <Route path="/tutor/classes/:id" element={
                <ProtectedRoute allowedRoles={['tutor']}><ClassSpace /></ProtectedRoute>
              } />

              {/* Parent routes */}
              <Route path="/parent/dashboard" element={
                <ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>
              } />
              <Route path="/parent/children/:id" element={
                <ProtectedRoute allowedRoles={['parent']}><ChildOverview /></ProtectedRoute>
              } />
              <Route path="/parent/profile" element={
                <ProtectedRoute allowedRoles={['parent']}><ParentProfile /></ProtectedRoute>
              } />
              <Route path="/parent/link-child" element={
                <ProtectedRoute allowedRoles={['parent']}><LinkChild /></ProtectedRoute>
              } />

              {/* Shared authenticated routes */}
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/chat" element={<ChatList />} />
              <Route path="/chat/:roomId" element={<ChatConversation />} />
              <Route path="/sessions" element={<MySessions />} />
              <Route path="/video/:roomName" element={<VideoCall />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/help" element={<HelpSupport />} />
            </Route>

            {/* Redirect root based on role */}
            <Route path="/dashboard" element={
              account ? <Navigate to={`/${account.account_type}/dashboard`} replace /> : <Navigate to="/login" replace />
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </ErrorBoundary>
  );
}
