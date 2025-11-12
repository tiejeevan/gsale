import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Casino as RandomIcon,
} from '@mui/icons-material';
import { useUserContext } from '../../context/UserContext';
import { productsService, type Product, type Category } from '../../services/productsService';

// Random product data generator
const PRODUCT_NAMES = [
  'Wireless Bluetooth Headphones',
  'Smart Watch Pro',
  'USB-C Fast Charger',
  'Portable Power Bank',
  'Gaming Mouse RGB',
  'Mechanical Keyboard',
  'Laptop Stand Aluminum',
  'Phone Case Premium',
  'Screen Protector Glass',
  'Webcam HD 1080p',
  'Microphone Studio',
  'LED Desk Lamp',
  'Ergonomic Office Chair',
  'Standing Desk Converter',
  'Monitor 27 inch 4K',
  'Graphics Tablet',
  'External SSD 1TB',
  'Router WiFi 6',
  'Smart Speaker',
  'Fitness Tracker Band',
  'Running Shoes Pro',
  'Yoga Mat Premium',
  'Dumbbell Set',
  'Resistance Bands',
  'Water Bottle Insulated',
  'Backpack Travel',
  'Sunglasses Polarized',
  'Watch Leather Band',
  'Wallet RFID Blocking',
  'Belt Genuine Leather',
];

const BRANDS = ['TechPro', 'SmartLife', 'ProGear', 'EliteWare', 'MaxTech', 'PrimeTech', 'UltraGear', 'NexGen'];
const COLORS = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Green', 'Gray', 'Gold'];
const SIZES = ['Small', 'Medium', 'Large', 'XL', 'XXL'];
const TAGS = ['new', 'bestseller', 'sale', 'trending', 'premium', 'eco-friendly', 'limited-edition', 'popular'];

const generateRandomProduct = (categories: Category[]) => {
  const name = PRODUCT_NAMES[Math.floor(Math.random() * PRODUCT_NAMES.length)];
  const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
  const price = (Math.random() * 500 + 10).toFixed(2);
  const comparePrice = (parseFloat(price) * (1 + Math.random() * 0.5)).toFixed(2);
  const costPrice = (parseFloat(price) * (0.4 + Math.random() * 0.3)).toFixed(2);
  const stock = Math.floor(Math.random() * 200) + 10;
  
  // Add timestamp and random string to make slug unique
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const slug = `${name}-${brand}-${timestamp}-${randomStr}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const randomTags = TAGS.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1);
  
  const attributes = [
    { key: 'Color', value: COLORS[Math.floor(Math.random() * COLORS.length)] },
    { key: 'Size', value: SIZES[Math.floor(Math.random() * SIZES.length)] },
  ];

  const categoryId = categories.length > 0 
    ? categories[Math.floor(Math.random() * categories.length)].id 
    : '';

  return {
    title: `${brand} ${name}`,
    slug,
    description: `High-quality ${name.toLowerCase()} from ${brand}. Features advanced technology and premium materials. Perfect for everyday use with exceptional performance and durability. Includes warranty and customer support.`,
    short_description: `Premium ${name.toLowerCase()} with advanced features and superior quality.`,
    price,
    compare_at_price: comparePrice,
    cost_price: costPrice,
    sku: `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    barcode: Math.floor(Math.random() * 9000000000000) + 1000000000000,
    category_id: categoryId,
    brand,
    stock_quantity: stock.toString(),
    low_stock_threshold: '10',
    weight: (Math.random() * 5 + 0.1).toFixed(2),
    status: 'active',
    is_featured: Math.random() > 0.7,
    seo_title: `Buy ${brand} ${name} - Best Price Online`,
    seo_description: `Shop ${brand} ${name} at the best price. Free shipping, warranty included. Order now!`,
    meta_keywords: `${name.toLowerCase()}, ${brand.toLowerCase()}, buy online, best price`,
    tags: randomTags,
    attributes,
    media: [
      { type: 'image' as const, url: `https://picsum.photos/800/600?random=${Math.random()}` },
      { type: 'image' as const, url: `https://picsum.photos/800/600?random=${Math.random()}` },
    ],
  };
};

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
  mode: 'create' | 'edit';
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  product,
  mode
}) => {
  const { token } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    compare_at_price: '',
    cost_price: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand: '',
    stock_quantity: '0',
    low_stock_threshold: '10',
    weight: '',
    video_url: '',
    status: 'draft',
    is_featured: false,
    seo_title: '',
    seo_description: '',
    meta_keywords: '',
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [attributes, setAttributes] = useState<Array<{ key: string; value: string }>>([]);
  const [mediaUrls, setMediaUrls] = useState<Array<{ type: 'image' | 'video'; url: string }>>([]);
  const [mediaInput, setMediaInput] = useState('');

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (mode === 'edit' && product) {
        populateForm(product);
      } else {
        resetForm();
      }
    }
  }, [open, product, mode]);

  const fetchCategories = async () => {
    try {
      const response = await productsService.getCategories(token!);
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const populateForm = (prod: Product) => {
    setFormData({
      title: prod.title,
      slug: prod.slug,
      description: prod.description || '',
      short_description: prod.short_description || '',
      price: prod.price.toString(),
      compare_at_price: prod.compare_at_price?.toString() || '',
      cost_price: prod.cost_price?.toString() || '',
      sku: prod.sku || '',
      barcode: prod.barcode || '',
      category_id: prod.category_id || '',
      brand: prod.brand || '',
      stock_quantity: prod.stock_quantity.toString(),
      low_stock_threshold: prod.low_stock_threshold.toString(),
      weight: prod.weight?.toString() || '',
      video_url: prod.video_url || '',
      status: prod.status,
      is_featured: prod.is_featured,
      seo_title: prod.seo_title || '',
      seo_description: prod.seo_description || '',
      meta_keywords: prod.meta_keywords || '',
    });
    setTags(prod.tags || []);
    setAttributes(prod.attributes || []);
    setMediaUrls(prod.media || []);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      short_description: '',
      price: '',
      compare_at_price: '',
      cost_price: '',
      sku: '',
      barcode: '',
      category_id: '',
      brand: '',
      stock_quantity: '0',
      low_stock_threshold: '10',
      weight: '',
      video_url: '',
      status: 'draft',
      is_featured: false,
      seo_title: '',
      seo_description: '',
      meta_keywords: '',
    });
    setTags([]);
    setAttributes([]);
    setMediaUrls([]);
    setError('');
  };

  const handleGenerateRandom = () => {
    const randomData = generateRandomProduct(categories);
    setFormData({
      title: randomData.title,
      slug: randomData.slug,
      description: randomData.description,
      short_description: randomData.short_description,
      price: randomData.price,
      compare_at_price: randomData.compare_at_price,
      cost_price: randomData.cost_price,
      sku: randomData.sku,
      barcode: randomData.barcode.toString(),
      category_id: randomData.category_id,
      brand: randomData.brand,
      stock_quantity: randomData.stock_quantity,
      low_stock_threshold: randomData.low_stock_threshold,
      weight: randomData.weight,
      video_url: '',
      status: randomData.status,
      is_featured: randomData.is_featured,
      seo_title: randomData.seo_title,
      seo_description: randomData.seo_description,
      meta_keywords: randomData.meta_keywords,
    });
    setTags(randomData.tags);
    setAttributes(randomData.attributes);
    setMediaUrls(randomData.media);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title with timestamp for uniqueness
    if (field === 'title' && mode === 'create') {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 6);
      const slug = `${value}-${timestamp}-${randomStr}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const handleUpdateAttribute = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAddMedia = () => {
    if (mediaInput.trim()) {
      const type = mediaInput.includes('youtube') || mediaInput.includes('vimeo') ? 'video' : 'image';
      setMediaUrls([...mediaUrls, { type, url: mediaInput.trim() }]);
      setMediaInput('');
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title || !formData.price) {
        setError('Title and price are required');
        setLoading(false);
        return;
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : undefined,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        stock_quantity: parseInt(formData.stock_quantity),
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        tags,
        attributes: attributes.filter(attr => attr.key && attr.value),
        media: mediaUrls,
      };

      let response;
      if (mode === 'create') {
        response = await productsService.createProduct(token!, productData);
      } else {
        response = await productsService.updateProduct(token!, product!.id, productData);
      }

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error || 'Failed to save product');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {mode === 'create' ? 'Create New Product' : 'Edit Product'}
          </Typography>
          <Box display="flex" gap={1}>
            {mode === 'create' && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RandomIcon />}
                onClick={handleGenerateRandom}
                color="secondary"
              >
                Random Product
              </Button>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Basic Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              📝 Basic Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Product Title *"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              placeholder="e.g., Wireless Bluetooth Headphones"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Brand"
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="e.g., Sony, Apple"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Status"
              select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Category *"
              select
              value={formData.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
              helperText="Select product category"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="URL Slug"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              helperText="Auto-generated from title"
              placeholder="product-name-slug"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Short Description"
              value={formData.short_description}
              onChange={(e) => handleChange('short_description', e.target.value)}
              multiline
              rows={2}
              placeholder="Brief product description (shown in listings)"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Full Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={4}
              placeholder="Detailed product description with features and benefits"
            />
          </Grid>

          {/* Pricing */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              💰 Pricing
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Selling Price *"
              type="number"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              required
              placeholder="99.99"
              helperText="Customer pays this price"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Compare at Price"
              type="number"
              value={formData.compare_at_price}
              onChange={(e) => handleChange('compare_at_price', e.target.value)}
              placeholder="129.99"
              helperText="Original price (for discounts)"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Cost Price"
              type="number"
              value={formData.cost_price}
              onChange={(e) => handleChange('cost_price', e.target.value)}
              placeholder="50.00"
              helperText="Your cost (internal)"
            />
          </Grid>

          {/* Inventory */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              📦 Inventory & Tracking
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Stock Quantity *"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => handleChange('stock_quantity', e.target.value)}
              placeholder="100"
              helperText="Available units"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Low Stock Alert"
              type="number"
              value={formData.low_stock_threshold}
              onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
              placeholder="10"
              helperText="Alert threshold"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="SKU"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              placeholder="PROD-001"
              helperText="Stock keeping unit"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              placeholder="123456789"
              helperText="Product barcode"
            />
          </Grid>

          {/* Tags */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              🏷️ Tags
            </Typography>
            <Box>
              <TextField
                fullWidth
                label="Add Tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="e.g., new, bestseller, sale"
                helperText="Press Enter or click Add"
                InputProps={{
                  endAdornment: (
                    <Button onClick={handleAddTag} size="small">
                      Add
                    </Button>
                  ),
                }}
              />
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Attributes */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                🎨 Product Attributes (Color, Size, etc.)
              </Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddAttribute} size="small" variant="outlined">
                Add Attribute
              </Button>
            </Box>
          </Grid>

          {attributes.map((attr, index) => (
            <Grid size={{ xs: 12 }} key={index}>
              <Box display="flex" gap={1}>
                <TextField
                  label="Attribute Name"
                  value={attr.key}
                  onChange={(e) => handleUpdateAttribute(index, 'key', e.target.value)}
                  placeholder="e.g., Color, Size"
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Value"
                  value={attr.value}
                  onChange={(e) => handleUpdateAttribute(index, 'value', e.target.value)}
                  placeholder="e.g., Red, Large"
                  size="small"
                  sx={{ flex: 1 }}
                />
                <IconButton onClick={() => handleRemoveAttribute(index)} size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Grid>
          ))}

          {/* Media */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              📸 Product Images & Videos
            </Typography>
            <TextField
              fullWidth
              label="Add Image/Video URL"
              value={mediaInput}
              onChange={(e) => setMediaInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMedia())}
              placeholder="https://example.com/image.jpg"
              helperText="Press Enter or click Add"
              InputProps={{
                endAdornment: (
                  <Button onClick={handleAddMedia} size="small">
                    Add
                  </Button>
                ),
              }}
            />
            <Box sx={{ mt: 1 }}>
              {mediaUrls.map((media, index) => (
                <Chip
                  key={index}
                  label={`${media.type}: ${media.url.substring(0, 40)}...`}
                  onDelete={() => handleRemoveMedia(index)}
                  sx={{ mr: 1, mb: 1 }}
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          {/* Shipping */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              🚚 Shipping Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              placeholder="1.5"
              helperText="Product weight for shipping"
            />
          </Grid>

          {/* SEO */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              🔍 SEO Optimization
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="SEO Title"
              value={formData.seo_title}
              onChange={(e) => handleChange('seo_title', e.target.value)}
              placeholder="Buy Product Name - Best Price Online"
              helperText="Appears in search results (50-60 characters)"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="SEO Description"
              value={formData.seo_description}
              onChange={(e) => handleChange('seo_description', e.target.value)}
              multiline
              rows={2}
              placeholder="Shop Product Name at the best price..."
              helperText="Meta description for search engines (150-160 characters)"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Meta Keywords"
              value={formData.meta_keywords}
              onChange={(e) => handleChange('meta_keywords', e.target.value)}
              placeholder="product, category, brand, buy online"
              helperText="Comma-separated keywords for SEO"
            />
          </Grid>

          {/* Settings */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              ⚙️ Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_featured}
                  onChange={(e) => handleChange('is_featured', e.target.checked)}
                />
              }
              label="⭐ Featured Product (Show on homepage)"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {mode === 'create' ? 'Create Product' : 'Update Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFormDialog;
