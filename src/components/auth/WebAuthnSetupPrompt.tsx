import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon 
} from '@mui/icons-material';
import WebAuthnService from '../../services/webauthn';

interface WebAuthnSetupPromptProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

const WebAuthnSetupPrompt: React.FC<WebAuthnSetupPromptProps> = ({ 
  open, 
  onClose, 
  userId, 
  userName 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSetupWebAuthn = async () => {
    setLoading(true);
    setError('');

    try {
      await WebAuthnService.register(userId);
      setSuccess('WebAuthn authenticator registered successfully! You can now use passwordless login.');
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      const errorMessage = WebAuthnService.getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Secure Your Account
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {!success && (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <FingerprintIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Welcome, {userName}!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Set up passwordless authentication for faster and more secure login.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Benefits of WebAuthn:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  🔒 More secure than passwords
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  ⚡ Faster login with biometrics
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  🛡️ Phishing protection
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  📱 Works on all your devices
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FingerprintIcon />}
                onClick={handleSetupWebAuthn}
                disabled={loading}
                sx={{ py: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Set Up Biometric Login'}
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={handleSkip}
                disabled={loading}
                sx={{ py: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                Skip for Now
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              This will use your device's built-in security (fingerprint, face recognition, etc.)
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
              You can set this up later in your account settings
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WebAuthnSetupPrompt;