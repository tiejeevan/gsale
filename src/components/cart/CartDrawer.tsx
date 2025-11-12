// components/cart/CartDrawer.tsx
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Receipt as OrdersIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { cartItems, totalAmount, loading, error, updateQuantity, removeItem, refreshCart } = useCart();

  // Refresh cart when drawer opens
  React.useEffect(() => {
    if (open) {
      refreshCart();
    }
  }, [open]);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    onClose();
    navigate('/cart');
  };

  const handleViewOrders = () => {
    onClose();
    navigate('/orders');
  };

  const getProductImage = (item: any) => {
    if (item.product_images && Array.isArray(item.product_images) && item.product_images.length > 0) {
      return item.product_images[0];
    }
    return 'https://via.placeholder.com/80x80?text=No+Image';
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CartIcon />
            <Typography variant="h6">Shopping Cart</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* Cart Items */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : cartItems.length === 0 ? (
            <Box textAlign="center" py={4}>
              <CartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your cart is empty
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add some products to get started
              </Typography>
            </Box>
          ) : (
            <List>
              {cartItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <Divider sx={{ my: 2 }} />}
                  <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                      {/* Product Image */}
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

                      {/* Product Details */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {item.product_title}
                        </Typography>
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                          ${Number(item.price).toFixed(2)}
                        </Typography>

                        {/* Quantity Controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                          <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock_quantity}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(item.id)}
                            sx={{ ml: 'auto' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {/* Stock Warning */}
                        {item.stock_quantity < 5 && (
                          <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                            Only {item.stock_quantity} left in stock
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {cartItems.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  ${Number(totalAmount).toFixed(2)}
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCheckout}
                sx={{ mb: 1 }}
              >
                Proceed to Checkout
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleViewCart}
                sx={{ mb: 1 }}
              >
                View Cart
              </Button>
            </>
          ) : null}
          <Button
            fullWidth
            variant="text"
            size="medium"
            startIcon={<OrdersIcon />}
            onClick={handleViewOrders}
            sx={{ mt: cartItems.length > 0 ? 0 : 0 }}
          >
            View Order History
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CartDrawer;
