// src/context/UserContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!currentUser;

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  };

  const fetchMe = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const user = await userService.getMe(token);
      setCurrentUser(user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setCurrentUser(null);
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

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
  };

  // On mount, fetch user if token exists
  useEffect(() => {
    if (token) fetchMe();
    else setIsLoading(false);
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
