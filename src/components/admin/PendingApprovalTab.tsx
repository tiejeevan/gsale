import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CardMedia,
  Divider,
  Stack,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Info as InfoIcon,
  Store as StoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { productsService, type Product } from '../../services/productsService';

interface PendingApprovalTabProps {
  token: string;
  onApprove: (productId: string) => void;
  onReject: (productId: string) => void;
  onView: (productId: string) => void;
}

const PendingApprovalTab: React.FC<PendingApprovalTabProps> = ({
  token,
  onApprove,
  onReject,
  onView,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Confirmation dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productsService.getPendingProducts(token, 1, 50);
      if (response.success) {
        setProducts(response.products);
      } else {
        setError(response.error || 'Failed to fetch pending products');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending products');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (product: Product) => {
    setSelectedProduct(product);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (product: Product) => {
    setSelectedProduct(product);
    setRejectDialogOpen(true);
    setRejectReason('');
  };

  const handleApproveConfirm = async () => {
    if (!selectedProduct) return;
    
    setActionLoading(selectedProduct.id);
    setApproveDialogOpen(false);
    
    await onApprove(selectedProduct.id);
    await fetchPendingProducts();
    
    setActionLoading(null);
    setSelectedProduct(null);
  };

  const handleRejectConfirm = async () => {
    if (!selectedProduct) return;
    
    setActionLoading(selectedProduct.id);
    setRejectDialogOpen(false);
    
    await onReject(selectedProduct.id);
    await fetchPendingProducts();
    
    setActionLoading(null);
    setSelectedProduct(null);
    setRejectReason('');
  };

  const getProductImage = (product: Product) => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (products.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Products Pending Approval
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All products have been reviewed
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Products Awaiting Approval ({products.length})
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={fetchPendingProducts}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="180"
                image={getProductImage(product)}
                alt={product.title}
                sx={{ objectFit: 'cover', bgcolor: 'grey.200' }}
              />
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {product.title}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {product.short_description || product.description}
                </Typography>

                <Stack spacing={1} mb={2}>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`$${Number(product.price).toFixed(2)}`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={`Stock: ${product.stock_quantity}`}
                      size="small"
                      variant="outlined"
                    />
                    {product.category_name && (
                      <Chip
                        label={product.category_name}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Stack>

                <Divider sx={{ my: 1 }} />

                <Stack spacing={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {product.owner_type === 'Store' ? <StoreIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                    <Typography variant="caption" color="text.secondary">
                      {product.owner_type}: {product.owner_id}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    SKU: {product.sku || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Brand: {product.brand || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Submitted: {new Date(product.created_at).toLocaleDateString()} at {new Date(product.created_at).toLocaleTimeString()}
                  </Typography>
                </Stack>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => onView(product.id)}
                  disabled={actionLoading === product.id}
                >
                  Details
                </Button>
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<RejectIcon />}
                    onClick={() => handleRejectClick(product)}
                    disabled={actionLoading === product.id}
                  >
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={() => handleApproveClick(product)}
                    disabled={actionLoading === product.id}
                  >
                    Approve
                  </Button>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Product</DialogTitle>
        <DialogContent>
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
            This will make the product visible in the marketplace and mark it as verified.
          </Alert>
          {selectedProduct && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Product: {selectedProduct.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Price: ${Number(selectedProduct.price).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stock: {selectedProduct.stock_quantity} units
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleApproveConfirm} 
            variant="contained" 
            color="success"
            startIcon={<ApproveIcon />}
          >
            Confirm Approval
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Product</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will archive the product and prevent it from being listed in the marketplace.
          </Alert>
          {selectedProduct && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Product: {selectedProduct.title}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Rejection (Optional)"
            placeholder="Provide feedback to the seller..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectConfirm} 
            variant="contained" 
            color="error"
            startIcon={<RejectIcon />}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingApprovalTab;
