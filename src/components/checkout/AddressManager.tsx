// components/checkout/AddressManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { addressService, type Address, type AddressInput } from '../../services/addressService';
import { useUserContext } from '../../context/UserContext';

interface AddressManagerProps {
  onSelectAddress: (address: any) => void;
  selectedAddressId?: string;
}

const AddressManager: React.FC<AddressManagerProps> = ({ onSelectAddress, selectedAddressId }) => {
  const { token } = useUserContext();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddressInput>({
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    label: '',
    is_default: false,
    address_type: 'shipping'
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await addressService.getUserAddresses(token!);
      if (response.success && response.addresses) {
        setAddresses(response.addresses);
        
        // Auto-select default address if none selected
        if (!selectedAddressId) {
          const defaultAddr = response.addresses.find(a => a.is_default);
          if (defaultAddr) {
            handleSelectAddress(defaultAddr);
          }
        }
      } else {
        setError(response.error || 'Failed to load addresses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address: Address) => {
    onSelectAddress({
      name: address.name,
      address: address.address_line1,
      city: address.city,
      state: address.state,
      zip: address.postal_code,
      country: address.country,
      phone: address.phone,
      _addressId: address.id
    });
  };

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        name: address.name,
        phone: address.phone,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || '',
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
        label: address.label || '',
        is_default: address.is_default,
        address_type: address.address_type
      });
    } else {
      setEditingAddress(null);
      setFormData({
        name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'United States',
        label: '',
        is_default: false,
        address_type: 'shipping'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = async () => {
    setError('');
    try {
      let response;
      if (editingAddress) {
        response = await addressService.updateAddress(token!, editingAddress.id, formData);
      } else {
        response = await addressService.createAddress(token!, formData);
      }

      if (response.success) {
        await fetchAddresses();
        handleCloseDialog();
        if (response.address) {
          handleSelectAddress(response.address);
        }
      } else {
        setError(response.error || 'Failed to save address');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    setError('');
    try {
      const response = await addressService.deleteAddress(token!, addressId);
      if (response.success) {
        await fetchAddresses();
      } else {
        setError(response.error || 'Failed to delete address');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setError('');
    try {
      const response = await addressService.setDefaultAddress(token!, addressId);
      if (response.success) {
        await fetchAddresses();
      } else {
        setError(response.error || 'Failed to set default address');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set default address');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Select Shipping Address</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Address
        </Button>
      </Box>

      {addresses.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No saved addresses yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mt: 2 }}
          >
            Add Your First Address
          </Button>
        </Card>
      ) : (
        <RadioGroup value={selectedAddressId || ''}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {addresses.map((address) => (
              <Box key={address.id}>
                <Card
                  sx={{
                    border: 2,
                    borderColor: selectedAddressId === address.id ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => handleSelectAddress(address)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Radio
                          checked={selectedAddressId === address.id}
                          value={address.id}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {address.label && (
                          <Chip
                            label={address.label}
                            size="small"
                            icon={address.label.toLowerCase().includes('home') ? <HomeIcon /> : <BusinessIcon />}
                          />
                        )}
                        {address.is_default && (
                          <Chip label="Default" size="small" color="primary" />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {address.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {address.address_line1}
                    </Typography>
                    {address.address_line2 && (
                      <Typography variant="body2" color="text.secondary">
                        {address.address_line2}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {address.city}, {address.state} {address.postal_code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {address.country}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      📞 {address.phone}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box>
                      {!address.is_default && (
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(address.id);
                          }}
                        >
                          Set as Default
                        </Button>
                      )}
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(address);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(address.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        </RadioGroup>
      )}

      {/* Add/Edit Address Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Label (Optional)"
              placeholder="e.g., Home, Office"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              fullWidth
            />
            <TextField
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone Number"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address Line 1"
              required
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address Line 2 (Optional)"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="City"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                fullWidth
              />
              <TextField
                label="State"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Postal Code"
                required
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                fullWidth
              />
              <TextField
                label="Country"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                fullWidth
              />
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
              }
              label="Set as default address"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveAddress}
            disabled={!formData.name || !formData.phone || !formData.address_line1 || !formData.city || !formData.state || !formData.postal_code}
          >
            {editingAddress ? 'Update' : 'Save'} Address
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddressManager;
