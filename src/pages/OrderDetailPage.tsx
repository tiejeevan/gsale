// pages/OrderDetailPage.tsx
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
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack as BackIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  ShoppingCart as ShoppingIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService, type Order } from '../services/orderService';
import { useUserContext } from '../context/UserContext';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';

const OrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { token } = useUserContext();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (orderId && token) {
      fetchOrder();
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

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    try {
      const response = await orderService.cancelOrder(token!, orderId!, 'Cancelled by customer');
      if (response.success) {
        fetchOrder(); // Refresh order
      } else {
        setError(response.message || response.error || 'Failed to cancel order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const canCancelOrder = (order: Order) => {
    return !['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status);
  };

  const handleReorder = async () => {
    setReordering(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await orderService.reorder(token!, orderId!);
      if (response.success) {
        setSuccessMessage('Items added to cart! You can now proceed to checkout.');
        setTimeout(() => {
          navigate('/cart');
        }, 2000);
      } else {
        setError(response.message || response.error || 'Failed to reorder');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reorder');
    } finally {
      setReordering(false);
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
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
          <Alert severity="error">{error || 'Order not found'}</Alert>
          <Button variant="contained" onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
            Back to Orders
          </Button>
        </Box>
      </Box>
    );
  }

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
          <Box sx={{ mb: 4 }}>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate('/orders')}
              sx={{ mb: 2 }}
            >
              Back to Orders
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Order Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order #{order.order_number}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Main Content */}
            <Box sx={{ flex: 1 }}>
              {/* Order Info */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Order Information
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Order Number:</Typography>
                  <Typography variant="body2" fontWeight={600}>{order.order_number}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Order Date:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(order.created_at).toLocaleString()}
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
                {order.tracking_number && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Tracking Number:</Typography>
                    <Typography variant="body2" fontWeight={600}>{order.tracking_number}</Typography>
                  </Box>
                )}
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
                    <ListItem key={item.id} sx={{ px: 0, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                        {item.product_image && (
                          <Box
                            component="img"
                            src={item.product_image}
                            alt={item.product_title}
                            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
                          />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {item.product_title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight={600}>
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
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                {canCancelOrder(order) && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    fullWidth
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<ShoppingIcon />}
                  onClick={handleReorder}
                  disabled={reordering}
                  fullWidth
                >
                  {reordering ? 'Adding to Cart...' : 'Reorder'}
                </Button>
              </Box>
            </Box>

            {/* Order Status History */}
            <Box sx={{ width: { xs: '100%', md: 350 } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Order History
                </Typography>
                <Timeline>
                  {order.status_history?.map((history, index) => (
                    <TimelineItem key={history.id}>
                      <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                        <Typography variant="caption">
                          {new Date(history.created_at).toLocaleDateString()}
                        </Typography>
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={index === 0 ? 'primary' : 'grey'} />
                        {index < (order.status_history?.length || 0) - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body2" fontWeight={600}>
                          {history.new_status.toUpperCase()}
                        </Typography>
                        {history.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {history.notes}
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Paper>
            </Box>
          </Box>
        </Box>

        <RightSidebar />
      </Box>

      <BottomNav />
    </>
  );
};

export default OrderDetailPage;
