import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { getSearchSuggestions, type SearchSuggestion } from '../services/searchService';
import { useNavigate } from 'react-router-dom';

interface Props {
  token: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

const ProductSearchWithTypeahead: React.FC<Props> = ({ 
  token, 
  onSearch, 
  placeholder = 'Search products...',
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [resultCount, setResultCount] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const R2_PUBLIC_URL = 'https://pub-33bf1ab4fbc14d72add6f211d35c818e.r2.dev';

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        // Fetch both suggestions and full search to get count
        const [suggestionsResponse, searchResponse] = await Promise.all([
          getSearchSuggestions(token, query, 5),
          import('../services/searchService').then(m => m.searchProducts(token, query, { limit: 100 }))
        ]);
        
        if (suggestionsResponse.success) {
          setSuggestions(suggestionsResponse.suggestions);
          setShowSuggestions(suggestionsResponse.suggestions.length > 0);
        }
        
        if (searchResponse.success) {
          setResultCount(searchResponse.count);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch('');
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    onSearch(query);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    navigate(`/market/product/${suggestion.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getImageUrl = (image: string | null) => {
    if (!image) return 'https://via.placeholder.com/50?text=No+Image';
    const filename = image.split('/').pop();
    return `${R2_PUBLIC_URL}/${filename}`;
  };

  return (
    <Box ref={wrapperRef} sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <SearchIcon />
              )}
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
          }}
        >
          <List disablePadding>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={suggestion.id}
                disablePadding
                sx={{
                  bgcolor: selectedIndex === index ? 'action.hover' : 'transparent',
                }}
              >
                <ListItemButton
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{ py: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={getImageUrl(suggestion.image)}
                      variant="rounded"
                      sx={{ width: 50, height: 50 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {suggestion.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                          ${Number(suggestion.price).toFixed(2)}
                        </Typography>
                        {suggestion.category && (
                          <Typography variant="caption" color="text.secondary">
                            • {suggestion.category}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
            
            {/* Show All Results Button */}
            {resultCount > 2 && (
              <ListItem
                disablePadding
                sx={{
                  borderTop: 1,
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}
              >
                <ListItemButton
                  onClick={() => {
                    setShowSuggestions(false);
                    onSearch(query);
                  }}
                  sx={{
                    py: 1.5,
                    justifyContent: 'center',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <SearchIcon fontSize="small" />
                    Show all {resultCount} results
                  </Typography>
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ProductSearchWithTypeahead;
