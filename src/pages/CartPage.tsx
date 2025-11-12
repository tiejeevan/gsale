// pages/CartPage.tsx
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, totalAmount, loading, error, updateQuantity, removeItem, clearCart, refreshCart } = useCart();

  // Refresh cart on mount
  React.useEffect(() => {
    refreshCart();
  }, []);

  const getProductImage = (item: any) => {
    if (item.product_images && Array.isArray(item.product_images) && item.product_images.length > 0) {
      return item.product_images[0];
    }
    return 'https://via.placeholder.com/100x100?text=No+Image';
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <LeftSidebar />

        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: { lg: '1200px', xl: '1400px' },
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
            pb: { xs: 10, lg: 3 },
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                🛒 Shopping Cart
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/market')}
            >
              Continue Shopping
            </Button>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : cartItems.length === 0 ? (
            /* Empty Cart */
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <CartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Your cart is empty
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Add some products to get started
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/market')}
              >
                Browse Products
              </Button>
            </Paper>
          ) : (
            /* Cart with Items */
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Cart Items Table */}
              <Box sx={{ flex: 1 }}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Price</TableCell>
                        <TableCell align="center">Quantity</TableCell>
                        <TableCell align="center">Subtotal</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cartItems.map((item) => (
                        <TableRow key={item.id}>
                          {/* Product */}
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Box
                                component="img"
                                src={getProductImage(item)}
                                alt={item.product_title}
                                sx={{
                                  width: 80,
                                  height: 80,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  bgcolor: 'grey.200',
                                }}
                              />
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {item.product_title}
                                </Typography>
                                {item.stock_quantity < 5 && (
                                  <Typography variant="caption" color="warning.main">
                                    Only {item.stock_quantity} left
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Price */}
                          <TableCell align="center">
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              ${Number(item.price).toFixed(2)}
                            </Typography>
                          </TableCell>

                          {/* Quantity */}
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateQuantity(item.id, item.quantity - 1);
                                  }
                                }}
                                disabled={item.quantity <= 1}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography variant="body1" sx={{ minWidth: 40, textAlign: 'center' }}>
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock_quantity}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>

                          {/* Subtotal */}
                          <TableCell align="center">
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              ${Number(item.subtotal).toFixed(2)}
                            </Typography>
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              onClick={() => removeItem(item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Clear Cart Button */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </Button>
                </Box>
              </Box>

              {/* Order Summary */}
              <Box sx={{ width: { xs: '100%', md: 350 } }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Order Summary
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Subtotal:</Typography>
                      <Typography variant="body2">${Number(totalAmount).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Shipping:</Typography>
                      <Typography variant="body2">Calculated at checkout</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Tax:</Typography>
                      <Typography variant="body2">Calculated at checkout</Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Total:
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      ${Number(totalAmount).toFixed(2)}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/checkout')}
                    sx={{ mb: 1 }}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/market')}
                  >
                    Continue Shopping
                  </Button>
                </Paper>
              </Box>
            </Box>
          )}
        </Box>

        <RightSidebar />
      </Box>

      <BottomNav />
    </>
  );
};

export default CartPage;
