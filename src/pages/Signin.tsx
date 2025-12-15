import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import { Box, Paper, TextField, Button, Typography, Alert } from "@mui/material";
import { ShoppingBag as ShoppingBagIcon } from "@mui/icons-material";


const Signin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const { setToken } = useUserContext();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Signin failed");
        return;
      }

      // Store token, sessionId, and login time
      setToken(data.token);
      if (data.sessionId) {
        localStorage.setItem("sessionId", data.sessionId);
        localStorage.setItem("loginTime", new Date().toISOString());
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          maxWidth: 900,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Left side - branding */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            bgcolor: 'primary.main',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            gap: 2,
          }}
        >
          <ShoppingBagIcon sx={{ width: 80, height: 80, color: 'white' }} />
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
            Gsale
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
            Buy, sell, and discover amazing garage sale deals in your area.
          </Typography>
        </Box>

        {/* Right side - form */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', color: 'text.primary' }}>
            Sign In
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              type="text"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              variant="outlined"
            />

            <TextField
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Sign In
            </Button>
          </Box>

          {message && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {message}
            </Alert>
          )}

          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{
                color: 'inherit',
                fontWeight: 600,
              }}
            >
              <Typography component="span" sx={{ color: 'primary.main', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                Sign Up
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signin;
