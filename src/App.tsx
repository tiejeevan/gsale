// App.tsx
import { useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./context/AuthContext";
import { NotificationsProvider, useNotifications } from "./NotificationsContext";
import { socket } from "./socket";
import Navbar from "./pages/Navbar"; // optional navbar

function AppContent() {
  const { token, user, loading } = useContext(AuthContext)!;
  const { addNotification } = useNotifications();

  // Wait until auth context initializes
  if (loading) return null; // Or <LoadingSpinner />

  // ================= Socket.IO connection =================
  useEffect(() => {
    if (!token || !user) return;

    // Connect socket
    socket.connect();

    // Join user-specific room
    socket.emit("join", `user_${user.id}`);
    console.log(`Socket connected for user_${user.id}`);

    // Listen to real-time notifications
    const handleNotification = (notif: any) => {
      console.log("New notification:", notif);
      addNotification(notif);
    };

    const handleComment = (comment: any) => {
      console.log("New comment received:", comment);
    };

    socket.on("notification:new", handleNotification);
    socket.on("post:comment:new", handleComment);

    // Cleanup on unmount
    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("post:comment:new", handleComment);
      socket.disconnect();
      console.log("Socket disconnected");
    };
  }, [token, user, addNotification]);

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Routes */}
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <Signin />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/dashboard" replace /> : <Signup />}
        />

        {/* Protected Routes */}
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

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// =================== Full App with Notifications Context ===================
function App() {
  return (
    <NotificationsProvider>
      <AppContent />
    </NotificationsProvider>
  );
}

export default App;
