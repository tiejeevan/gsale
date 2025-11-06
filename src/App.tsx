import { useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Discover from "./pages/Discover";
import { AuthContext } from "./context/AuthContext";
import { NotificationsProvider, useNotifications } from "./NotificationsContext";
import { socket } from "./socket";
// import NotificationsBell from "./components/NotificationsBell"; // top menu bell component
import Navbar from "./pages/Navbar"; // optional: navbar where bell will live

function AppContent() {
  const { token, user } = useContext(AuthContext)!;
  const { addNotification } = useNotifications();

  // ================= Socket.IO connection =================
  useEffect(() => {
    if (!token || !user) return;

    // Connect socket
    socket.connect();

    // Join user-specific room
    socket.emit("join", `user_${user.id}`);
    console.log(`Socket connected for user_${user.id}`);

    // Listen to real-time notifications
    socket.on("notification:new", (notif) => {
      console.log("New notification:", notif);
      addNotification(notif); // Add to context state
    });

    // Listen to other events if needed (optional)
    socket.on("post:comment:new", (comment) => {
      console.log("New comment received:", comment);
      // You can also push toast here if desired
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log("Socket disconnected");
    };
  }, [token, user, addNotification]);

  return (
    <>
      {/* Navbar with NotificationsBell */}
      <Navbar>

      </Navbar>

      {/* Routes */}
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" /> : <Signin />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/dashboard" /> : <Signup />}
        />
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
        <Route path="*" element={<Navigate to="/login" />} />
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