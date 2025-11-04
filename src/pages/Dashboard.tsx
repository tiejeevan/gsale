import React from "react";
// import Sidebar from "./Sidebar";
import CreatePost from "./CreatePost";
import UserPosts from "./UserPosts";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      {/* <Sidebar /> */}

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 transition-colors duration-300">
          <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome</h3>

          {/* Create Post */}
          <CreatePost />

          {/* Feed */}
          <UserPosts />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
