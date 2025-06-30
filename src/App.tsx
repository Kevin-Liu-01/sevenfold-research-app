// src/App.tsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import WorkbenchPage from "./pages/WorkbenchPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NewProjectPage from "./pages/NewProjectPage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/project/:projectId" element={<WorkbenchPage />} />
            <Route path="/newproject" element={<NewProjectPage />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
