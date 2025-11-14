// context/CartContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { cartService, type Cart, type CartItem } from '../services/cartService';
import { useUserContext } from './UserContext';

interface CartContextType {
  cart: Cart | null;
  cartItems: CartItem[];
  itemCount: number;
  totalAmount: number;
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity: number, selectedAttributes?: any) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  validateCart: () => Promise<{ valid: boolean; issues: string[] }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useUserContext();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart on mount and when token changes - DISABLED
  // useEffect(() => {
  //   if (token) {
  //     refreshCart();
  //   } else {
  //     setCart(null);
  //   }
  // }, [token]);

  const refreshCart = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await cartService.getCart(token);
      if (response.success) {
        setCart(response.cart);
      } else {
        setError(response.error || 'Failed to fetch cart');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number, selectedAttributes?: any): Promise<boolean> => {
    if (!token) {
      setError('Please login to add items to cart');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await cartService.addToCart(token, productId, quantity, selectedAttributes);
      if (response.success && response.cart) {
        setCart(response.cart);
        return true;
      } else {
        setError(response.message || response.error || 'Failed to add item to cart');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    if (!token) return false;

    setLoading(true);
    setError(null);
    try {
      const response = await cartService.updateCartItem(token, itemId, quantity);
      if (response.success && response.cart) {
        setCart(response.cart);
        return true;
      } else {
        setError(response.message || response.error || 'Failed to update quantity');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update quantity');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string): Promise<boolean> => {
    if (!token) return false;

    setLoading(true);
    setError(null);
    try {
      const response = await cartService.removeFromCart(token, itemId);
      if (response.success && response.cart) {
        setCart(response.cart);
        return true;
      } else {
        setError(response.message || response.error || 'Failed to remove item');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (!token) return false;

    setLoading(true);
    setError(null);
    try {
      const response = await cartService.clearCart(token);
      if (response.success) {
        setCart(null);
        return true;
      } else {
        setError(response.message || response.error || 'Failed to clear cart');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateCart = async (): Promise<{ valid: boolean; issues: string[] }> => {
    if (!token) return { valid: false, issues: ['Please login'] };

    try {
      const response = await cartService.validateCart(token);
      if (response.success) {
        return {
          valid: response.valid,
          issues: response.issues
        };
      }
      return { valid: false, issues: ['Failed to validate cart'] };
    } catch (err: any) {
      return { valid: false, issues: [err.message || 'Failed to validate cart'] };
    }
  };

  const cartItems = cart?.items || [];
  const itemCount = cart?.total_items || 0;
  const totalAmount = cart?.total_amount || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        itemCount,
        totalAmount,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        validateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
