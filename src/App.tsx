import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTestDashboard from "./pages/AdminTestDashboard";
import ProductsTestPage from "./pages/ProductsTestPage";
import DatabaseGUI from "./pages/DatabaseGUI";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import MarketPage from "./pages/MarketPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SellProductPage from "./pages/SellProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import { useUserContext } from "./context/UserContext";
import { NotificationsProvider } from "./NotificationsContext";
import { ChatProvider } from "./context/ChatContext";
import { CartProvider } from "./context/CartContext";
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
          <Route
            path="/admin/products-test"
            element={
              <ProtectedRoute>
                <ProductsTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/market"
            element={
              <ProtectedRoute>
                <MarketPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/market/product/:productId"
            element={
              <ProtectedRoute>
                <ProductDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sell"
            element={
              <ProtectedRoute>
                <SellProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId/track"
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
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

// =================== Full App with Notifications, Chat, and Cart Context ===================
function App() {
  return (
    <NotificationsProvider>
      <ChatProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </ChatProvider>
    </NotificationsProvider>
  );
}

export default App;