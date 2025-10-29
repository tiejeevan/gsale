import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

interface CreatePostProps {
  onPostCreated?: () => void; // callback to refresh posts or do something
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const auth = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL;

  if (!auth) return null;
  const { token } = auth;

  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  const createPost = async () => {
    if (!content.trim() && files.length === 0) {
      setMessage("Post content or files are required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("visibility", "public");

      files.forEach((file) => formData.append("files", file));

      const res = await fetch(`${API_URL}/api/posts/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to create post");
      } else {
        setMessage("Post created successfully!");
        setContent("");
        setFiles([]);
        onPostCreated?.(); // trigger parent refresh if needed
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-xl shadow-md mb-6">
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
        type="file"
        multiple
        onChange={handleFileChange}
        className="w-full mb-3"
      />
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-indigo-200 dark:bg-indigo-600 text-indigo-800 dark:text-white rounded"
            >
              {file.name}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={createPost}
        disabled={loading}
        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  );
};

export default CreatePost;
