import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, rupee } from '../api';
import { useApp } from '../state';
import { PageHero, useSeo } from '../components/Common';
import { useCartPricing, CouponBox, Totals } from './Cart';

const STATES = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Delhi', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Bihar', 'Odisha', 'Assam', 'Punjab', 'Haryana', 'Chhattisgarh', 'Jharkhand', 'Uttarakhand', 'Himachal Pradesh', 'Goa', 'Jammu & Kashmir', 'Other'];

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = resolve; s.onerror = () => reject(new Error('Could not load payment gateway'));
    document.body.appendChild(s);
  });
}

export default function Checkout() {
  useSeo('Checkout');
  const { cart, coupon, user, config, clearCart } = useApp();
  const { pricing, error } = useCartPricing();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', phone: '', email: '', line1: '', city: '', state: 'Andhra Pradesh', pincode: '', notes: '' });
  const [method, setMethod] = useState('cod');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (user) { const a = (user.addresses || [])[0] || {}; setF(x => ({ ...x, name: x.name || user.name, phone: x.phone || user.phone || '', email: x.email || user.email, line1: x.line1 || a.line1 || '', city: x.city || a.city || '', state: a.state || x.state, pincode: x.pincode || a.pincode || '' })); }
  }, [user]);

  if (!cart.length) return <div className="wrap section center"><h2>Your cart is empty</h2><Link className="btn" to="/shop">Shop chai</Link></div>;

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const res = await api.post('/orders', {
        items: cart.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })), coupon, paymentMethod: method, notes: f.notes,
        customer: { name: f.name, phone: f.phone, email: f.email }, address: { line1: f.line1, city: f.city, state: f.state, pincode: f.pincode },
      });
      if (res.paymentMethod === 'razorpay' && res.razorpay) {
        await loadRazorpay();
        const rz = new window.Razorpay({
          key: res.razorpay.keyId, amount: res.razorpay.amount, currency: 'INR', name: 'Way Cup Chai', description: `Order ${res.orderNo}`, order_id: res.razorpay.orderId,
          prefill: { name: f.name, email: f.email, contact: f.phone }, theme: { color: '#4a0f22' },
          handler: async (r) => {
            try { await api.post('/payments/razorpay/verify', { orderNo: res.orderNo, ...r }); clearCart(); nav(`/order-success/${res.orderNo}`); }
            catch (ex) { setErr(ex.message + ' - if money was deducted, contact us with order ' + res.orderNo); setBusy(false); }
          },
          modal: { ondismiss: () => { setBusy(false); setErr(`Payment not completed. Your order ${res.orderNo} is pending - you can try again.`); } },
        });
        rz.open();
        return;
      }
      clearCart(); nav(`/order-success/${res.orderNo}`);
    } catch (ex) { setErr(ex.message); setBusy(false); }
  };

  return (
    <>
      <PageHero title="Checkout" />
      <div className="wrap section">
        <form className="cart-grid" onSubmit={submit}>
          <div className="form card">
            {!user && <p className="muted">Have an account? <Link to="/account">Log in</Link> for faster checkout &mdash; or continue as guest.</p>}
            <h3>Contact</h3>
            <div className="grid2"><label>Full name*<input required value={f.name} onChange={set('name')} autoComplete="name" /></label><label>Phone*<input required value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" /></label></div>
            <label>Email (for order updates)<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
            <h3>Delivery address</h3>
            <label>Address*<textarea required rows={2} value={f.line1} onChange={set('line1')} autoComplete="street-address" /></label>
            <div className="grid3"><label>City*<input required value={f.city} onChange={set('city')} autoComplete="address-level2" /></label>
              <label>State*<select value={f.state} onChange={set('state')}>{STATES.map(s => <option key={s}>{s}</option>)}</select></label>
              <label>Pincode*<input required value={f.pincode} onChange={e => setF({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} inputMode="numeric" autoComplete="postal-code" /></label></div>
            <label>Order notes (optional)<input value={f.notes} onChange={set('notes')} placeholder="e.g. less sugar-ready pack, call before delivery" /></label>
            <h3>Payment</h3>
            <label className={`pay ${method === 'cod' ? 'on' : ''}`}><input type="radio" name="pay" checked={method === 'cod'} onChange={() => setMethod('cod')} /> Cash on Delivery</label>
            <label className={`pay ${method === 'razorpay' ? 'on' : ''} ${config && !config.onlinePayments ? 'dis' : ''}`}><input type="radio" name="pay" disabled={config && !config.onlinePayments} checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} /> UPI / Cards / Netbanking (Razorpay){config && !config.onlinePayments && <small> &mdash; coming soon</small>}</label>
          </div>
          <aside className="summary">
            <h3>Your order</h3>
            {cart.map(it => <div className="mini" key={it.productId + it.variantId}><img src={it.image} alt="" /><span>{it.name}<small>{it.label} &times; {it.qty}</small></span><b>{rupee(it.price * it.qty)}</b></div>)}
            <CouponBox />
            {error && <p className="err">{error}</p>}
            <Totals pricing={pricing} />
            {err && <p className="err">{err}</p>}
            <button className="btn block" disabled={busy || !pricing}>{busy ? 'Please wait...' : method === 'cod' ? `Place order ${pricing ? '- ' + rupee(pricing.total) : ''}` : `Pay ${pricing ? rupee(pricing.total) : ''}`}</button>
            <small className="muted center-link">By placing your order you agree to our <Link to="/terms">Terms</Link> and <Link to="/return-refund">Return policy</Link>.</small>
          </aside>
        </form>
      </div>
    </>
  );
}
