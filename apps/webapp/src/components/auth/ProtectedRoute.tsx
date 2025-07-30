// src/components/auth/ProtectedRoute.tsx

import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute: React.FC = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login, with redirect back to intended page after login
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    // User is authenticated, render the protected content
    return <Outlet />;
};

export default ProtectedRoute;
