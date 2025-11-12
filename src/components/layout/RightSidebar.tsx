import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Paper, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/UserContext";

interface SuggestedUser {
  id: number;
  username: string;
  first_name: string;
  last_name?: string;
  profile_image?: string;
}

const RightSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useUserContext();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch suggested users (you can implement this API endpoint)
    const fetchSuggested = async () => {
      try {
        // Placeholder - implement your API call here
        // const response = await fetch(`${API_URL}/api/users/suggested`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // const data = await response.json();
        // setSuggestedUsers(data);
        
        // Mock data for now
        setSuggestedUsers([]);
      } catch (error) {
        console.error("Failed to fetch suggested users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggested();
  }, [token]);

  return (
    <Box
      sx={{
        position: "sticky",
        top: { xs: 56, sm: 64 },
        height: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
        overflowY: "auto",
        overflowX: "hidden",
        display: { xs: "none", lg: "block" },
        width: { lg: 300, xl: 320 },
        minWidth: { lg: 300, xl: 320 },
        p: 2,
        flexShrink: 0,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
        },
      }}
    >
      <Paper elevation={0} sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "text.secondary", fontSize: "0.95rem" }}>
          Suggested for you
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : suggestedUsers.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
            No suggestions available
          </Typography>
        ) : (
          <List disablePadding>
            {suggestedUsers.map((user) => (
              <ListItem key={user.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(`/profile/${user.id}`)}
                  sx={{ borderRadius: 2, py: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={user.profile_image || ""}
                      alt={user.first_name}
                      sx={{ width: 40, height: 40 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${user.first_name} ${user.last_name || ""}`}
                    secondary={`@${user.username}`}
                    slotProps={{
                      primary: { style: { fontWeight: 600, fontSize: "0.9rem" } },
                      secondary: { style: { fontSize: "0.8rem" } }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Contacts/Online Friends Section */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: "background.paper", borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "text.secondary", fontSize: "0.95rem" }}>
          Contacts
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
          No contacts online
        </Typography>
      </Paper>
    </Box>
  );
};

export default RightSidebar;
