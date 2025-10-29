import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { UserIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

const Signup: React.FC = () => {
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext)!;
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Signup failed");
        return;
      }

      setAuth(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-6 transition-colors duration-300">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
          Create your Gsale Account
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          Buy, sell, and discover amazing garage sale items in your area.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex space-x-4">
            <div className="relative w-1/2">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="First Name"
                value={first_name}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative w-1/2">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="Last Name"
                value={last_name}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="relative">
            <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-300" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-300" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-md transition-all duration-200 transform hover:scale-105"
          >
            Sign Up
          </button>
        </form>

        {message && <p className="text-center text-red-500">{message}</p>}

        <p className="text-center text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-500 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
