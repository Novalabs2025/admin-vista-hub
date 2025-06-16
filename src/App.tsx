
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AuthPage from '@/pages/Auth';
import Index from '@/pages/Index';
import Analytics from '@/pages/Analytics';
import Agents from '@/pages/Agents';
import Properties from '@/pages/Properties';
import PropertyPerformance from '@/pages/PropertyPerformance';
import Payments from '@/pages/Payments';
import Communications from '@/pages/Communications';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import SuperAdminPage from '@/pages/SuperAdmin';
import AcceptInvitationPage from '@/pages/AcceptInvitation';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin/accept-invitation" element={<AcceptInvitationPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/agents" element={<Agents />} />
                      <Route path="/properties" element={<Properties />} />
                      <Route path="/property-performance" element={<PropertyPerformance />} />
                      <Route path="/payments" element={<Payments />} />
                      <Route path="/communications" element={<Communications />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/super-admin" element={<SuperAdminPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
