// components/cart/CartIcon.tsx
import React from 'react';
import { IconButton, Badge } from '@mui/material';
import { ShoppingCart as CartIcon } from '@mui/icons-material';
import { useCart } from '../../context/CartContext';

interface CartIconButtonProps {
  onClick: () => void;
}

const CartIconButton: React.FC<CartIconButtonProps> = ({ onClick }) => {
  const { itemCount } = useCart();

  return (
    <IconButton color="inherit" onClick={onClick}>
      <Badge badgeContent={itemCount} color="error">
        <CartIcon />
      </Badge>
    </IconButton>
  );
};

export default CartIconButton;
