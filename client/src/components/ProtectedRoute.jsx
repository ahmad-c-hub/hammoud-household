import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin, requireIncome, requireSpend }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (requireIncome && !user.has_income) return <Navigate to="/dashboard" replace />;
  if (requireSpend && !user.can_spend) return <Navigate to="/dashboard" replace />;
  return children;
}
