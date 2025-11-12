import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Restore as RestoreIcon,
  Inventory as StockIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useUserContext } from '../../context/UserContext';
import { productsService, type Product } from '../../services/productsService';
import ProductFormDialog from './ProductFormDialog';
import ProductViewDialog from './ProductViewDialog';
import CategoryManagement from './CategoryManagement';
import StockUpdateDialog from './StockUpdateDialog';
import PendingApprovalTab from './PendingApprovalTab';

interface ProductStats {
  total_products: number;
  active_products: number;
  pending_products: number;
  draft_products: number;
  sold_products: number;
  deleted_products: number;
  featured_products: number;
  categories_used: number;
  average_price: number;
  total_stock: number;
  total_views: number;
  total_sales: number;
}

const AdminProductsController: React.FC = () => {
  const { token } = useUserContext();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  
  // Categories for filter
  const [categories, setCategories] = useState<any[]>([]);
  
  // Dialogs
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productViewOpen, setProductViewOpen] = useState(false);
  const [stockUpdateOpen, setStockUpdateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    fetchStats();
    fetchProducts();
    fetchCategories();
  }, [page, rowsPerPage, statusFilter, categoryFilter, showDeleted, showFeaturedOnly]);
  
  const fetchCategories = async () => {
    try {
      const response = await productsService.getCategories(token!, false);
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await productsService.getProductStats(token!);
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      };
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category_id = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      if (showDeleted) params.include_deleted = 'true';
      if (showFeaturedOnly) params.is_featured = 'true';

      console.log('Fetching products with params:', params);
      const response = await productsService.getProducts(token!, params);
      console.log('Fetch response:', response.success, 'Products count:', response.products?.length);
      
      if (response.success) {
        setProducts(response.products);
        setTotalProducts(response.pagination.total);
      } else {
        setError(response.error || 'Failed to fetch products');
      }
    } catch (err: any) {
      console.error('Fetch products error:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchProducts();
  };

  const handleApprove = async (productId: string) => {
    try {
      const response = await productsService.approveProduct(token!, productId);
      if (response.success) {
        setSuccess('Product approved successfully');
        fetchProducts();
        fetchStats();
      } else {
        setError(response.error || 'Failed to approve product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve product');
    }
  };

  const handleReject = async (productId: string) => {
    try {
      const response = await productsService.rejectProduct(token!, productId);
      if (response.success) {
        setSuccess('Product rejected successfully');
        fetchProducts();
        fetchStats();
      } else {
        setError(response.error || 'Failed to reject product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject product');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await productsService.deleteProduct(token!, productId);
      if (response.success) {
        setSuccess('Product deleted successfully');
        fetchProducts();
        fetchStats();
      } else {
        setError(response.error || 'Failed to delete product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    }
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedProduct(null);
    setProductFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setFormMode('edit');
    setSelectedProduct(product);
    setProductFormOpen(true);
  };

  const handleOpenView = (productId: string) => {
    setSelectedProduct(products.find(p => p.id === productId) || null);
    setProductViewOpen(true);
  };

  const handleOpenStock = (product: Product) => {
    setSelectedProduct(product);
    setStockUpdateOpen(true);
  };

  const handleSuccess = () => {
    fetchProducts();
    fetchStats();
    setSuccess('Operation completed successfully');
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      console.log('Toggling featured for product:', product.id, 'Current:', product.is_featured);
      const response = await productsService.updateProduct(
        token!,
        product.id,
        { is_featured: !product.is_featured }
      );
      console.log('Toggle response:', response);
      if (response.success) {
        setSuccess(`Product ${!product.is_featured ? 'marked as featured' : 'removed from featured'}`);
        // Update the product in the local state immediately
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === product.id ? { ...p, is_featured: !p.is_featured } : p
          )
        );
        // Also fetch fresh data
        await fetchStats();
      } else {
        setError(response.error || 'Failed to toggle featured status');
      }
    } catch (err: any) {
      console.error('Toggle featured error:', err);
      setError(err.message || 'Failed to toggle featured status');
    }
  };

  const handleRestore = async (productId: string) => {
    if (!window.confirm('Are you sure you want to restore this product?')) return;
    
    try {
      const response = await productsService.restoreProduct(token!, productId);
      if (response.success) {
        setSuccess('Product restored successfully');
        fetchProducts();
        fetchStats();
      } else {
        setError(response.error || 'Failed to restore product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to restore product');
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

  return (
    <Box>
      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Products
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.total_products}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.deleted_products} deleted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active / Draft
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {stats.active_products}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.draft_products} drafts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pending / Featured
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {stats.pending_products}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.featured_products} featured
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Stock / Sold
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {stats.total_stock}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.sold_products} sold
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Avg Price
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  ${Number(stats.average_price).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Views
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.total_views.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Sales
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.total_sales}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Categories
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.categories_used}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="All Products" />
          <Tab label="Pending Approval" />
          <Tab label="Categories" />
        </Tabs>
      </Box>

      {/* Tab 0: All Products */}
      {activeTab === 0 && (
        <Box>
          {/* Filters and Actions */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              sx={{ minWidth: 300 }}
            />
            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name} ({cat.product_count})
                </MenuItem>
              ))}
            </Select>
            <FormControlLabel
              control={
                <Switch
                  checked={showFeaturedOnly}
                  onChange={(e) => {
                    setShowFeaturedOnly(e.target.checked);
                    setPage(0);
                  }}
                  size="small"
                />
              }
              label="Featured Only"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showDeleted}
                  onChange={(e) => {
                    setShowDeleted(e.target.checked);
                    setPage(0);
                  }}
                  size="small"
                />
              }
              label="Show Deleted"
            />
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Refresh">
              <IconButton onClick={fetchProducts} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              color="primary"
              onClick={handleOpenCreate}
            >
              Add Product
            </Button>
          </Box>

          {/* Products Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU / Brand</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Featured</TableCell>
                  <TableCell align="right">Views / Sales</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const isDeleted = product.deleted_at != null;
                    return (
                    <TableRow 
                      key={product.id}
                      sx={{ 
                        bgcolor: isDeleted ? 'error.light' : 'inherit',
                        opacity: isDeleted ? 0.6 : 1
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {product.title}
                              {isDeleted && (
                                <Chip 
                                  label="DELETED" 
                                  size="small" 
                                  color="error" 
                                  sx={{ ml: 1 }} 
                                />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.slug}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{product.sku || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.brand || 'No brand'}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.category_name || '-'}</TableCell>
                      <TableCell align="right">${Number(product.price).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={Number(product.stock_quantity)}
                          size="small"
                          color={Number(product.stock_quantity) > 10 ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.status}
                          size="small"
                          color={getStatusColor(product.status)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={product.is_featured ? 'Remove from featured' : 'Mark as featured'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleFeatured(product)}
                            color={product.is_featured ? 'warning' : 'default'}
                          >
                            {product.is_featured ? (
                              <StarIcon />
                            ) : (
                              <StarBorderIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{product.views_count} views</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.sales_count} sales
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {isDeleted ? (
                            <>
                              <Tooltip title="Restore Product">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleRestore(product.id)}
                                >
                                  <RestoreIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenView(product.id)}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip title="View">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenView(product.id)}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenEdit(product)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Update Stock">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => handleOpenStock(product)}
                                >
                                  <StockIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {product.status === 'pending' && (
                                <>
                                  <Tooltip title="Approve">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleApprove(product.id)}
                                    >
                                      <ApproveIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleReject(product.id)}
                                    >
                                      <RejectIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalProducts}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        </Box>
      )}

      {/* Tab 1: Pending Approval */}
      {activeTab === 1 && (
        <PendingApprovalTab 
          token={token!}
          onApprove={handleApprove}
          onReject={handleReject}
          onView={handleOpenView}
        />
      )}

      {/* Tab 2: Categories */}
      {activeTab === 2 && (
        <CategoryManagement />
      )}

      {/* Dialogs */}
      <ProductFormDialog
        open={productFormOpen}
        onClose={() => setProductFormOpen(false)}
        onSuccess={handleSuccess}
        product={selectedProduct}
        mode={formMode}
      />

      <ProductViewDialog
        open={productViewOpen}
        onClose={() => setProductViewOpen(false)}
        productId={selectedProduct?.id || null}
        onEdit={handleOpenEdit}
      />

      <StockUpdateDialog
        open={stockUpdateOpen}
        onClose={() => setStockUpdateOpen(false)}
        onSuccess={handleSuccess}
        productId={selectedProduct?.id || null}
        productTitle={selectedProduct?.title || ''}
        currentStock={selectedProduct?.stock_quantity || 0}
      />
    </Box>
  );
};

export default AdminProductsController;
