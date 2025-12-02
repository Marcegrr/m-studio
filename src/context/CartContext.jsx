import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  // Load cart from localStorage on mount
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('mstudio-cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mstudio-cart', JSON.stringify(cart));
  }, [cart]);

  // Add item to cart or increase quantity if already exists
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Increase quantity if not exceeding stock
        if (existing.quantity < product.stock) {
          return prev.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prev; // Don't add if at stock limit
      }
      // Add new item with quantity 1
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Remove one unit or remove item if quantity becomes 0
  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      // Remove item completely if quantity is 1
      return prev.filter(item => item.id !== productId);
    });
  };

  // Remove item completely regardless of quantity
  const deleteFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Get total items count
  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Get total price
  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    deleteFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
