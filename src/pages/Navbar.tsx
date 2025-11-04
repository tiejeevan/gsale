import React, { useContext } from "react";
import { Link } from "react-router-dom";
import NotificationsBell from "../components/NotificationsBell";
import { AuthContext } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout } = useContext(AuthContext)!;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md px-4 py-2 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="text-xl font-bold text-gray-800 dark:text-white">Gsale</Link>
        <Link to="/discover" className="text-gray-600 dark:text-gray-300 hover:underline">Discover</Link>
      </div>

      <div className="flex items-center gap-4">
        {user && <NotificationsBell />}

        {user && (
          <div className="flex items-center gap-2">
            <img
              src={'https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg'}
              alt="User avatar"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-gray-700 dark:text-gray-200">{user.first_name}</span>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:underline"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
