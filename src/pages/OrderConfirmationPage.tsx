// pages/OrderConfirmationPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService, type Order } from '../services/orderService';
import { useUserContext } from '../context/UserContext';
import { useCart } from '../context/CartContext';

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { token } = useUserContext();
  const { refreshCart } = useCart();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId && token) {
      fetchOrder();
      // Refresh cart to clear it after order
      refreshCart();
    }
  }, [orderId, token]);

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getOrder(token!, orderId!);
      if (response.success && response.order) {
        setOrder(response.order);
      } else {
        setError(response.error || 'Failed to fetch order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: 3 }}>
          <Alert severity="error">{error || 'Order not found'}</Alert>
          <Button variant="contained" onClick={() => navigate('/market')} sx={{ mt: 2 }}>
            Back to Market
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 3 }}>
        {/* Success Header */}
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
          <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Order Confirmed!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Thank you for your purchase. Your order has been received.
          </Typography>
          <Chip
            label={`Order #${order.order_number}`}
            color="primary"
            sx={{ fontWeight: 600, fontSize: '1.1rem', py: 2 }}
          />
        </Paper>

        {/* Order Details */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Order Details
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Order Number:</Typography>
            <Typography variant="body2" fontWeight={600}>{order.order_number}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Order Date:</Typography>
            <Typography variant="body2" fontWeight={600}>
              {new Date(order.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Status:</Typography>
            <Chip label={order.status.toUpperCase()} size="small" color="primary" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Payment Status:</Typography>
            <Chip label={order.payment_status.toUpperCase()} size="small" color="warning" />
          </Box>
        </Paper>

        {/* Shipping Address */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ShippingIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Shipping Address
            </Typography>
          </Box>
          <Typography variant="body2">{order.shipping_address.name}</Typography>
          <Typography variant="body2">{order.shipping_address.address}</Typography>
          <Typography variant="body2">
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
          </Typography>
          <Typography variant="body2">{order.shipping_address.country}</Typography>
          <Typography variant="body2">{order.shipping_address.phone}</Typography>
        </Paper>

        {/* Order Items */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ReceiptIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Order Items
            </Typography>
          </Box>
          <List>
            {order.items?.map((item) => (
              <ListItem key={item.id} sx={{ px: 0, py: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {item.product_title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Quantity: {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    ${Number(item.subtotal).toFixed(2)}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Subtotal:</Typography>
            <Typography variant="body2">${Number(order.subtotal).toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Shipping:</Typography>
            <Typography variant="body2">${Number(order.shipping_amount).toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Tax:</Typography>
            <Typography variant="body2">${Number(order.tax_amount).toFixed(2)}</Typography>
          </Box>
          {order.discount_amount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="success.main">Discount:</Typography>
              <Typography variant="body2" color="success.main">
                -${Number(order.discount_amount).toFixed(2)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={700}>Total:</Typography>
            <Typography variant="h6" color="primary" fontWeight={700}>
              ${Number(order.total_amount).toFixed(2)}
            </Typography>
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/orders')}
          >
            View All Orders
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/market')}
          >
            Continue Shopping
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderConfirmationPage;
