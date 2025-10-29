import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Sidebar: React.FC = () => {
  const auth = useContext(AuthContext);
  if (!auth) return null;
  const { user, logout } = auth;

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        {user ? `${user.first_name}'s Dashboard` : "Dashboard"}
      </h3>
      <nav className="space-y-4">
        <Link
          to="/"
          className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition-colors"
        >
          Home
        </Link>
        <Link
          to="/discover"
          className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition-colors"
        >
          Discover
        </Link>
        <Link
          to="#"
          className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition-colors"
        >
          Settings
        </Link>
      </nav>
      <button
        onClick={logout}
        className="mt-4 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
      >
        Sign Out
      </button>
    </aside>
  );
};

export default Sidebar;
