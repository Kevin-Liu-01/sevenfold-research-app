// src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NewProjectPage from './pages/NewProjectPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
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