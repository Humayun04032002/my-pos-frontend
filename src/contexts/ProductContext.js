// src/contexts/ProductContext.js
import { createContext } from 'react';

// ProductContext provides product data, cart state, and related functions.
// This context will be used by ProductList, Cart, and Checkout components.
// It also now provides setAppMessage for global notifications.
export const ProductContext = createContext();
