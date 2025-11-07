import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import { FiHome, FiCompass, FiSettings, FiMenu, FiX, FiLogOut } from "react-icons/fi";

const navItems = [
  { name: "Home", path: "/", icon: <FiHome size={20} /> },
  { name: "Discover", path: "/discover", icon: <FiCompass size={20} /> },
  { name: "Settings", path: "/settings", icon: <FiSettings size={20} /> },
];

const Sidebar: React.FC = () => {
  const { currentUser: user, logout } = useUserContext();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // mobile toggle

  if (!user) return null;

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
        onClick={toggleSidebar}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar container */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl
          transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          transition-transform duration-300 ease-in-out z-40
          flex flex-col justify-between
        `}
      >
        <div className="p-6">
          {/* User / Dashboard title */}
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">
            {user ? `${user.first_name}'s Dashboard` : "Dashboard"}
          </h3>

          {/* Navigation links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200
                    ${isActive
                      ? "bg-indigo-500 text-white dark:bg-indigo-600 dark:text-white shadow-lg"
                      : "hover:bg-indigo-100 dark:hover:bg-indigo-600 hover:text-indigo-700 transition-colors"}
                    font-medium
                  `}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout button */}
        <div className="p-6">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
          >
            <FiLogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
