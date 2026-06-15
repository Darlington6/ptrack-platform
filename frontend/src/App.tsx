import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import CitizenLayout from './components/layout/CitizenLayout';
import AdminLayout from './components/layout/AdminLayout';
import { queryClient } from './lib/queryClient';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import About from './pages/About';
import NotFound from './pages/NotFound';

// Citizen pages
import Dashboard from './pages/Dashboard';
import ReportWaste from './pages/ReportWaste';
import MapView from './pages/MapView';
import Rewards from './pages/Rewards';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import MyActivity from './pages/MyActivity';
import ReportDetail from './pages/ReportDetail';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import HelpFAQ from './pages/HelpFAQ';
import CommunityImpact from './pages/CommunityImpact';
import RecyclingCentres from './pages/RecyclingCentres';
import Education from './pages/Education';
import EducationArticle from './pages/EducationArticle';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminCentres from './pages/admin/AdminCentres';
import AdminEducation from './pages/admin/AdminEducation';
import AdminRewardConfig from './pages/admin/AdminRewardConfig';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />
            </Route>

            {/* Citizen */}
            <Route
              element={
                <ProtectedRoute>
                  <CitizenLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report" element={<ReportWaste />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/activity" element={<MyActivity />} />
              <Route path="/reports/:id" element={<ReportDetail />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings/*" element={<Settings />} />
              <Route path="/help" element={<HelpFAQ />} />
              <Route path="/community" element={<CommunityImpact />} />
              <Route path="/centres" element={<RecyclingCentres />} />
              <Route path="/education" element={<Education />} />
              <Route path="/education/:slug" element={<EducationArticle />} />
            </Route>

            {/* Admin */}
            <Route
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/audit-log" element={<AdminAuditLog />} />
              <Route path="/admin/centres" element={<AdminCentres />} />
              <Route path="/admin/education" element={<AdminEducation />} />
              <Route path="/admin/rewards" element={<AdminRewardConfig />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
