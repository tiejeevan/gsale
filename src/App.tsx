import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTestDashboard from "./pages/AdminTestDashboard";
import DatabaseGUI from "./pages/DatabaseGUI";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import NewsPage from "./pages/NewsPage";
import NewsArticleDetail from "./pages/NewsArticleDetail";
import { useUserContext } from "./context/UserContext";
import { NotificationsProvider } from "./NotificationsContext";
import { ChatProvider } from "./context/ChatContext";
import Navbar from "./pages/Navbar";
import MessagesTab from "./components/chat/MessagesTab";

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
        <>
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
          <Route
            path="/news/:category"
            element={
              <ProtectedRoute>
                <NewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news/:category/:articleIndex"
            element={
              <ProtectedRoute>
                <NewsArticleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tests"
            element={
              <ProtectedRoute>
                <AdminTestDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/database"
            element={
              <ProtectedRoute>
                <DatabaseGUI />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>

        {/* Messages Tab - Show only when logged in */}
        {token && <MessagesTab />}
        </>
      )}
    </>
  );
}

// =================== Full App with Notifications and Chat Context ===================
function App() {
  return (
    <NotificationsProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </NotificationsProvider>
  );
}

export default App;