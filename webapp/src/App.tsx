import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import HomePage from "./pages/HomePage";
import WorkbenchPage from "./pages/WorkbenchPage";
import NewProjectPage from "./pages/NewProjectPage";
import { ForgotPasswordPage, SigninPage, SignupPage } from "./pages/AuthPages";

// import { ChatProvider } from "./context/ChatContext";
// import ChatPage from "./pages/ChatPage";
// import MainLayout from "./pages/MainLayout";

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public routes */}
                <Route path="/signin" element={<SigninPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/newproject" element={<NewProjectPage />} />
                    <Route path="/project/:projectId" element={<WorkbenchPage />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>


        // <ChatProvider>
        //     <AuthProvider>
        //         <Routes>
        //             {/* Public routes */}
        //             <Route path="/signin" element={<SigninPage />} />
        //             <Route path="/signup" element={<SignupPage />} />
        //             <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        //             {/* Home page without sidebar */}
        //             <Route path="/home" element={<HomePage />} />

        //             {/* Main layout for pages that need sidebar */}
        //             <Route element={<MainLayout sidebarProps={sidebarProps} />}>
        //                 <Route path="/project/:projectId" element={<WorkbenchPage />} />
        //                 <Route path="/newproject" element={<NewProjectPage />} />
        //                 <Route path="/chat" element={<ChatPage />} />
        //             </Route>

        //             {/* Catch all route */}
        //             <Route path="*" element={<Navigate to="/home" replace />} />
        //         </Routes>
        //     </AuthProvider>
        // </ChatProvider>
    );
}