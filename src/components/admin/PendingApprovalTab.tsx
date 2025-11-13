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
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { productsService, type Product } from '../../services/productsService';

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

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

  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split('/').pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  const getProductImage = (product: Product) => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return getPublicUrl(product.images[0]);
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

      <Grid container spacing={2}>
        {products.map((product) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
              <CardMedia
                component="img"
                height="160"
                image={getProductImage(product)}
                alt={product.title}
                sx={{ objectFit: 'cover', bgcolor: 'grey.200' }}
              />
              
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.5em' }}>
                  {product.title}
                </Typography>
                
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1.5,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '2.5em',
                  }}
                >
                  {product.short_description || product.description}
                </Typography>

                <Box display="flex" gap={0.5} mb={1.5} flexWrap="wrap">
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
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {product.owner_type === 'Store' ? '🏪' : '👤'} {product.owner_type}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    📅 {new Date(product.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 1.5, pt: 0, flexDirection: 'column', gap: 1 }}>
                <Box display="flex" gap={1} width="100%">
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleRejectClick(product)}
                    disabled={actionLoading === product.id}
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                  >
                    Reject
                  </Button>
                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => handleApproveClick(product)}
                    disabled={actionLoading === product.id}
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                  >
                    Approve
                  </Button>
                </Box>
                <Button
                  fullWidth
                  size="small"
                  startIcon={<ViewIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onView(product.id)}
                  disabled={actionLoading === product.id}
                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                >
                  View Details
                </Button>
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
