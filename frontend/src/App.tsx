import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { APIProvider } from '@vis.gl/react-google-maps';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { queryClient } from './lib/queryClient';
import CitizenLayout from './components/layout/CitizenLayout';
import PublicLayout from './components/layout/PublicLayout';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Citizen pages
import Dashboard from './pages/Dashboard';
import ReportWaste from './pages/ReportWaste';
import MapView from './pages/MapView';
import Rewards from './pages/Rewards';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import AccountSettings from './pages/settings/AccountSettings';
import SecuritySettings from './pages/settings/SecuritySettings';
import LanguageSettings from './pages/settings/LanguageSettings';
import ThemeSettings from './pages/settings/ThemeSettings';
import NotificationSettings from './pages/settings/NotificationSettings';
import PrivacySettings from './pages/settings/PrivacySettings';
import DataSettings from './pages/settings/DataSettings';
import MyActivity from './pages/MyActivity';
import ReportDetail from './pages/ReportDetail';
import CommunityImpact from './pages/CommunityImpact';
import RecyclingCentres from './pages/RecyclingCentres';
import Education from './pages/Education';
import EducationArticle from './pages/EducationArticle';

// Static / public-ish pages
import HelpFAQ from './pages/HelpFAQ';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

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

// Sidebar/AdminLayout from existing components
import { Sidebar } from './components/Sidebar';
import { UpdateBanner } from './components/UpdateBanner';

function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <QueryClientProvider client={queryClient}>
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''} libraries={[]}>
          <BrowserRouter>
            <AuthProvider>
              <UpdateBanner />
              <Routes>
                {/* Public */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* Onboarding (protected, no chrome) */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />

                {/* Citizen */}
                <Route
                  element={
                    <ProtectedRoute>
                      <CitizenLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/report" element={<ReportWaste />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/account" element={<AccountSettings />} />
                  <Route path="/settings/security" element={<SecuritySettings />} />
                  <Route path="/settings/language" element={<LanguageSettings />} />
                  <Route path="/settings/theme" element={<ThemeSettings />} />
                  <Route path="/settings/notifications" element={<NotificationSettings />} />
                  <Route path="/settings/privacy" element={<PrivacySettings />} />
                  <Route path="/settings/data" element={<DataSettings />} />
                  <Route path="/activity" element={<MyActivity />} />
                  <Route path="/reports/:id" element={<ReportDetail />} />
                  <Route path="/community" element={<CommunityImpact />} />
                  <Route path="/centres" element={<RecyclingCentres />} />
                  <Route path="/education" element={<Education />} />
                  <Route path="/education/:slug" element={<EducationArticle />} />
                  <Route path="/help" element={<HelpFAQ />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
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
        </APIProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
