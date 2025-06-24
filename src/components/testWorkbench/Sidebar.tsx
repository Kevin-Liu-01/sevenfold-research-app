// src/components/testWorkbench/Sidebar.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { icon: "search", label: "Search" },
  { icon: "remove_red_eye", label: "Skims" },
  { icon: "source", label: "Sources" },
  { icon: "edit", label: "Write" },
];

// interface SidebarProps {
//   collapsed: boolean;
// }

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const { user, signOut } = useAuth();

  const defaultSidebar = 80;

  return (
    <>
      {collapsed && (
        <div
          className="absolute top-0 left-0 h-full w-2 cursor-pointer z-40 bg-gray-200 hover:bg-gray-300"
          onMouseEnter={() => setCollapsed(false)}
        />
      )}
      <div className="flex h-full">
        <div
          onMouseLeave={() => setCollapsed(true)}
          style={{
            width: collapsed ? 0 : defaultSidebar,
            transition: "width 0.3s",
          }}
          className="h-full bg-white shadow-lg overflow-hidden flex-shrink-0 z-30"
        >
          <div className="relative h-full w-full">
            <div
              className={`absolute inset-0 bg-white shadow-lg p-4 flex flex-col items-center space-y-6
                    transform transition-transform duration-300
                    ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
            >
              {/* Logo */}
              <img
                src="/images/logo.png"
                alt="Logo"
                className="h-10 w-10 rounded-full"
              />

              {/* Nav */}
              <nav className="flex-1 flex flex-col justify-center space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    className="flex flex-col items-center text-gray-700 hover:text-blue-600"
                  >
                    <i className="material-icons-outlined text-xl">
                      {item.icon}
                    </i>
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Avatar */}
              <img
                src="https://avatars.githubusercontent.com/u/66856750?v=4"
                alt="avatar"
                className="h-10 w-10 rounded-full"
              />
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <div className="flex flex-col space-y-2">
                    <p className="text-gray-700">
                      Hello, {user?.id || user?.email}
                    </p>
                    <Link
                      href="/profile"
                      className="text-blue-500 hover:underline"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="text-red-500 hover:underline text-left p-0"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link
                      href="/login"
                      className="text-blue-500 hover:underline"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="text-blue-500 hover:underline"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
