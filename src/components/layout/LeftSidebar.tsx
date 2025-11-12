import React, { useState, useEffect } from "react";
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Divider, Badge } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../../context/UserContext";
import {
  Home as HomeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Bookmark as BookmarkIcon,
  Settings as SettingsIcon,
  Public as PublicIcon,
  SportsFootball as SportsIcon,
  Movie as MovieIcon,
  ShoppingBag as MarketIcon,
  Storefront as SellIcon,
  Receipt as OrdersIcon,
} from "@mui/icons-material";

const LeftSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, token } = useUserContext();
  const [hasWorldFilter, setHasWorldFilter] = useState(false);
  const [hasSportsFilter, setHasSportsFilter] = useState(false);

  useEffect(() => {
    // Check if filters are set
    const worldCountry = localStorage.getItem('newsWorldCountry');
    const sport = localStorage.getItem('newsSport');
    setHasWorldFilter(worldCountry !== null && worldCountry !== 'us');
    setHasSportsFilter(sport !== null && sport !== 'all');
  }, [location]);

  if (!user || !token) return null;

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: <HomeIcon />, label: "Home", path: "/dashboard" },
    { icon: <PersonIcon />, label: "Profile", path: `/profile/${user.id}` },
    { icon: <GroupIcon />, label: "Friends", path: "/friends" },
    { icon: <MarketIcon />, label: "Market", path: "/market" },
    { icon: <SellIcon />, label: "Sell Product", path: "/sell" },
    { icon: <OrdersIcon />, label: "My Orders", path: "/orders" },
    { icon: <BookmarkIcon />, label: "Watch List", path: "/saved" },
  ];

  const newsItems = [
    { icon: <PublicIcon />, label: "World News", path: "/news/world" },
    { icon: <SportsIcon />, label: "Sports", path: "/news/sports", hasSettings: true },
    { icon: <MovieIcon />, label: "Entertainment", path: "/news/entertainment" },
  ];

  return (
    <Box
      sx={{
        position: "sticky",
        top: { xs: 56, sm: 64 },
        height: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
        overflowY: "auto",
        overflowX: "hidden",
        display: { xs: "none", lg: "block" },
        width: { lg: 260, xl: 280 },
        minWidth: { lg: 260, xl: 280 },
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
      <List>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={() => navigate(`/profile/${user.id}`)}
            sx={{ 
              borderRadius: 2, 
              py: 1.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateX(4px)',
                bgcolor: 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 48 }}>
              <Avatar
                src={user.profile_image || ""}
                alt={user.first_name}
                sx={{ width: 36, height: 36 }}
              />
            </ListItemIcon>
            <ListItemText
              primary={`${user.first_name} ${user.last_name || ""}`}
              slotProps={{
                primary: { style: { fontWeight: 600, fontSize: "0.95rem" } }
              }}
            />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1 }} />

        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{ 
                borderRadius: 2, 
                py: 1.5,
                bgcolor: isActive(item.path) ? 'action.selected' : 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateX(4px)',
                  bgcolor: isActive(item.path) ? 'action.selected' : 'action.hover',
                }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 48, 
                color: isActive(item.path) ? "primary.main" : "text.secondary",
                transition: 'color 0.2s ease-in-out'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { 
                    style: { 
                      fontWeight: isActive(item.path) ? 600 : 500, 
                      fontSize: "0.95rem",
                      transition: 'font-weight 0.2s ease-in-out'
                    } 
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        <Divider sx={{ my: 1 }} />

        {newsItems.map((item) => {
          const showBadge = 
            (item.path === '/news/world' && hasWorldFilter) ||
            (item.path === '/news/sports' && hasSportsFilter);
          
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{ 
                  borderRadius: 2, 
                  py: 1.5,
                  bgcolor: isActive(item.path) ? 'action.selected' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    bgcolor: isActive(item.path) ? 'action.selected' : 'action.hover',
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 48, 
                  color: isActive(item.path) ? "primary.main" : "text.secondary",
                  transition: 'color 0.2s ease-in-out'
                }}>
                  <Badge 
                    variant="dot" 
                    color="primary" 
                    invisible={!showBadge}
                    sx={{
                      '& .MuiBadge-badge': {
                        right: 2,
                        top: 2,
                      }
                    }}
                  >
                    {item.icon}
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: { 
                      style: { 
                        fontWeight: isActive(item.path) ? 600 : 500, 
                        fontSize: "0.95rem",
                        transition: 'font-weight 0.2s ease-in-out'
                      } 
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        <Divider sx={{ my: 1 }} />

        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => navigate("/settings")}
            sx={{ 
              borderRadius: 2, 
              py: 1.5,
              bgcolor: isActive("/settings") ? 'action.selected' : 'transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateX(4px)',
                bgcolor: isActive("/settings") ? 'action.selected' : 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 48, 
              color: isActive("/settings") ? "primary.main" : "text.secondary",
              transition: 'color 0.2s ease-in-out'
            }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              slotProps={{
                primary: { 
                  style: { 
                    fontWeight: isActive("/settings") ? 600 : 500, 
                    fontSize: "0.95rem",
                    transition: 'font-weight 0.2s ease-in-out'
                  } 
                }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default LeftSidebar;
