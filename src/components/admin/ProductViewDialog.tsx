import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  ShoppingCart as SalesIcon,
} from '@mui/icons-material';
import { useUserContext } from '../../context/UserContext';
import { productsService, type Product } from '../../services/productsService';

interface ProductViewDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string | null;
  onEdit?: (product: Product) => void;
}

const ProductViewDialog: React.FC<ProductViewDialogProps> = ({
  open,
  onClose,
  productId,
  onEdit
}) => {
  const { token } = useUserContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && productId) {
      fetchProduct();
    }
  }, [open, productId]);

  const fetchProduct = async () => {
    if (!productId) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await productsService.getProductById(token!, productId);
      if (response.success) {
        setProduct(response.product);
      } else {
        setError(response.error || 'Failed to fetch product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'draft': return 'default';
      case 'sold': return 'info';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  const handleEdit = () => {
    if (product && onEdit) {
      onEdit(product);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Product Details</Typography>
          <Box>
            {product && onEdit && (
              <IconButton onClick={handleEdit} size="small" sx={{ mr: 1 }}>
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : product ? (
          <Grid container spacing={3}>
            {/* Header Info */}
            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {product.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.slug}
                  </Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <Chip
                    label={product.status}
                    color={getStatusColor(product.status)}
                    size="small"
                  />
                  {product.is_featured && (
                    <Chip
                      icon={<StarIcon />}
                      label="Featured"
                      color="warning"
                      size="small"
                    />
                  )}
                  {product.is_verified && (
                    <Chip label="Verified" color="success" size="small" />
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Stats */}
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      ${Number(product.price).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Price
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Box textAlign="center">
                    <Typography variant="h6">{Number(product.stock_quantity)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      In Stock
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Box textAlign="center" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <ViewIcon fontSize="small" color="action" />
                    <Typography variant="h6">{Number(product.views_count)}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                    Views
                  </Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Box textAlign="center" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <SalesIcon fontSize="small" color="action" />
                    <Typography variant="h6">{Number(product.sales_count)}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                    Sales
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Description */}
            {product.short_description && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Short Description
                </Typography>
                <Typography variant="body2">{product.short_description}</Typography>
              </Grid>
            )}

            {product.description && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Full Description
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {product.description}
                </Typography>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Details Table */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Product Information
              </Typography>
              <Table size="small">
                <TableBody>
                  {product.sku && (
                    <TableRow>
                      <TableCell width="30%"><strong>SKU</strong></TableCell>
                      <TableCell>{product.sku}</TableCell>
                    </TableRow>
                  )}
                  {product.barcode && (
                    <TableRow>
                      <TableCell><strong>Barcode</strong></TableCell>
                      <TableCell>{product.barcode}</TableCell>
                    </TableRow>
                  )}
                  {product.category_name && (
                    <TableRow>
                      <TableCell><strong>Category</strong></TableCell>
                      <TableCell>{product.category_name}</TableCell>
                    </TableRow>
                  )}
                  {product.brand && (
                    <TableRow>
                      <TableCell><strong>Brand</strong></TableCell>
                      <TableCell>{product.brand}</TableCell>
                    </TableRow>
                  )}
                  {product.weight && (
                    <TableRow>
                      <TableCell><strong>Weight</strong></TableCell>
                      <TableCell>{product.weight} kg</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell><strong>Low Stock Alert</strong></TableCell>
                    <TableCell>{product.low_stock_threshold} units</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>

            {/* Pricing */}
            {(product.compare_at_price || product.cost_price) && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Pricing Details
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell width="30%"><strong>Current Price</strong></TableCell>
                        <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                      </TableRow>
                      {product.compare_at_price && (
                        <TableRow>
                          <TableCell><strong>Compare at Price</strong></TableCell>
                          <TableCell>
                            ${Number(product.compare_at_price).toFixed(2)}
                            <Chip
                              label={`${Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)}% OFF`}
                              size="small"
                              color="error"
                              sx={{ ml: 1 }}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                      {product.cost_price && (
                        <TableRow>
                          <TableCell><strong>Cost Price</strong></TableCell>
                          <TableCell>
                            ${Number(product.cost_price).toFixed(2)}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              (Profit: ${(Number(product.price) - Number(product.cost_price)).toFixed(2)})
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Grid>
              </>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Tags
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {product.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Box>
                </Grid>
              </>
            )}

            {/* Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Attributes
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      {product.attributes.map((attr, index) => (
                        <TableRow key={index}>
                          <TableCell width="30%"><strong>{attr.key}</strong></TableCell>
                          <TableCell>{attr.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
              </>
            )}

            {/* Media */}
            {product.media && product.media.length > 0 && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Media ({product.media.length})
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {product.media.map((media, index) => (
                      <Chip
                        key={index}
                        label={`${media.type} ${media.is_primary ? '(Primary)' : ''}`}
                        size="small"
                        color={media.is_primary ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>
                </Grid>
              </>
            )}

            {/* SEO */}
            {(product.seo_title || product.seo_description) && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    SEO Information
                  </Typography>
                  {product.seo_title && (
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        SEO Title
                      </Typography>
                      <Typography variant="body2">{product.seo_title}</Typography>
                    </Box>
                  )}
                  {product.seo_description && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        SEO Description
                      </Typography>
                      <Typography variant="body2">{product.seo_description}</Typography>
                    </Box>
                  )}
                </Grid>
              </>
            )}

            {/* Metadata */}
            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(product.created_at).toLocaleString()}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                Last Updated: {new Date(product.updated_at).toLocaleString()}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                Product ID: {product.id}
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Typography>No product data available</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {product && onEdit && (
          <Button onClick={handleEdit} variant="contained" startIcon={<EditIcon />}>
            Edit Product
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProductViewDialog;
