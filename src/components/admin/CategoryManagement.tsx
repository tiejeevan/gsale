import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useUserContext } from '../../context/UserContext';
import { productsService, type Category } from '../../services/productsService';

const CategoryManagement: React.FC = () => {
  const { token } = useUserContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productsService.getCategories(token!, true);
      if (response.success) {
        setCategories(response.categories);
      } else {
        setError(response.error || 'Failed to fetch categories');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'create' | 'edit', category?: Category) => {
    setDialogMode(mode);
    if (mode === 'edit' && category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image_url: category.image_url || '',
        parent_id: category.parent_id || '',
        is_active: category.is_active,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        parent_id: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setError('');
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name' && dialogMode === 'create') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.name || !formData.slug) {
      setError('Name and slug are required');
      return;
    }

    try {
      // Clean up the data - convert empty strings to null for UUID fields
      const cleanedData = {
        ...formData,
        parent_id: formData.parent_id || null,
        image_url: formData.image_url || null,
      };

      let response;
      if (dialogMode === 'create') {
        response = await productsService.createCategory(token!, cleanedData);
      } else {
        response = await productsService.updateCategory(token!, selectedCategory!.id, cleanedData);
      }

      if (response.success) {
        setSuccess(`Category ${dialogMode === 'create' ? 'created' : 'updated'} successfully`);
        handleCloseDialog();
        fetchCategories();
      } else {
        setError(response.error || 'Failed to save category');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This will fail if products exist in this category.')) {
      return;
    }

    try {
      const response = await productsService.deleteCategory(token!, categoryId);
      if (response.success) {
        setSuccess('Category deleted successfully');
        fetchCategories();
      } else {
        setError(response.error || 'Failed to delete category');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const handleCreateRandomCategory = async () => {
    const categoryTypes = [
      'Electronics', 'Fashion', 'Home & Living', 'Sports & Outdoors', 
      'Books & Media', 'Toys & Games', 'Beauty & Health', 'Automotive',
      'Food & Beverages', 'Pet Supplies', 'Office Supplies', 'Garden & Tools',
      'Baby & Kids', 'Jewelry & Accessories', 'Art & Crafts', 'Music & Instruments'
    ];
    
    const subcategories: Record<string, string[]> = {
      'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Cameras', 'Audio', 'Gaming'],
      'Fashion': ['Men\'s Clothing', 'Women\'s Clothing', 'Shoes', 'Bags', 'Watches', 'Sunglasses'],
      'Home & Living': ['Furniture', 'Decor', 'Kitchen', 'Bedding', 'Lighting', 'Storage'],
      'Sports & Outdoors': ['Fitness', 'Camping', 'Cycling', 'Water Sports', 'Team Sports', 'Yoga'],
      'Books & Media': ['Fiction', 'Non-Fiction', 'Comics', 'Magazines', 'E-Books', 'Audiobooks'],
      'Toys & Games': ['Action Figures', 'Board Games', 'Puzzles', 'Educational', 'Outdoor Toys', 'Video Games'],
      'Beauty & Health': ['Skincare', 'Makeup', 'Haircare', 'Fragrances', 'Vitamins', 'Fitness Equipment'],
      'Automotive': ['Car Parts', 'Accessories', 'Tools', 'Oils & Fluids', 'Tires', 'Electronics'],
    };

    const randomType = categoryTypes[Math.floor(Math.random() * categoryTypes.length)];
    const timestamp = Date.now().toString().slice(-4);
    const name = `${randomType} ${timestamp}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const descriptions = [
      'Premium quality products for everyday use',
      'Top-rated items with excellent customer reviews',
      'Latest trends and best sellers in this category',
      'Curated collection of high-quality products',
      'Essential items for your lifestyle needs',
      'Discover amazing deals and new arrivals',
    ];

    const randomCategory = {
      name,
      slug,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      image_url: null,
      parent_id: null,
      is_active: true,
    };

    try {
      const response = await productsService.createCategory(token!, randomCategory);
      if (response.success) {
        setSuccess(`Random category "${name}" created successfully!`);
        fetchCategories();
        
        // Optionally create a subcategory
        if (subcategories[randomType] && Math.random() > 0.5) {
          const subs = subcategories[randomType];
          const randomSub = subs[Math.floor(Math.random() * subs.length)];
          const subName = `${randomSub} ${timestamp}`;
          const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          
          setTimeout(async () => {
            await productsService.createCategory(token!, {
              name: subName,
              slug: subSlug,
              description: `${randomSub} products and accessories`,
              image_url: null,
              parent_id: response.category.id,
              is_active: true,
            });
            fetchCategories();
          }, 500);
        }
      } else {
        setError(response.error || 'Failed to create random category');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create random category');
    }
  };

  const getParentCategoryName = (parentId: string) => {
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? parent.name : '-';
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

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Product Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize products into categories and subcategories
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={handleCreateRandomCategory}
          >
            🎲 Random
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
          >
            Add Category
          </Button>
        </Box>
      </Box>

      {/* Categories Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Parent Category</TableCell>
              <TableCell align="center">Products</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CategoryIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={600}>
                        {category.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {category.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {category.parent_id ? getParentCategoryName(category.parent_id) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={category.product_count || 0}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={category.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={category.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5} justifyContent="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog('edit', category)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(category.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Category Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {dialogMode === 'create' ? 'Create New Category' : 'Edit Category'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label="Category Name *"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="URL Slug *"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              helperText="SEO-friendly URL (auto-generated from name)"
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
            />

            <TextField
              fullWidth
              label="Image URL"
              value={formData.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              placeholder="https://..."
            />

            <TextField
              fullWidth
              label="Parent Category"
              select
              value={formData.parent_id}
              onChange={(e) => handleChange('parent_id', e.target.value)}
              helperText="Leave empty for top-level category"
            >
              <MenuItem value="">None (Top Level)</MenuItem>
              {categories
                .filter(cat => cat.id !== selectedCategory?.id)
                .map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManagement;
