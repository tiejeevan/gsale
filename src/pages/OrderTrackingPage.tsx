// pages/OrderTrackingPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  LocalShipping as ShippingIcon,
  Inventory as PackageIcon,
  Home as DeliveredIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useUserContext } from '../context/UserContext';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';

const OrderTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { token } = useUserContext();
  
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId && token) {
      fetchTracking();
    }
  }, [orderId, token]);

  const fetchTracking = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.trackOrder(token!, orderId!);
      if (response.success && response.tracking) {
        setTracking(response.tracking);
      } else {
        setError(response.error || 'Failed to fetch tracking information');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getActiveStep = (status: string) => {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckIcon />;
      case 'processing':
        return <PackageIcon />;
      case 'shipped':
        return <ShippingIcon />;
      case 'delivered':
        return <DeliveredIcon />;
      default:
        return <CheckIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tracking) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
          <Alert severity="error">{error || 'Tracking information not found'}</Alert>
          <Button variant="contained" onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
            Back to Orders
          </Button>
        </Box>
      </Box>
    );
  }

  const activeStep = getActiveStep(tracking.status);

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
              onClick={() => navigate(`/orders/${orderId}`)}
              sx={{ mb: 2 }}
            >
              Back to Order Details
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              📦 Track Your Order
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order #{tracking.order_number}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Main Tracking Info */}
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Current Status
                    </Typography>
                    <Chip 
                      label={tracking.status.toUpperCase()} 
                      color="primary" 
                      size="medium"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  {tracking.tracking_number && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        Tracking Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {tracking.tracking_number}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {tracking.shipping_method && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Shipping Method
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {tracking.shipping_method}
                    </Typography>
                  </Box>
                )}

                {/* Order Timeline */}
                <Stepper activeStep={activeStep} orientation="vertical">
                  <Step>
                    <StepLabel>Order Placed</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {tracking.created_at ? new Date(tracking.created_at).toLocaleString() : 'N/A'}
                      </Typography>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepLabel>Order Confirmed</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {tracking.confirmed_at ? new Date(tracking.confirmed_at).toLocaleString() : 'Pending confirmation'}
                      </Typography>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepLabel>Processing</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        Your order is being prepared for shipment
                      </Typography>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepLabel>Shipped</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {tracking.shipped_at ? new Date(tracking.shipped_at).toLocaleString() : 'Not yet shipped'}
                      </Typography>
                    </StepContent>
                  </Step>
                  
                  <Step>
                    <StepLabel>Delivered</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {tracking.delivered_at ? new Date(tracking.delivered_at).toLocaleString() : 'Estimated delivery pending'}
                      </Typography>
                    </StepContent>
                  </Step>
                </Stepper>
              </Paper>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/orders/${orderId}`)}
              >
                View Full Order Details
              </Button>
            </Box>

            {/* Status History Sidebar */}
            <Box sx={{ width: { xs: '100%', md: 350 } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Status Updates
                </Typography>
                {tracking.status_history && tracking.status_history.length > 0 ? (
                  <Box>
                    {tracking.status_history.map((history: any, index: number) => (
                      <Box 
                        key={history.id} 
                        sx={{ 
                          mb: 2, 
                          pb: 2, 
                          borderBottom: index < tracking.status_history.length - 1 ? 1 : 0,
                          borderColor: 'divider'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {getStatusIcon(history.new_status)}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {history.new_status.toUpperCase()}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(history.created_at).toLocaleString()}
                        </Typography>
                        {history.notes && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {history.notes}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No status updates available
                  </Typography>
                )}
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

export default OrderTrackingPage;
