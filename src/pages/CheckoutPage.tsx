// pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService, type CheckoutData } from '../services/orderService';
import { useUserContext } from '../context/UserContext';
import { addressService, type Address, type AddressInput } from '../services/addressService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const steps = ['Shipping Address', 'Shipping Method', 'Payment', 'Review'];

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useUserContext();
  const { cartItems, totalAmount, validateCart } = useCart();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  // Form data
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    phone: '',
  });

  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [customerNotes, setCustomerNotes] = useState('');

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showAddAddressDialog, setShowAddAddressDialog] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);

  const shippingMethods = [
    { value: 'standard', label: 'Standard Shipping (5-7 days)', price: 5.99 },
    { value: 'express', label: 'Express Shipping (2-3 days)', price: 12.99 },
    { value: 'overnight', label: 'Overnight Shipping (1 day)', price: 24.99 },
  ];

  const paymentMethods = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'cash_on_delivery', label: 'Cash on Delivery' },
  ];

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
    fetchSavedAddresses();
  }, [cartItems, navigate]);

  const fetchSavedAddresses = async () => {
    try {
      const response = await addressService.getUserAddresses(token!);
      if (response.success && response.addresses) {
        setSavedAddresses(response.addresses);
        
        // Auto-fill with default address if exists
        const defaultAddr = response.addresses.find(a => a.is_default);
        if (defaultAddr && !shippingAddress.name) {
          loadAddressToForm(defaultAddr);
          setSelectedSavedAddressId(defaultAddr.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  const loadAddressToForm = (address: Address) => {
    setShippingAddress({
      name: address.name,
      address: address.address_line1,
      city: address.city,
      state: address.state,
      zip: address.postal_code,
      country: address.country,
      phone: address.phone,
    });
  };

  const handleSaveCurrentAddress = async () => {
    if (!shippingAddress.name || !shippingAddress.address) {
      setError('Please fill in the address first');
      return;
    }

    try {
      const addressData: AddressInput = {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        address_line1: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postal_code: shippingAddress.zip,
        country: shippingAddress.country,
        label: addressLabel || undefined,
        is_default: savedAddresses.length === 0, // First address is default
        address_type: 'shipping'
      };

      const response = await addressService.createAddress(token!, addressData);
      if (response.success) {
        await fetchSavedAddresses();
        setShowAddAddressDialog(false);
        setAddressLabel('');
        setError('');
      } else {
        setError(response.error || 'Failed to save address');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Delete this address?')) return;
    
    try {
      const response = await addressService.deleteAddress(token!, addressId);
      if (response.success) {
        await fetchSavedAddresses();
        if (selectedSavedAddressId === addressId) {
          setSelectedSavedAddressId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleNext = async () => {
    setError('');

    // Validate current step
    if (activeStep === 0) {
      // Validate shipping address
      const requiredFields = ['name', 'address', 'city', 'state', 'zip', 'phone'];
      const missingFields = requiredFields.filter(field => !shippingAddress[field as keyof typeof shippingAddress]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    if (activeStep === steps.length - 1) {
      // Final step - validate cart and place order
      await handlePlaceOrder();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');
    setValidationIssues([]);

    try {
      // Validate cart first
      const validation = await validateCart();
      if (!validation.valid) {
        setValidationIssues(validation.issues);
        setError('Please fix cart issues before proceeding');
        setLoading(false);
        return;
      }

      // Calculate shipping amount
      const selectedShipping = shippingMethods.find(m => m.value === shippingMethod);
      const shippingAmount = selectedShipping?.price || 0;

      // Prepare checkout data
      const checkoutData: CheckoutData = {
        shipping_address: shippingAddress,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        customer_notes: customerNotes || undefined,
        tax_rate: 0.08, // 8% tax
        shipping_amount: shippingAmount,
        discount_amount: 0,
      };

      // Place order
      const response = await orderService.checkout(token!, checkoutData);

      if (response.success && response.order) {
        // Navigate to order confirmation
        navigate(`/order-confirmation/${response.order.id}`);
      } else {
        setError(response.message || response.error || 'Failed to place order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const getShippingAmount = () => {
    const selected = shippingMethods.find(m => m.value === shippingMethod);
    return selected?.price || 0;
  };

  const getTaxAmount = () => {
    const amount = Number(totalAmount) || 0;
    return amount * 0.08; // 8% tax
  };

  const getTotal = () => {
    const amount = Number(totalAmount) || 0;
    return amount + getShippingAmount() + getTaxAmount();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Shipping Address
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setShowAddAddressDialog(true)}
              >
                Save Current Address
              </Button>
            </Box>

            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Select a saved address:
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={selectedSavedAddressId || ''}
                    onChange={(e) => {
                      const addr = savedAddresses.find(a => a.id === e.target.value);
                      if (addr) {
                        loadAddressToForm(addr);
                        setSelectedSavedAddressId(addr.id);
                      }
                    }}
                  >
                    {savedAddresses.map((addr) => (
                      <Box
                        key={addr.id}
                        sx={{
                          mb: 1,
                          p: 2,
                          border: 1,
                          borderColor: selectedSavedAddressId === addr.id ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                        }}
                      >
                        <FormControlLabel
                          value={addr.id}
                          control={<Radio />}
                          sx={{ flex: 1, m: 0 }}
                          label={
                            <Box sx={{ ml: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {addr.name}
                                </Typography>
                                {addr.label && <Chip label={addr.label} size="small" />}
                                {addr.is_default && <Chip label="Default" size="small" color="primary" />}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {addr.address_line1}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {addr.city}, {addr.state} {addr.postal_code}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {addr.phone}
                              </Typography>
                            </Box>
                          }
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(addr.id);
                          }}
                          sx={{ mt: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </RadioGroup>
                </FormControl>
                <Divider sx={{ my: 3 }} />
              </Box>
            )}

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {savedAddresses.length > 0 ? 'Or enter a new address:' : 'Enter shipping address:'}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  required
                  value={shippingAddress.name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Address"
                  required
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="City"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="State"
                  required
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  required
                  value={shippingAddress.zip}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={shippingAddress.country}
                    label="Country"
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                  >
                    <MenuItem value="USA">United States</MenuItem>
                    <MenuItem value="Canada">Canada</MenuItem>
                    <MenuItem value="UK">United Kingdom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  required
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Shipping Method
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
              >
                {shippingMethods.map((method) => (
                  <FormControlLabel
                    key={method.value}
                    value={method.value}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: 400 }}>
                        <Typography>{method.label}</Typography>
                        <Typography fontWeight={600}>${method.price.toFixed(2)}</Typography>
                      </Box>
                    }
                    sx={{ mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {paymentMethods.map((method) => (
                  <FormControlLabel
                    key={method.value}
                    value={method.value}
                    control={<Radio />}
                    label={method.label}
                    sx={{ mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <TextField
              fullWidth
              label="Order Notes (Optional)"
              multiline
              rows={3}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Order
            </Typography>
            
            {/* Shipping Address */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Shipping Address
              </Typography>
              <Typography variant="body2">{shippingAddress.name}</Typography>
              <Typography variant="body2">{shippingAddress.address}</Typography>
              <Typography variant="body2">
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
              </Typography>
              <Typography variant="body2">{shippingAddress.country}</Typography>
              <Typography variant="body2">{shippingAddress.phone}</Typography>
            </Paper>

            {/* Shipping & Payment */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Shipping Method
              </Typography>
              <Typography variant="body2">
                {shippingMethods.find(m => m.value === shippingMethod)?.label}
              </Typography>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                Payment Method
              </Typography>
              <Typography variant="body2">
                {paymentMethods.find(m => m.value === paymentMethod)?.label}
              </Typography>
            </Paper>

            {/* Order Items */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Order Items ({cartItems.length})
              </Typography>
              <List dense>
                {cartItems.map((item) => (
                  <ListItem key={item.id} sx={{ px: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="body2">
                        {item.product_title} x {item.quantity}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${Number(item.subtotal).toFixed(2)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Checkout
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Complete your purchase
        </Typography>

        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Cart Issues:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Checkout Form */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3 }}>
              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Step Content */}
              {renderStepContent(activeStep)}

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : activeStep === steps.length - 1 ? (
                    'Place Order'
                  ) : (
                    'Next'
                  )}
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Order Summary */}
          <Box sx={{ width: { xs: '100%', md: 350 } }}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Order Summary
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">${Number(totalAmount).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Shipping:</Typography>
                  <Typography variant="body2">${getShippingAmount().toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tax (8%):</Typography>
                  <Typography variant="body2">${getTaxAmount().toFixed(2)}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total:
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  ${getTotal().toFixed(2)}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary">
                By placing your order, you agree to our terms and conditions
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* Save Address Dialog */}
      <Dialog open={showAddAddressDialog} onClose={() => setShowAddAddressDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Save This Address</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Address Label (Optional)"
              placeholder="e.g., Home, Office, Mom's House"
              value={addressLabel}
              onChange={(e) => setAddressLabel(e.target.value)}
              helperText="Give this address a name for easy identification"
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              Current address will be saved to your profile for future use.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddAddressDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCurrentAddress}
            disabled={!shippingAddress.name || !shippingAddress.address}
          >
            Save Address
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckoutPage;
