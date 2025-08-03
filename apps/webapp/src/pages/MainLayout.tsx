import React from "react";
import Sidebar from "../components/sidebar/Sidebar";
import { Outlet } from "react-router-dom";

interface MainLayoutProps {
  sidebarProps: any;
}

const MainLayout: React.FC<MainLayoutProps> = ({ sidebarProps }) => {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar {...sidebarProps} />
      <main className="flex-1 bg-stone-50">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout; 
