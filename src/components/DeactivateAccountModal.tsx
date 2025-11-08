import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

interface DeactivateAccountModalProps {
  onClose: () => void;
}

const DeactivateAccountModal: React.FC<DeactivateAccountModalProps> = ({ onClose }) => {
  const { deactivateUser, currentUser } = useUserContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const expectedText = `DELETE ${currentUser?.username}`;
  const isConfirmValid = confirmText === expectedText;

  const handleDeactivate = async () => {
    if (!isConfirmValid) return;
    
    setLoading(true);
    setError(null);

    try {
      await deactivateUser();
      // User will be logged out automatically by deactivateUser
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Failed to deactivate account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1,
              bgcolor: 'error.light',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningIcon sx={{ color: 'error.main' }} />
          </Box>
          <Typography variant="h6" component="div" fontWeight={600}>
            Deactivate Account
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {error}
            </Alert>
          )}

          <Alert
            severity="error"
            icon={<WarningIcon />}
            sx={{
              borderRadius: 1,
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Warning: This action cannot be undone
            </Typography>
            <List dense disablePadding>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary="• Your account will be permanently deactivated"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary="• All your posts and data will be removed"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary="• You will be immediately logged out"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary="• Your username will become available to others"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Alert>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              If you're sure you want to deactivate your account, please type{" "}
              <Typography
                component="span"
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'action.hover',
                  px: 1,
                  py: 0.5,
                  borderRadius: 0.5,
                  color: 'error.main',
                  fontWeight: 600,
                }}
              >
                {expectedText}
              </Typography>{" "}
              below to confirm:
            </Typography>
            
            <TextField
              fullWidth
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedText}
              variant="outlined"
              sx={{
                '& input': {
                  fontFamily: 'monospace',
                },
              }}
            />
          </Box>

          <Alert
            severity="warning"
            sx={{
              borderRadius: 1,
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Consider these alternatives:
            </Typography>
            <List dense disablePadding>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary="• Take a break - just log out for a while"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary="• Update your privacy settings instead"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary="• Contact support if you're having issues"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Alert>
        </Box>
      </DialogContent>

      {/* Action Buttons */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider',
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{
            textTransform: 'none',
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDeactivate}
          disabled={!isConfirmValid || loading}
          variant="contained"
          color="error"
          sx={{
            textTransform: 'none',
            px: 3,
          }}
        >
          {loading ? "Deactivating..." : "Deactivate Account"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeactivateAccountModal;