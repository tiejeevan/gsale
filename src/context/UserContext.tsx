// src/context/UserContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { type User, userService } from "../services/userService";

interface UserContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  fetchMe: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  changeUserPassword: (oldPassword: string, newPassword: string) => Promise<void>;
  deactivateUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem("sessionId"));
  const [loginTime, setLoginTime] = useState<string | null>(() => localStorage.getItem("loginTime"));

  const isAuthenticated = !!currentUser;

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) {
      localStorage.setItem("token", t);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("loginTime");
      setSessionId(null);
      setLoginTime(null);
    }
  };

  const fetchMe = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      console.log("Fetching user with token...");
      const user = await userService.getMe(token);
      console.log("User fetched successfully:", user);
      setCurrentUser(user);
    } catch (err: any) {
      console.error("Failed to fetch user:", err);
      console.log("Error status:", err.status);
      console.log("Error message:", err.message);
      
      // If unauthorized (401), token is expired - logout user
      if (err.status === 401 || err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        console.log("🚨 Token expired (401), logging out and redirecting...");
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      } else {
        console.log("Non-401 error, clearing user but not redirecting");
        setCurrentUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!token) return;
    const updated = await userService.updateProfile(token, data);
    setCurrentUser(updated);
  };

  const changeUserPassword = async (oldPassword: string, newPassword: string) => {
    if (!token) throw new Error("No token found");
    await userService.changePassword(token, oldPassword, newPassword);
  };

  const deactivateUser = async () => {
    if (!token) throw new Error("No token found");
    await userService.deactivateAccount(token);
    logout();
  };

  const logout = async () => {
    // Log logout activity to backend
    if (currentUser && token) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        await fetch(`${API_URL}/api/auth/signout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            userId: currentUser.id,
            sessionId: sessionId,
            loginTime: loginTime
          })
        });
      } catch (err) {
        console.error('Failed to log signout activity:', err);
        // Continue with logout even if logging fails
      }
    }
    
    setCurrentUser(null);
    setToken(null);
    navigate('/login');
  };

  // On mount, fetch user if token exists
  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setIsLoading(false);
      // If no token and not on login/signup page, redirect to login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        navigate('/login');
      }
    }
  }, [token]);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated,
        isLoading,
        setToken,
        fetchMe,
        updateUser,
        changeUserPassword,
        deactivateUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook to use context
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContext must be used within UserProvider");
  return context;
};
