import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import "@/app/globals.css"
import { SevenfoldApp } from "@/app/SevenfoldApp"
import { LoginPage } from "@/modules/auth/LoginPage"
import { SignupPage } from "@/modules/auth/SignupPage"
import { ProjectsPage } from "@/modules/projects/ProjectsPage"
import { ProtectedRoute } from "@/shared/components/ProtectedRoute"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute element={<ProjectsPage />} />
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute element={<SevenfoldApp />} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
