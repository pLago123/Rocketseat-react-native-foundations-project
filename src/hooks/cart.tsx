import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedData = await AsyncStorage.getItem('@GoMarketplace');

      if (storagedData) setProducts([...JSON.parse(storagedData)]);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const isRegistered = products.find(p => p.id === product.id);

      if (isRegistered) {
        setProducts(
          products.map(p =>
            p.id === product.id
              ? {
                  ...p,
                  quantity: p.quantity + 1,
                }
              : p,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace',
        JSON.stringify([...products]),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(p =>
          p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace',
        JSON.stringify([...products]),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const items = products.map(p =>
        p.id === id && p.quantity > 0 ? { ...p, quantity: p.quantity - 1 } : p,
      );

      setProducts(items.filter(i => i.quantity > 0));

      await AsyncStorage.setItem(
        '@GoMarketplace',
        JSON.stringify([...products]),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
