import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUserContext } from "./context/UserContext";
import { NotificationsProvider } from "./NotificationsContext";
import { ChatProvider } from "./context/ChatContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./pages/Navbar";
import MessagesTab from "./components/chat/MessagesTab";

// Lazy load all page components
const Signup = lazy(() => import("./pages/Signup"));
const Signin = lazy(() => import("./pages/Signin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminTestDashboard = lazy(() => import("./pages/AdminTestDashboard"));
const ProductsTestPage = lazy(() => import("./pages/ProductsTestPage"));
const DatabaseGUI = lazy(() => import("./pages/DatabaseGUI"));
const Profile = lazy(() => import("./pages/Profile"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const MarketPage = lazy(() => import("./pages/MarketPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const SellProductPage = lazy(() => import("./pages/SellProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-lg">Loading...</div>
  </div>
);

function AppContent() {
  const { token, isLoading } = useUserContext();

  return (
    <>
      {/* Navbar with NotificationsBell */}
      <Navbar>

      </Navbar>

      {/* Routes */}
      {isLoading ? (
        <LoadingFallback />
      ) : (
        <>
          <Suspense fallback={<LoadingFallback />}>
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
            path="/adminin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Suspense>

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