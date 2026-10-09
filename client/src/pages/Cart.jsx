import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, rupee } from '../api';
import { useApp } from '../state';
import { PageHero, useSeo, useFetch } from '../components/Common';

export function useCartPricing() {
  const { cart, coupon, setCoupon } = useApp();
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!cart.length) { setPricing(null); setError(''); return; }
    let live = true;
    api.post('/cart/price', { items: cart.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })), coupon })
      .then(p => { if (live) { setPricing(p); setError(''); } })
      .catch(e => { if (live) { setError(e.message); if (/coupon/i.test(e.message)) setCoupon(''); } });
    return () => { live = false; };
  }, [cart, coupon, setCoupon]);
  return { pricing, error };
}

export function CouponBox() {
  const { coupon, setCoupon } = useApp();
  const [code, setCode] = useState('');
  const { data } = useFetch('/coupons/public');
  return (
    <div className="coupon">
      {coupon ? <p className="ok">Coupon <b>{coupon}</b> applied <button className="linklike" onClick={() => setCoupon('')}>Remove</button></p> : (
        <form onSubmit={e => { e.preventDefault(); if (code.trim()) { setCoupon(code.trim().toUpperCase()); setCode(''); } }}>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" /><button className="btn ghost sm">Apply</button>
        </form>
      )}
      {!coupon && data && data.length > 0 && <small className="muted">Try: {data.map(c => <button key={c.code} className="chip" onClick={() => setCoupon(c.code)}>{c.code}</button>)}</small>}
    </div>
  );
}

export function Totals({ pricing }) {
  if (!pricing) return null;
  return (
    <div className="totals">
      <div className="row"><span>Subtotal</span><span>{rupee(pricing.subtotal)}</span></div>
      {pricing.discount > 0 && <div className="row green"><span>Discount ({pricing.coupon})</span><span>&minus;{rupee(pricing.discount)}</span></div>}
      <div className="row"><span>Shipping</span><span>{pricing.shipping === 0 ? 'FREE' : rupee(pricing.shipping)}</span></div>
      <div className="row total"><span>Total</span><span>{rupee(pricing.total)}</span></div>
    </div>
  );
}

export default function Cart() {
  useSeo('Your cart');
  const { cart, setQty } = useApp();
  const { pricing, error } = useCartPricing();
  const nav = useNavigate();
  return (
    <>
      <PageHero title="Your cart" />
      <div className="wrap section">
        {cart.length === 0 ? <div className="empty center"><p>Your cart is empty.</p><Link className="btn" to="/shop">Continue shopping</Link></div> : (
          <div className="cart-grid">
            <div>
              {cart.map(it => (
                <div className="cart-row" key={it.productId + it.variantId}>
                  <img src={it.image} alt="" />
                  <div className="grow"><Link to={`/product/${it.slug}`}><b>{it.name}</b></Link><small>{it.label} &middot; {rupee(it.price)} each</small></div>
                  <div className="qty"><button onClick={() => setQty(it.productId, it.variantId, it.qty - 1)} aria-label="Decrease">&minus;</button><span>{it.qty}</span><button onClick={() => setQty(it.productId, it.variantId, it.qty + 1)} aria-label="Increase">+</button></div>
                  <b className="line-total">{rupee(it.price * it.qty)}</b>
                  <button className="icon-btn" onClick={() => setQty(it.productId, it.variantId, 0)} aria-label="Remove">&#10005;</button>
                </div>
              ))}
            </div>
            <aside className="summary">
              <h3>Order summary</h3>
              <CouponBox />
              {error && <p className="err">{error}</p>}
              <Totals pricing={pricing} />
              <button className="btn block" disabled={!pricing} onClick={() => nav('/checkout')}>Proceed to checkout</button>
              <Link to="/shop" className="center-link">Continue shopping</Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

export function OrderSuccess() {
  useSeo('Order placed');
  const { orderNo } = useParams();
  const { data } = useFetch(`/orders/${orderNo}/summary`);
  return (
    <div className="wrap section center narrow">
      <div className="success-icon">&#10003;</div>
      <h1>Thank you! Your order is placed.</h1>
      <p>Order number <b>{orderNo}</b>{data ? <> &middot; Total <b>{rupee(data.total)}</b> ({data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online'})</> : null}</p>
      <p className="muted">We'll call or message you on your phone to confirm. Save your order number to track your delivery.</p>
      <div className="hero-cta center"><Link className="btn" to="/track-order">Track order</Link><Link className="btn ghost" to="/shop">Continue shopping</Link></div>
    </div>
  );
}
