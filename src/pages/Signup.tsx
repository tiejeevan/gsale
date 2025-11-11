import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import { Box, Paper, TextField, Button, Typography, Alert } from "@mui/material";

const Signup: React.FC = () => {
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const { setToken } = useUserContext();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Signup failed");
        return;
      }

      setToken(data.token);
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
          width: '100%',
          maxWidth: 500,
          borderRadius: 4,
          p: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 2, color: 'text.primary' }}>
          Create your Gsale Account
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
          Buy, sell, and discover amazing garage sale items in your area.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              type="text"
              label="First Name"
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              required
              fullWidth
              variant="outlined"
            />
            <TextField
              type="text"
              label="Last Name"
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
              required
              fullWidth
              variant="outlined"
            />
          </Box>

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
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              mt: 1,
            }}
          >
            Sign Up
          </Button>
        </Box>

        {message && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}

        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: 'inherit' }}>
            <Typography component="span" sx={{ color: 'primary.main', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
              Login
            </Typography>
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Signup;
