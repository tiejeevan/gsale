import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import { ShoppingBagIcon, UserIcon } from "@heroicons/react/24/outline";


const Signin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const { setToken } = useUserContext();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Signin failed");
        return;
      }

      setToken(data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="flex flex-col md:flex-row w-full max-w-4xl shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-gray-800">
        {/* Left side - branding */}
        <div className="md:w-1/2 bg-indigo-500 dark:bg-indigo-600 flex flex-col items-center justify-center p-8 space-y-4">
          <ShoppingBagIcon className="w-20 h-20 text-white" />
          <h1 className="text-white text-4xl font-bold">Gsale</h1>
          <p className="text-indigo-100 text-center text-lg">
            Buy, sell, and discover amazing garage sale deals in your area.
          </p>
        </div>

        {/* Right side - form */}
        <div className="md:w-1/2 p-8 space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center">
            Sign In
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <UserIcon className="absolute top-3 left-3 w-5 h-5 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg transition-transform transform hover:scale-105"
            >
              Sign In
            </button>
          </form>

          {message && (
            <p className="text-center text-red-500 font-medium">{message}</p>
          )}

          <p className="text-center text-gray-600 dark:text-gray-300">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-indigo-500 hover:underline font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signin;
