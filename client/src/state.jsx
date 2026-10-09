import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, token } from './api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

export function AppProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(() => load('wcc_cart', []));
  const [wishlist, setWishlist] = useState(() => load('wcc_wish', []));
  const [coupon, setCoupon] = useState(() => load('wcc_coupon', ''));
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState('');
  const [enquiry, setEnquiry] = useState(null); // {kind}

  useEffect(() => { api.get('/config').then(setConfig).catch(() => setConfig({ menu: [], freeShippingMin: 450, shippingFee: 49, siteName: 'Way Cup Chai' })); }, []);
  useEffect(() => { if (token.get()) api.get('/auth/me').then(r => setUser(r.user)).catch(() => token.set(null)); }, []);
  useEffect(() => store('wcc_cart', cart), [cart]);
  useEffect(() => store('wcc_wish', wishlist), [wishlist]);
  useEffect(() => store('wcc_coupon', coupon), [coupon]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  const addToCart = useCallback((product, variant, qty = 1, open = true) => {
    setCart(c => {
      const i = c.findIndex(x => x.productId === product.id && x.variantId === variant.id);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: Math.min(50, n[i].qty + qty) }; return n; }
      return [...c, { productId: product.id, variantId: variant.id, qty, name: product.name, slug: product.slug, image: product.images[0], label: variant.label, price: variant.price, mrp: variant.mrp }];
    });
    setToast(`${product.name} added to cart`);
    if (open) setDrawer(true);
  }, []);
  const setQty = (productId, variantId, qty) => setCart(c => qty < 1 ? c.filter(x => !(x.productId === productId && x.variantId === variantId)) : c.map(x => x.productId === productId && x.variantId === variantId ? { ...x, qty: Math.min(50, qty) } : x));
  const clearCart = () => { setCart([]); setCoupon(''); };
  const toggleWish = (id) => setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);

  const login = (res) => { token.set(res.token); setUser(res.user); };
  const logout = () => { token.set(null); setUser(null); };

  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const cartSubtotal = cart.reduce((s, x) => s + x.qty * x.price, 0);

  const value = useMemo(() => ({
    config, user, setUser, login, logout, cart, addToCart, setQty, clearCart, cartCount, cartSubtotal, coupon, setCoupon,
    wishlist, toggleWish, drawer, setDrawer, toast, setToast, enquiry, setEnquiry,
  }), [config, user, cart, coupon, wishlist, drawer, toast, enquiry, addToCart, cartCount, cartSubtotal]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
