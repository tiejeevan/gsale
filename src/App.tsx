import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import { useUserContext } from "./context/UserContext";
import { NotificationsProvider } from "./NotificationsContext";
import Navbar from "./pages/Navbar";

function AppContent() {
  const { token, isLoading } = useUserContext();

  return (
    <>
      {/* Navbar with NotificationsBell */}
      <Navbar>

      </Navbar>

      {/* Routes */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
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
          <Route
            path="/profile/:userId?"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/:postId"
            element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
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