// pages/OrdersPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { 
  Visibility as ViewIcon, 
  LocalShipping as TrackIcon,
  ShoppingCart as ReorderIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { orderService, type Order } from '../services/orderService';
import { useUserContext } from '../context/UserContext';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useUserContext();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const filters: any = {
        page,
        limit,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const response = await orderService.getUserOrders(token!, filters);
      
      if (response.success && response.orders) {
        setOrders(response.orders);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        setError(response.error || 'Failed to fetch orders');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
      refunded: 'default',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: any = {
      pending: 'warning',
      paid: 'success',
      failed: 'error',
      refunded: 'default',
      partially_refunded: 'warning',
    };
    return colors[status] || 'default';
  };

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    setError('');
    try {
      const response = await orderService.reorder(token!, orderId);
      if (response.success) {
        navigate('/cart');
      } else {
        setError(response.message || response.error || 'Failed to reorder');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reorder');
    } finally {
      setReorderingId(null);
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
                📦 My Orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and manage your orders
              </Typography>
            </Box>
          </Box>

          {/* Filters */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Orders</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Orders Table */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You haven't placed any orders yet
              </Typography>
              <Button variant="contained" onClick={() => navigate('/market')}>
                Start Shopping
              </Button>
            </Paper>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order Number</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {order.order_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(order.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {order.item_count || order.items?.length || 0} items
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            ${Number(order.total_amount).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.status.toUpperCase()}
                            size="small"
                            color={getStatusColor(order.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.payment_status.toUpperCase()}
                            size="small"
                            color={getPaymentStatusColor(order.payment_status)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ViewIcon />}
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              View
                            </Button>
                            {order.tracking_number && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<TrackIcon />}
                                onClick={() => navigate(`/orders/${order.id}/track`)}
                              >
                                Track
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<ReorderIcon />}
                              onClick={() => handleReorder(order.id)}
                              disabled={reorderingId === order.id}
                            >
                              {reorderingId === order.id ? 'Adding...' : 'Reorder'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Box>

        <RightSidebar />
      </Box>

      <BottomNav />
    </>
  );
};

export default OrdersPage;
