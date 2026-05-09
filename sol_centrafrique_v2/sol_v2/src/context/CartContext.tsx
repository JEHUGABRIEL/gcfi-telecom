import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  title: string;
  price?: string;
  image?: string;
  type: 'service' | 'product';
  category?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isCartAnimating: boolean;
  ratings: Record<string, number>;
  addRating: (id: string, rating: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('sol_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('sol_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('sol_ratings');
    return saved ? JSON.parse(saved) : {};
  });

  const [isCartAnimating, setIsCartAnimating] = useState(false);

  useEffect(() => {
    localStorage.setItem('sol_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('sol_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('sol_ratings', JSON.stringify(ratings));
  }, [ratings]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
    
    // Trigger animation
    setIsCartAnimating(true);
    setTimeout(() => setIsCartAnimating(false), 1000);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((favId) => favId !== id);
      }
      return [...prev, id];
    });
  };

  const addRating = (id: string, rating: number) => {
    setRatings(prev => ({ ...prev, [id]: rating }));
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      itemCount: cart.length,
      favorites,
      toggleFavorite,
      isCartAnimating,
      ratings,
      addRating
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
