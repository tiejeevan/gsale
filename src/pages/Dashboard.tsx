import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import UserPosts from "./UserPosts";
import { Link } from "react-router-dom";

const Dashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL;

  if (!auth) return null; // safety check
  const { user, logout, token } = auth; // make sure your AuthContext provides the JWT token

  // State for new post
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Create post function
  const createPost = async () => {
    if (!content.trim()) {
      setMessage("Post content cannot be empty");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/posts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // using JWT token from context
        },
        body: JSON.stringify({
          content,
          image_url: imageUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to create post");
      } else {
        setMessage("Post created successfully!");
        setContent("");
        setImageUrl("");
        console.log("New post:", data);
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          My Dashboard
        </h2>
        <nav className="space-y-4">
          <a
            href="#"
            className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition-colors"
          >
            Home
          </a>
          <Link
  to="/discover"
  className="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 transition-colors"
>
  Discover
</Link>
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
          {user && (
            <p className="text-gray-700 dark:text-gray-300">
              Welcome, {user.first_name} {user.last_name}!
            </p>
          )}
          <button
            onClick={logout}
            className="mt-4 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
          >
            Sign Out
          </button>

          {/* ================= Create Post Form ================= */}
          <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-700 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Create a Post
            </h3>
            {message && (
              <p className="mb-2 text-sm text-red-500 dark:text-red-400">{message}</p>
            )}
            <textarea
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-gray-100 mb-3"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <input
              type="text"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-600 dark:text-gray-100 mb-3"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <button
              onClick={createPost}
              disabled={loading}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>

          <UserPosts />

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
