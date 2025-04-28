import PrivateRoute from './PrivateRoute';

// Re-export PrivateRoute as ProtectedRoute for backward compatibility 
// This ensures existing imports still work
const ProtectedRoute = PrivateRoute;

export default ProtectedRoute;
