
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";

const RoleProtectedRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) => {
  const { user, loading, hasRole, roles } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // We need to wait for roles to be loaded before checking permissions
  if (roles.length === 0 && user) {
    // If user is loaded but roles are not, we might still be loading them.
    // The main `loading` flag should handle this, but as a safeguard:
    const userHasRequiredRole = allowedRoles.some(role => hasRole(role));
    if (!userHasRequiredRole) {
      toast({
        title: "Unauthorized Access",
        description: "You do not have the required permissions to view this page.",
        variant: "destructive",
      });
      return <Navigate to="/" replace />;
    }
  }
  
  const userHasRequiredRole = allowedRoles.some(role => hasRole(role));

  if (!userHasRequiredRole) {
    toast({
      title: "Unauthorized Access",
      description: "You do not have the required permissions to view this page.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }


  return <>{children}</>;
};

export default RoleProtectedRoute;
