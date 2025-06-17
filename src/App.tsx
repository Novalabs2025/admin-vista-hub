
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Properties from "./pages/Properties";
import CRM from "./pages/CRM";
import Agents from "./pages/Agents";
import Analytics from "./pages/Analytics";
import PropertyPerformance from "./pages/PropertyPerformance";
import Communications from "./pages/Communications";
import Payments from "./pages/Payments";
import Notifications from "./pages/Notifications";
import SuperAdmin from "./pages/SuperAdmin";
import Settings from "./pages/Settings";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/properties" element={<Properties />} />
                        <Route path="/crm" element={<CRM />} />
                        <Route 
                          path="/agents" 
                          element={
                            <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
                              <Agents />
                            </RoleProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/analytics" 
                          element={
                            <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
                              <Analytics />
                            </RoleProtectedRoute>
                          } 
                        />
                        <Route path="/property-performance" element={<PropertyPerformance />} />
                        <Route path="/communications" element={<Communications />} />
                        <Route path="/payments" element={<Payments />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route 
                          path="/super-admin" 
                          element={
                            <RoleProtectedRoute allowedRoles={['super_admin']}>
                              <SuperAdmin />
                            </RoleProtectedRoute>
                          } 
                        />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
