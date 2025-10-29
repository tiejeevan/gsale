import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const { setAuth } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const API_URL = "https://gsaleback.onrender.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Signup failed");
        return;
      }

      // Save user and token in context & localStorage
      setAuth(data.user, data.token);

      setMessage("Signup successful!");
      setName("");
      setEmail("");
      setPassword("");

      // Redirect to Dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 transition-colors duration-300">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center">
          Sign Up
        </h2>

        {message && (
          <p className="text-center text-red-500 dark:text-red-400 font-medium animate-pulse">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 transition-colors duration-200"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 transition-colors duration-200"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 transition-colors duration-200"
          />

          <button
            type="submit"
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
