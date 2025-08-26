import React, { createContext, useContext, useState, useEffect } from 'react';

export interface VPSPlan {
  id: string;
  name: string;
  cpu: number;
  ram: number;
  storage: number;
  bandwidth: number;
  price: number;
  features: string[];
}

interface CartItem extends VPSPlan {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (plan: VPSPlan) => void;
  removeFromCart: (planId: string) => void;
  updateQuantity: (planId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (plan: VPSPlan) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === plan.id);
      if (existing) {
        return prev.map(item =>
          item.id === plan.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...plan, quantity: 1 }];
    });
  };

  const removeFromCart = (planId: string) => {
    setItems(prev => prev.filter(item => item.id !== planId));
  };

  const updateQuantity = (planId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(planId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === planId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}