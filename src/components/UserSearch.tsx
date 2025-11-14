import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  InputBase,
  ListItemButton,
} from "@mui/material";
import { SearchOutlined as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import { getUserSuggestions, type UserSuggestion } from "../services/userService";

interface UserSearchProps {
  token: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ token }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search function
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await getUserSuggestions(query, token, 5);
        if (response.success) {
          setResults(response.suggestions);
          setShowResults(response.suggestions.length > 0);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, token]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setShowResults(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
    setQuery("");
    setResults([]);
    setShowResults(false);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setShowResults(false);
    setQuery("");
    setResults([]);
  };

  const getDisplayName = (user: UserSuggestion) => {
    if (user.display_name) return user.display_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    return user.username;
  };

  return (
    <Box ref={searchRef} sx={{ position: "relative" }}>
      {/* Search Container */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: isExpanded ? { xs: "200px", sm: "300px" } : "32px",
          height: "32px",
          backgroundColor: isExpanded ? "background.paper" : "transparent",
          borderRadius: "20px",
          border: isExpanded ? "1px solid" : "none",
          borderColor: "divider",
          transition: "all 0.3s ease-in-out",
          overflow: "hidden",
        }}
      >
        {/* Search Icon Button */}
        {!isExpanded && (
          <IconButton
            onClick={handleExpand}
            sx={{
              color: "text.primary",
              p: 0,
            }}
          >
            <SearchIcon sx={{ fontSize: 34 }} />
          </IconButton>
        )}

        {/* Expanded Search Input */}
        {isExpanded && (
          <>
            <Box sx={{ pl: 2, display: "flex", alignItems: "center", color: "action.active" }}>
              <SearchIcon fontSize="small" />
            </Box>
            <InputBase
              inputRef={inputRef}
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                flex: 1,
                px: 1,
                fontSize: "14px",
                "& input::placeholder": {
                  opacity: 0.7,
                },
              }}
            />
            {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
            {!loading && query && (
              <IconButton size="small" onClick={handleClose} sx={{ mr: 0.5 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </>
        )}
      </Box>

      {/* Results Dropdown */}
      {showResults && isExpanded && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: { xs: "250px", sm: "300px" },
            maxHeight: 400,
            overflow: "auto",
            zIndex: 1300,
            borderRadius: 2,
          }}
        >
          {results.length > 0 ? (
            <List sx={{ py: 0 }}>
              {results.map((user) => (
                <ListItem
                  key={user.id}
                  disablePadding
                >
                  <ListItemButton
                    onClick={() => handleUserClick(user.username)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={
                          user.profile_image ||
                          "https://static.vecteezy.com/system/resources/previews/009/292/244/original/default-avatar-icon-of-social-media-user-vector.jpg"
                        }
                        alt={getDisplayName(user)}
                        sx={{ width: 32, height: 32 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {getDisplayName(user)}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          @{user.username}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                {query.length < 2 ? "Type at least 2 characters" : "No users found"}
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default UserSearch;
