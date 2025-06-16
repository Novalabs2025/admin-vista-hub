
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";
import Agents from "./pages/Agents";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Payments from "./pages/Payments";
import Analytics from "./pages/Analytics";
import PropertyPerformance from "./pages/PropertyPerformance";
import Communications from "./pages/Communications";
import { AuthProvider } from "./contexts/AuthContext";
import AuthPage from "./pages/Auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";
import Properties from "./pages/Properties";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardLayout><Index /></DashboardLayout></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute><DashboardLayout><Properties /></DashboardLayout></ProtectedRoute>} />
            <Route path="/property-performance" element={<ProtectedRoute><DashboardLayout><PropertyPerformance /></DashboardLayout></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><DashboardLayout><Agents /></DashboardLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<RoleProtectedRoute allowedRoles={['admin']}><DashboardLayout><Analytics /></DashboardLayout></RoleProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/communications" element={<ProtectedRoute><DashboardLayout><Communications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><DashboardLayout><Payments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/settings" element={<RoleProtectedRoute allowedRoles={['admin']}><DashboardLayout><Settings /></DashboardLayout></RoleProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<ProtectedRoute><DashboardLayout><NotFound /></DashboardLayout></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
