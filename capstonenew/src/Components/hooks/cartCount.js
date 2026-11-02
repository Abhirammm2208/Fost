import { useState, useEffect } from 'react';

export const useCartCount = () => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Function to update cart count
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
      setCartCount(totalItems);
    };

    // Update cart count on initial load
    updateCartCount();

    // Listen for cart update events
    window.addEventListener('cartUpdate', updateCartCount);

    // Add listener for storage changes (cross-tab synchronization)
    window.addEventListener('storage', updateCartCount);

    // Cleanup listeners
    return () => {
      window.removeEventListener('cartUpdate', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  return cartCount;
};