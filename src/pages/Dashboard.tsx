import React from "react";

const Dashboard: React.FC = () => {
  const user = localStorage.getItem("user");
  const userObj = user ? JSON.parse(user) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          My Dashboard
        </h1>
        <nav className="space-y-4">
          <a
            href="#"
            className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition-colors"
          >
            Home
          </a>
          <a
            href="#"
            className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition-colors"
          >
            Profile
          </a>
          <a
            href="#"
            className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition-colors"
          >
            Settings
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 transition-colors duration-300">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Dashboard
          </h2>
          {userObj && (
            <p className="text-gray-700 dark:text-gray-300">
              Welcome, {userObj.name}!
            </p>
          )}
          <button
            onClick={handleLogout}
            className="mt-4 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
          >
            Sign Out
          </button>

          {/* Example future content cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Overview
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Quick stats and summaries will go here.
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl shadow hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Charts and graphs can be added in the future.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
