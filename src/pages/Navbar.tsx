import React, { useContext, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import NotificationsBell from "../components/NotificationsBell";
import { AuthContext } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout } = useContext(AuthContext)!;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Close mobile menu if click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo + Discover */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-xl font-bold text-gray-800 dark:text-white">
              Gsale
            </Link>
            <div className="hidden md:flex gap-4">
              <Link to="/discover" className="text-gray-600 dark:text-gray-300 hover:underline">
                Discover
              </Link>
            </div>
          </div>

          {/* Right: Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {user && <NotificationsBell />}
            {user && (
              <div className="flex items-center gap-2">
                <img
                  src={"https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border-2 border-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-200 font-medium">{user.first_name}</span>
                <button onClick={logout} className="text-sm text-red-500 hover:underline">
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationsBell />}
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 dark:text-gray-200 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-700 shadow-md">
          <div className="flex flex-col gap-2 px-4 py-2">
            <Link
              to="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-md"
            >
              Discover
            </Link>

            {user && (
              <div className="flex items-center gap-2 px-3 py-2 border-t dark:border-gray-700">
                <img
                  src={"https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border-2 border-indigo-500"
                />
                <span className="text-gray-700 dark:text-gray-200 font-medium">{user.first_name}</span>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="ml-auto text-sm text-red-500 hover:underline"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
