import React from "react";
// import Sidebar from "./Sidebar";
import CreatePost from "./CreatePost";
import UserPosts from "./UserPosts";
import NotificationDebugger from "../components/NotificationDebugger";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      {/* <Sidebar /> */}

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Notification Debugger - Remove this after testing */}
          <NotificationDebugger />
          
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
