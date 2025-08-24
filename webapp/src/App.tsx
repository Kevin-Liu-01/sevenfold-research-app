import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import HomePage from "./pages/HomePage";
import WorkbenchPage from "./pages/WorkbenchPage";
import NewProjectPage from "./pages/NewProjectPage";
import UserSettingsPage from "./pages/UserSettingsPage";
import { ForgotPasswordPage, SigninPage, SignupPage } from "./pages/AuthPages";
import WelcomePage from "./pages/WelcomePage";

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public routes */}
                <Route path="/signin" element={<SigninPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/welcome" element={<WelcomePage />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/newproject" element={<NewProjectPage />} />
                    <Route path="/project/:projectId" element={<WorkbenchPage />} />
                    <Route path="/settings" element={<UserSettingsPage />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}
