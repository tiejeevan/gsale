import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useUserContext } from '../context/UserContext';
import { productsService } from '../services/productsService';

const ProductsTestPage: React.FC = () => {
  const { token } = useUserContext();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testProductId, setTestProductId] = useState<string | null>(null);
  const [, setTestCategoryId] = useState<string | null>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setLogs(prev => [...prev, `[${timestamp}] ${emoji} ${message}`]);
    console.log(`[${timestamp}] ${emoji} ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
    console.clear();
  };

  // Test 1: Get Product Stats
  const testGetStats = async () => {
    addLog('Testing: Get Product Stats');
    try {
      const response = await productsService.getProductStats(token!);
      if (response.success) {
        addLog(`Stats retrieved: ${JSON.stringify(response.stats)}`, 'success');
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 2: Get All Products
  const testGetProducts = async () => {
    addLog('Testing: Get All Products');
    try {
      const response = await productsService.getProducts(token!, { page: 1, limit: 5 });
      if (response.success) {
        addLog(`Products retrieved: ${response.products.length} items`, 'success');
        addLog(`Pagination: ${JSON.stringify(response.pagination)}`, 'info');
        if (response.products.length > 0) {
          setTestProductId(response.products[0].id);
          addLog(`Saved test product ID: ${response.products[0].id}`, 'info');
        }
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 3: Get Single Product
  const testGetProductById = async () => {
    if (!testProductId) {
      addLog('No test product ID available. Run "Get All Products" first.', 'error');
      return;
    }
    addLog(`Testing: Get Product By ID (${testProductId})`);
    try {
      const response = await productsService.getProductById(token!, testProductId);
      if (response.success) {
        addLog(`Product retrieved: ${response.product.title}`, 'success');
        addLog(`Price: $${response.product.price}`, 'info');
        addLog(`Stock: ${response.product.stock_quantity}`, 'info');
        addLog(`Attributes: ${response.product.attributes?.length || 0}`, 'info');
        addLog(`Media: ${response.product.media?.length || 0}`, 'info');
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 4: Create Product
  const testCreateProduct = async () => {
    addLog('Testing: Create Product');
    try {
      const timestamp = Date.now();
      const productData = {
        title: `Test Product ${timestamp}`,
        slug: `test-product-${timestamp}`,
        description: 'This is a test product',
        price: 99.99,
        stock_quantity: 50,
        status: 'active',
        is_featured: true,
      };
      const response = await productsService.createProduct(token!, productData);
      if (response.success) {
        addLog(`Product created: ${response.product.id}`, 'success');
        setTestProductId(response.product.id);
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 5: Update Product
  const testUpdateProduct = async () => {
    if (!testProductId) {
      addLog('No test product ID available. Create a product first.', 'error');
      return;
    }
    addLog(`Testing: Update Product (${testProductId})`);
    try {
      const response = await productsService.updateProduct(token!, testProductId, {
        price: 149.99,
        stock_quantity: 100,
      });
      if (response.success) {
        addLog(`Product updated successfully`, 'success');
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 6: Update Stock
  const testUpdateStock = async () => {
    if (!testProductId) {
      addLog('No test product ID available. Create a product first.', 'error');
      return;
    }
    addLog(`Testing: Update Stock (${testProductId})`);
    try {
      const response = await productsService.updateStock(token!, testProductId, 10, 'increment');
      if (response.success) {
        addLog(`Stock updated successfully`, 'success');
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 7: Get Categories
  const testGetCategories = async () => {
    addLog('Testing: Get Categories');
    try {
      const response = await productsService.getCategories(token!);
      if (response.success) {
        addLog(`Categories retrieved: ${response.categories.length} items`, 'success');
        if (response.categories.length > 0) {
          setTestCategoryId(response.categories[0].id);
          addLog(`Saved test category ID: ${response.categories[0].id}`, 'info');
        }
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 8: Create Category
  const testCreateCategory = async () => {
    addLog('Testing: Create Category');
    try {
      const timestamp = Date.now();
      const response = await productsService.createCategory(token!, {
        name: `Test Category ${timestamp}`,
        slug: `test-category-${timestamp}`,
        description: 'Test category description',
      });
      if (response.success) {
        addLog(`Category created: ${response.category.id}`, 'success');
        setTestCategoryId(response.category.id);
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 9: Search Products
  const testSearchProducts = async () => {
    addLog('Testing: Search Products');
    try {
      const response = await productsService.searchProducts(token!, 'test');
      if (response.success) {
        addLog(`Search results: ${response.products.length} items`, 'success');
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 10: Get Featured Products
  const testGetFeaturedProducts = async () => {
    addLog('Testing: Get Featured Products');
    try {
      const response = await productsService.getFeaturedProducts(token!, 5);
      if (response.success) {
        addLog(`Featured products: ${response.products.length} items`, 'success');
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 11: Approve Product
  const testApproveProduct = async () => {
    if (!testProductId) {
      addLog('No test product ID available. Create a product first.', 'error');
      return;
    }
    addLog(`Testing: Approve Product (${testProductId})`);
    try {
      const response = await productsService.approveProduct(token!, testProductId);
      if (response.success) {
        addLog(`Product approved successfully`, 'success');
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Test 12: Delete Product
  const testDeleteProduct = async () => {
    if (!testProductId) {
      addLog('No test product ID available. Create a product first.', 'error');
      return;
    }
    addLog(`Testing: Delete Product (${testProductId})`);
    try {
      const response = await productsService.deleteProduct(token!, testProductId);
      if (response.success) {
        addLog(`Product deleted successfully`, 'success');
      } else {
        addLog(`Failed: ${response.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  // Run All Tests
  const runAllTests = async () => {
    setLoading(true);
    clearLogs();
    addLog('=== Starting All Tests ===', 'info');
    
    await testGetStats();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetCategories();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetProducts();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (testProductId) {
      await testGetProductById();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await testCreateProduct();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testUpdateProduct();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testUpdateStock();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testSearchProducts();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetFeaturedProducts();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addLog('=== All Tests Completed ===', 'success');
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Products API Test Suite
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Test all product admin features and view logs
      </Typography>

      <Box sx={{ my: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button variant="contained" onClick={runAllTests} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Run All Tests'}
        </Button>
        <Button variant="outlined" onClick={clearLogs}>
          Clear Logs
        </Button>
        <Divider orientation="vertical" flexItem />
        <Button onClick={testGetStats} size="small">Get Stats</Button>
        <Button onClick={testGetProducts} size="small">Get Products</Button>
        <Button onClick={testGetProductById} size="small">Get By ID</Button>
        <Button onClick={testCreateProduct} size="small">Create</Button>
        <Button onClick={testUpdateProduct} size="small">Update</Button>
        <Button onClick={testUpdateStock} size="small">Update Stock</Button>
        <Button onClick={testGetCategories} size="small">Get Categories</Button>
        <Button onClick={testCreateCategory} size="small">Create Category</Button>
        <Button onClick={testSearchProducts} size="small">Search</Button>
        <Button onClick={testGetFeaturedProducts} size="small">Featured</Button>
        <Button onClick={testApproveProduct} size="small">Approve</Button>
        <Button onClick={testDeleteProduct} size="small">Delete</Button>
      </Box>

      {testProductId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Test Product ID: {testProductId}
        </Alert>
      )}

      <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#fff', maxHeight: '600px', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#4fc3f7' }}>
          Console Logs
        </Typography>
        {logs.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#888' }}>
            No logs yet. Run tests to see results.
          </Typography>
        ) : (
          logs.map((log, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontSize: '12px',
                mb: 0.5,
                color: log.includes('❌') ? '#f44336' : log.includes('✅') ? '#4caf50' : '#fff',
              }}
            >
              {log}
            </Typography>
          ))
        )}
      </Paper>
    </Container>
  );
};

export default ProductsTestPage;
