import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Load initial cart from local storage so it survives page refreshes
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('aurum_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auto-save to local storage whenever the cart changes
  useEffect(() => {
    localStorage.setItem('aurum_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      // Check if item is already in the cart
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        // If it exists, check against available stock
        if (existingItem.quantity >= product.stock_quantity) {
            alert(`You cannot add more than the available stock (${product.stock_quantity}).`);
            return prevCart;
        }
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // If it's new, add it with a quantity of 1
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true); // Automatically slide the cart open!
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, amount) => {
    setCart((prevCart) => prevCart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + amount;
        // Don't let quantity drop below 1 (use remove instead)
        // Don't let it exceed stock limits
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