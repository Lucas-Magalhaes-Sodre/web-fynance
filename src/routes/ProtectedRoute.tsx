import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { token, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  const isBillingRoute = location.pathname === '/app/billing';
  const isAdmin = user?.role === 'ADMIN';
  if (user && !isAdmin && user.access && !user.access.canAccess && !isBillingRoute) {
    return <Navigate to="/app/billing" replace />;
  }

  return <Outlet />;
}
