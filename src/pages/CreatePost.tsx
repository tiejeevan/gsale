import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { FiImage, FiLoader, FiSend } from "react-icons/fi";

interface CreatePostProps {
  onPostCreated?: () => void;
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
      setMessage("Write something or attach files to post.");
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
        setMessage(data.error || "❌ Failed to create post");
      } else {
        setMessage("✅ Post created successfully!");
        setContent("");
        setFiles([]);
        onPostCreated?.();
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* Heading */}
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
        Create a New Post
      </h2>

      {/* Message */}
      {message && (
        <div
          className={`mb-3 text-sm ${
            message.startsWith("✅")
              ? "text-green-600"
              : message.startsWith("❌")
              ? "text-red-500"
              : "text-yellow-600"
          }`}
        >
          {message}
        </div>
      )}

      {/* Textarea */}
      <textarea
        className="w-full p-3 mb-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[100px]"
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* File Upload Section */}
      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-200">
          <FiImage className="text-lg" />
          <span className="text-sm font-medium">Attach Files</span>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <button
          onClick={createPost}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold transition-all duration-200 ${
            loading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 shadow-md"
          }`}
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin" /> Posting...
            </>
          ) : (
            <>
              <FiSend /> Post
            </>
          )}
        </button>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file, idx) => {
            const url = URL.createObjectURL(file);
            if (file.type.startsWith("image/")) {
              return (
                <img
                  key={idx}
                  src={url}
                  alt={file.name}
                  className="rounded-xl object-cover h-32 w-full border border-gray-300 dark:border-gray-600"
                />
              );
            } else {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl p-3"
                >
                  📄 {file.name}
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};

export default CreatePost;
