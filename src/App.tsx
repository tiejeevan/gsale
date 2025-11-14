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
import BookmarksPage from "./pages/BookmarksPage";
import { useUserContext } from "./context/UserContext";
import { NotificationsProvider } from "./NotificationsContext";
import { ChatProvider } from "./context/ChatContext";
import { CartProvider } from "./context/CartContext";
import { GamificationProvider } from "./context/GamificationContext";
import Navbar from "./pages/Navbar";
import MessagesTab from "./components/chat/MessagesTab";
import BadgesPage from "./components/gamification/BadgesPage";
import LeaderboardPage from "./components/gamification/LeaderboardPage";
import AdminGamificationDashboard from "./components/gamification/AdminGamificationDashboard";
import GamificationProfile from "./components/gamification/GamificationProfile";
import XPNotificationToast from "./components/XPNotificationToast";

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
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gamification/profile"
            element={
              <ProtectedRoute>
                <div className="max-w-4xl mx-auto p-6">
                  <GamificationProfile />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gamification/badges"
            element={
              <ProtectedRoute>
                <BadgesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gamification/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/gamification"
            element={
              <ProtectedRoute>
                <AdminGamificationDashboard />
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

// =================== Full App with Notifications, Chat, Cart, and Gamification Context ===================
function App() {
  return (
    <NotificationsProvider>
      <ChatProvider>
        <CartProvider>
          <GamificationProvider>
            <AppContent />
            <XPNotificationToast />
          </GamificationProvider>
        </CartProvider>
      </ChatProvider>
    </NotificationsProvider>
  );
}

export default App;