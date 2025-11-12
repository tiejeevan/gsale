import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useUserContext } from '../../context/UserContext';
import { productsService } from '../../services/productsService';

interface StockUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string | null;
  productTitle: string;
  currentStock: number;
}

const StockUpdateDialog: React.FC<StockUpdateDialogProps> = ({
  open,
  onClose,
  onSuccess,
  productId,
  productTitle,
  currentStock
}) => {
  const { token } = useUserContext();
  const [operation, setOperation] = useState<'set' | 'increment' | 'decrement'>('set');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productId || !quantity) {
      setError('Quantity is required');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await productsService.updateStock(token!, productId, qty, operation);
      if (response.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        setError(response.error || 'Failed to update stock');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOperation('set');
    setQuantity('');
    setError('');
  };

  const getNewStock = () => {
    const qty = parseInt(quantity) || 0;
    switch (operation) {
      case 'set':
        return qty;
      case 'increment':
        return currentStock + qty;
      case 'decrement':
        return Math.max(0, currentStock - qty);
      default:
        return currentStock;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Update Stock</Typography>
          <IconButton onClick={onClose} size="small">
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
          <Box>
            <Typography variant="body2" color="text.secondary">
              Product
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {productTitle}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Current Stock
            </Typography>
            <Typography variant="h5" color="primary">
              {currentStock} units
            </Typography>
          </Box>

          <RadioGroup
            value={operation}
            onChange={(e) => setOperation(e.target.value as any)}
          >
            <FormControlLabel
              value="set"
              control={<Radio />}
              label="Set to specific quantity"
            />
            <FormControlLabel
              value="increment"
              control={<Radio />}
              label="Add to current stock"
            />
            <FormControlLabel
              value="decrement"
              control={<Radio />}
              label="Remove from current stock"
            />
          </RadioGroup>

          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputProps={{ min: 0 }}
            helperText={
              operation === 'set'
                ? 'Enter the new stock quantity'
                : operation === 'increment'
                ? 'Enter quantity to add'
                : 'Enter quantity to remove'
            }
          />

          {quantity && (
            <Alert severity="info">
              New stock will be: <strong>{getNewStock()} units</strong>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !quantity}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Update Stock
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockUpdateDialog;
