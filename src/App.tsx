import { useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./context/AuthContext";
import Discover from "./pages/Discover";
import { socket } from "./socket";

function App() {
  const { token, user } = useContext(AuthContext)!; // make sure 'user' object exists in context

  // ================= Socket.IO connection =================
  useEffect(() => {
    if (!token || !user) return;

    // Connect socket
    socket.connect();

    // Join user-specific room
    socket.emit("join", `user_${user.id}`);
    console.log(`Socket connected for user_${user.id}`);

    // Optional: Listen to notifications (can move to notification component later)
    socket.on("new_comment", (comment) => {
      console.log("New comment received:", comment);
      // TODO: Update UI or show toast notification
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log("Socket disconnected");
    };
  }, [token, user]);

  return (
    <Routes>
      {/* Root path redirects based on login state */}
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />

      {/* Public routes */}
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" /> : <Signin />}
      />
      <Route
        path="/signup"
        element={token ? <Navigate to="/dashboard" /> : <Signup />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discover"
        element={
          <ProtectedRoute>
            <Discover />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
