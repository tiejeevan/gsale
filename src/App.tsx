import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthContext } from "./context/AuthContext";
import Discover from "./pages/Discover";

function App() {
  const { token } = useContext(AuthContext)!;

  return (
    <Routes>
      {/* Root path redirects based on login state */}
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />

      {/* Public routes */}
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Signin />} />
      <Route path="/signup" element={token ? <Navigate to="/dashboard" /> : <Signup />} />

      {/* Protected route */}
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

      {/* Catch-all route: redirect unknown paths to root */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
