import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/app/globals.css"
import { SevenfoldApp } from "@/app/SevenfoldApp"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SevenfoldApp />
  </StrictMode>,
)
