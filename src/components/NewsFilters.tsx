import React from 'react';
import { Box, Paper, Typography, FormControl, Select, MenuItem, Chip, IconButton, Tooltip, Autocomplete, TextField } from '@mui/material';
import { FilterList as FilterIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface NewsFiltersProps {
  category: string;
  sport?: string;
  worldCountry?: string;
  onSportChange?: (sport: string) => void;
  onWorldCountryChange?: (country: string) => void;
  onReset?: () => void;
}

const NewsFilters: React.FC<NewsFiltersProps> = ({
  category,
  sport = 'all',
  worldCountry = 'us',
  onSportChange,
  onWorldCountryChange,
  onReset,
}) => {
  const hasActiveFilters = 
    (category === 'world' && worldCountry !== 'us') ||
    (category === 'sports' && sport !== 'all');
  const countries = [
    { code: 'ae', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'ar', name: 'Argentina', flag: '🇦🇷' },
    { code: 'at', name: 'Austria', flag: '🇦🇹' },
    { code: 'au', name: 'Australia', flag: '🇦🇺' },
    { code: 'be', name: 'Belgium', flag: '🇧🇪' },
    { code: 'bg', name: 'Bulgaria', flag: '🇧🇬' },
    { code: 'br', name: 'Brazil', flag: '🇧🇷' },
    { code: 'ca', name: 'Canada', flag: '🇨🇦' },
    { code: 'ch', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'cn', name: 'China', flag: '🇨🇳' },
    { code: 'co', name: 'Colombia', flag: '🇨🇴' },
    { code: 'cu', name: 'Cuba', flag: '🇨🇺' },
    { code: 'cz', name: 'Czech Republic', flag: '🇨🇿' },
    { code: 'de', name: 'Germany', flag: '🇩🇪' },
    { code: 'eg', name: 'Egypt', flag: '🇪🇬' },
    { code: 'fr', name: 'France', flag: '🇫🇷' },
    { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'gr', name: 'Greece', flag: '🇬🇷' },
    { code: 'hk', name: 'Hong Kong', flag: '🇭🇰' },
    { code: 'hu', name: 'Hungary', flag: '🇭🇺' },
    { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'ie', name: 'Ireland', flag: '🇮🇪' },
    { code: 'il', name: 'Israel', flag: '🇮🇱' },
    { code: 'in', name: 'India', flag: '🇮🇳' },
    { code: 'it', name: 'Italy', flag: '🇮🇹' },
    { code: 'jp', name: 'Japan', flag: '🇯🇵' },
    { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
    { code: 'lt', name: 'Lithuania', flag: '🇱🇹' },
    { code: 'lv', name: 'Latvia', flag: '🇱🇻' },
    { code: 'ma', name: 'Morocco', flag: '🇲🇦' },
    { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
    { code: 'my', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'ng', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'nl', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'no', name: 'Norway', flag: '🇳🇴' },
    { code: 'nz', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'ph', name: 'Philippines', flag: '🇵🇭' },
    { code: 'pl', name: 'Poland', flag: '🇵🇱' },
    { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
    { code: 'ro', name: 'Romania', flag: '🇷🇴' },
    { code: 'rs', name: 'Serbia', flag: '🇷🇸' },
    { code: 'ru', name: 'Russia', flag: '🇷🇺' },
    { code: 'sa', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'se', name: 'Sweden', flag: '🇸🇪' },
    { code: 'sg', name: 'Singapore', flag: '🇸🇬' },
    { code: 'si', name: 'Slovenia', flag: '🇸🇮' },
    { code: 'sk', name: 'Slovakia', flag: '🇸🇰' },
    { code: 'th', name: 'Thailand', flag: '🇹🇭' },
    { code: 'tr', name: 'Turkey', flag: '🇹🇷' },
    { code: 'tw', name: 'Taiwan', flag: '🇹🇼' },
    { code: 'ua', name: 'Ukraine', flag: '🇺🇦' },
    { code: 'us', name: 'United States', flag: '🇺🇸' },
    { code: 've', name: 'Venezuela', flag: '🇻🇪' },
    { code: 'za', name: 'South Africa', flag: '🇿🇦' },
  ];

  const sports = [
    { value: 'all', label: '⚽ All Sports' },
    { value: 'football', label: '🏈 Football' },
    { value: 'soccer', label: '⚽ Soccer' },
    { value: 'basketball', label: '🏀 Basketball' },
    { value: 'baseball', label: '⚾ Baseball' },
    { value: 'tennis', label: '🎾 Tennis' },
    { value: 'cricket', label: '🏏 Cricket' },
    { value: 'golf', label: '⛳ Golf' },
    { value: 'hockey', label: '🏒 Hockey' },
    { value: 'boxing', label: '🥊 Boxing' },
    { value: 'racing', label: '🏎️ Racing' },
  ];

  if (category !== 'world' && category !== 'sports') {
    return null;
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 3, 
        p: 2, 
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" fontWeight={600}>
            Filters:
          </Typography>
        </Box>

        {category === 'world' && onWorldCountryChange && (
          <Autocomplete
            size="small"
            options={countries}
            value={countries.find(c => c.code === worldCountry) || countries.find(c => c.code === 'us')!}
            onChange={(_, newValue) => {
              if (newValue) {
                onWorldCountryChange(newValue.code);
              }
            }}
            getOptionLabel={(option) => `${option.flag} ${option.name}`}
            renderInput={(params) => (
              <TextField 
                {...params} 
                placeholder="Select country..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            )}
            sx={{ minWidth: 250 }}
          />
        )}

        {category === 'sports' && onSportChange && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={sport}
              onChange={(e) => onSportChange(e.target.value)}
              sx={{ 
                borderRadius: 2,
                '& .MuiSelect-select': {
                  py: 1,
                }
              }}
            >
              {sports.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Active Filter Chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 'auto', alignItems: 'center' }}>
          {category === 'world' && worldCountry !== 'us' && (
            <Chip 
              label={`${countries.find(c => c.code === worldCountry)?.flag} ${countries.find(c => c.code === worldCountry)?.name}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {category === 'sports' && sport !== 'all' && (
            <Chip 
              label={sports.find(s => s.value === sport)?.label}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {hasActiveFilters && onReset && (
            <Tooltip title="Reset filters">
              <IconButton 
                size="small" 
                onClick={onReset}
                sx={{ 
                  ml: 1,
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default NewsFilters;
