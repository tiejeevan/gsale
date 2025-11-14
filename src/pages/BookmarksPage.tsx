import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Chip,
  type SelectChangeEvent,
} from '@mui/material';
import { Bookmark as BookmarkIcon } from '@mui/icons-material';
import { useUserContext } from '../context/UserContext';
import { getBookmarkedPosts } from '../services/bookmarkService';
import PostCard from '../components/PostCard';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import BottomNav from '../components/layout/BottomNav';
import { useNavigate } from 'react-router-dom';

const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

interface Bookmark {
  item_type: 'post' | 'product';
  item_id: number;
  [key: string]: any;
}

const BookmarksPage: React.FC = () => {
  const { token, currentUser } = useUserContext();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'post' | 'product'>('all');

  useEffect(() => {
    if (token) {
      fetchBookmarks();
    }
  }, [token]);

  useEffect(() => {
    // Filter bookmarks based on selected filter
    if (filter === 'all') {
      setFilteredBookmarks(bookmarks);
    } else {
      setFilteredBookmarks(bookmarks.filter(b => b.item_type === filter));
    }
  }, [filter, bookmarks]);

  const fetchBookmarks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBookmarkedPosts(token!);
      console.log('Fetched bookmarks:', data);
      console.log('Total bookmarks:', data.length);
      setBookmarks(data);
      setFilteredBookmarks(data);
    } catch (err: any) {
      console.error('Error fetching bookmarks:', err);
      setError(err.message || 'Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilter(event.target.value as 'all' | 'post' | 'product');
  };

  const getPublicUrl = (file_url: string) => {
    const filename = file_url.split('/').pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  const posts = filteredBookmarks.filter(b => b.item_type === 'post');
  const products = filteredBookmarks.filter(b => b.item_type === 'product');

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
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              <BookmarkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Bookmarks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your saved posts and products
            </Typography>
          </Box>

          {/* Filter Dropdown */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredBookmarks.length} {filter === 'all' ? 'items' : filter === 'post' ? 'posts' : 'products'}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={filter} onChange={handleFilterChange}>
                <MenuItem value="all">All ({bookmarks.length})</MenuItem>
                <MenuItem value="post">Posts ({bookmarks.filter(b => b.item_type === 'post').length})</MenuItem>
                <MenuItem value="product">Products ({bookmarks.filter(b => b.item_type === 'product').length})</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && filteredBookmarks.length === 0 && (
            <Paper sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper' }}>
              <BookmarkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No bookmarks yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filter === 'all' 
                  ? 'Start bookmarking posts and products to see them here'
                  : `No ${filter}s bookmarked yet`}
              </Typography>
            </Paper>
          )}

          {/* Content */}
          {!loading && !error && filteredBookmarks.length > 0 && (
            <Box>
              {/* Posts Section */}
              {(filter === 'all' || filter === 'post') && posts.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  {filter === 'all' && (
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Posts ({posts.length})
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post as any}
                        token={token ?? ''}
                        userId={currentUser?.id ?? 0}
                        showUsername={true}
                        r2PublicUrl={R2_PUBLIC_URL}
                        currentUserId={currentUser?.id ?? 0}
                        onBookmarkChange={fetchBookmarks}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Products Section */}
              {(filter === 'all' || filter === 'product') && products.length > 0 && (
                <Box>
                  {filter === 'all' && (
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Products ({products.length})
                    </Typography>
                  )}
                  <Grid container spacing={3}>
                    {products.map((product) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                        <Paper
                          elevation={2}
                          sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            },
                          }}
                          onClick={() => navigate(`/market/product/${product.id}`)}
                        >
                          <Box
                            component="img"
                            src={product.images?.[0] ? getPublicUrl(product.images[0]) : 'https://via.placeholder.com/300x200?text=No+Image'}
                            alt={product.title}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                            }}
                          />
                          <Box sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                              {product.title}
                            </Typography>
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                              ${Number(product.price).toFixed(2)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {product.category_name && (
                                <Chip label={product.category_name} size="small" variant="outlined" />
                              )}
                              <Chip label={`${product.views_count} views`} size="small" variant="outlined" />
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </Box>

        <RightSidebar />
      </Box>

      <BottomNav />
    </>
  );
};

export default BookmarksPage;
