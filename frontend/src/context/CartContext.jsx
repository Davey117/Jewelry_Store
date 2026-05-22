import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('aurum_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('aurum_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const targetSize = product.chosenSize || null;
    
    setCart((prevCart) => {
      // Uniquely identify items by matching both the product ID and its selected size variation
      const existingItem = prevCart.find(
        item => item.id === product.id && item.chosenSize === targetSize
      );
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
            alert(`You cannot add more than the available stock (${product.stock_quantity}).`);
            return prevCart;
        }
        return prevCart.map(item => 
          (item.id === product.id && item.chosenSize === targetSize) 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      return [...prevCart, { ...product, quantity: 1, chosenSize: targetSize }];
    });
    setIsCartOpen(true); 
  };

  const removeFromCart = (productId, chosenSize = null) => {
    setCart((prevCart) => 
      prevCart.filter(item => !(item.id === productId && item.chosenSize === chosenSize))
    );
  };

  const updateQuantity = (productId, chosenSize = null, amount) => {
    setCart((prevCart) => prevCart.map(item => {
      if (item.id === productId && item.chosenSize === chosenSize) {
        const newQuantity = item.quantity + amount;
        if (newQuantity > 0 && newQuantity <= item.stock_quantity) {
            return { ...item, quantity: newQuantity };
        }
      }
      return item;
    }));
  };
  
  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      isCartOpen, setIsCartOpen, cartTotal, cartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};