const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const L = require('../lib');

const r = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again in a few minutes.' } });
const formLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many submissions. Please try later.' } });

// Navigation tree (mirrors Teafloor's mega menu, adapted for Way Cup Chai)
const MENU = [
  { label: 'Chai & Tea', groups: [
    { title: 'Classic Chai', links: [
      { label: 'CTC Chai', to: '/shop?type=ctc-tea' }, { label: 'Masala Chai', to: '/shop?collection=masala' },
      { label: 'Green Tea', to: '/shop?type=green-tea' }, { label: 'Herbal Tea', to: '/shop?type=herbal-tea' },
      { label: 'Assam Tea', to: '/shop?region=assam' } ] },
    { title: 'Wellness', links: [
      { label: 'All Wellness Tea', to: '/shop?collection=wellness' }, { label: 'Tulsi Green Chai', to: '/product/tulsi-green-chai' },
      { label: 'Immunity Picks', to: '/shop?tag=immunity' } ] },
    { title: 'Gourmet', links: [
      { label: 'All Gourmet', to: '/shop?collection=gourmet' }, { label: 'Dessert Chai', to: '/shop?tag=dessert' },
      { label: 'Kahwa', to: '/product/kahwa-saffron-almond-chai' }, { label: 'Rose & Vanilla', to: '/product/rose-vanilla-chai' } ] },
    { title: 'Shop by', links: [
      { label: 'Trending', to: '/trending' }, { label: 'Signature', to: '/signature' }, { label: 'Best Selling', to: '/best-selling' },
      { label: 'Offers', to: '/offers' } ] },
  ] },
  { label: 'Gifting', to: '/gifting' },
  { label: 'Wholesale', to: '/wholesale' },
  { label: 'Blog', to: '/blog' },
  { label: 'Our Story', to: '/sourcing' },
];

r.get('/config', (_req, res) => res.json({ ...L.config(), menu: MENU }));

// ---------- Products ----------
const pub = (p) => {
  const reviews = db.filter('reviews', x => x.productId === p.id && x.approved);
  const rating = reviews.length ? Math.round(reviews.reduce((s, x) => s + x.rating, 0) / reviews.length * 10) / 10 : 0;
  return { ...p, rating, reviewCount: reviews.length, fromPrice: Math.min(...p.variants.map(v => v.price)), fromMrp: Math.min(...p.variants.map(v => v.mrp)) };
};

r.get('/products', (req, res) => {
  const { type, collection, region, tag, q, sort, min, max } = req.query;
  let list = db.filter('products', p => p.active !== false);
  if (type) list = list.filter(p => p.type === type);
  if (collection) list = list.filter(p => p.collection === collection);
  if (region) list = list.filter(p => p.region === region);
  if (tag) list = list.filter(p => (p.tags || []).includes(tag));
  if (q) { const s = String(q).toLowerCase(); list = list.filter(p => [p.name, p.short, p.type, p.collection, p.ingredients].join(' ').toLowerCase().includes(s)); }
  let out = list.map(pub);
  if (min) out = out.filter(p => p.fromPrice >= Number(min));
  if (max) out = out.filter(p => p.fromPrice <= Number(max));
  if (sort === 'price-asc') out.sort((a, b) => a.fromPrice - b.fromPrice);
  else if (sort === 'price-desc') out.sort((a, b) => b.fromPrice - a.fromPrice);
  else if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'rating') out.sort((a, b) => b.rating - a.rating);
  res.json(out);
});

r.get('/products/:slug', (req, res) => {
  const p = db.find('products', x => x.slug === req.params.slug && x.active !== false);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  const reviews = db.filter('reviews', x => x.productId === p.id && x.approved).map(({ id, name, rating, text, createdAt }) => ({ id, name, rating, text, createdAt })).reverse();
  const related = db.filter('products', x => x.id !== p.id && x.active !== false && (x.collection === p.collection || x.type === p.type)).slice(0, 4).map(pub);
  res.json({ product: pub(p), reviews, related });
});

r.post('/reviews', formLimiter, L.optionalAuth, (req, res) => {
  const p = db.find('products', x => x.id === req.body.productId);
  const rating = parseInt(req.body.rating, 10);
  if (!p || !(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Invalid review' });
  const name = L.str(req.body.name || (req.user && req.user.name), 60), text = L.str(req.body.text, 1000);
  if (!name || text.length < 3) return res.status(400).json({ error: 'Please add your name and a short review' });
  db.insert('reviews', { id: L.uid('r'), productId: p.id, name, rating, text, approved: false, createdAt: new Date().toISOString() });
  res.json({ ok: true, message: 'Thanks! Your review will appear once approved.' });
});

// ---------- Coupons / cart pricing ----------
r.post('/cart/price', (req, res) => {
  try { const t = L.priceCart(req.body.items, req.body.coupon); res.json(t); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
r.get('/coupons/public', (_req, res) => res.json(db.filter('coupons', c => c.active).map(({ code, note, minOrder }) => ({ code, note, minOrder }))));

r.get('/pincode/:pin', (req, res) => {
  if (!L.isPin(req.params.pin)) return res.status(400).json({ error: 'Enter a valid 6-digit pincode' });
  const south = ['5', '6'].includes(req.params.pin[0]);
  res.json({ ok: true, message: `Delivery available. Estimated ${south ? '2-4' : '4-7'} business days.` });
});

// ---------- Auth ----------
r.post('/auth/register', authLimiter, (req, res) => {
  const name = L.str(req.body.name, 80), email = L.str(req.body.email, 120).toLowerCase(), phone = L.str(req.body.phone, 20), password = String(req.body.password || '');
  if (!name || !L.isEmail(email) || password.length < 6) return res.status(400).json({ error: 'Enter your name, a valid email and a password of 6+ characters' });
  if (phone && !L.isPhone(phone)) return res.status(400).json({ error: 'Enter a valid phone number' });
  if (db.find('users', u => u.email === email)) return res.status(409).json({ error: 'An account with this email already exists' });
  const user = db.insert('users', { id: L.uid('u'), name, email, phone, role: 'customer', hash: bcrypt.hashSync(password, 10), addresses: [], createdAt: new Date().toISOString() });
  res.json({ token: L.sign(user), user: L.publicUser(user) });
});
r.post('/auth/login', authLimiter, (req, res) => {
  const email = L.str(req.body.email, 120).toLowerCase();
  const user = db.find('users', u => u.email === email);
  if (!user || !bcrypt.compareSync(String(req.body.password || ''), user.hash)) return res.status(401).json({ error: 'Incorrect email or password' });
  res.json({ token: L.sign(user), user: L.publicUser(user) });
});
r.get('/auth/me', L.requireAuth, (req, res) => res.json({ user: L.publicUser(req.user) }));
r.put('/auth/me', L.requireAuth, (req, res) => {
  const patch = { name: L.str(req.body.name || req.user.name, 80), phone: L.str(req.body.phone, 20) };
  if (Array.isArray(req.body.addresses)) patch.addresses = req.body.addresses.slice(0, 5).map(a => ({ line1: L.str(a.line1, 200), city: L.str(a.city, 80), state: L.str(a.state, 80), pincode: L.str(a.pincode, 6) }));
  res.json({ user: L.publicUser(db.update('users', u => u.id === req.user.id, patch)) });
});

// ---------- Orders ----------
r.post('/orders', formLimiter, L.optionalAuth, async (req, res) => {
  try {
    const c = req.body.customer || {}, a = req.body.address || {};
    const customer = { name: L.str(c.name, 80), phone: L.str(c.phone, 20), email: L.str(c.email, 120).toLowerCase() };
    const address = { line1: L.str(a.line1, 200), city: L.str(a.city, 80), state: L.str(a.state, 80), pincode: L.str(a.pincode, 6) };
    if (!customer.name || !L.isPhone(customer.phone)) return res.status(400).json({ error: 'Please enter your name and a valid phone number' });
    if (customer.email && !L.isEmail(customer.email)) return res.status(400).json({ error: 'Enter a valid email' });
    if (!address.line1 || !address.city || !address.state || !L.isPin(address.pincode)) return res.status(400).json({ error: 'Please complete your delivery address with a valid pincode' });
    const method = req.body.paymentMethod === 'razorpay' ? 'razorpay' : 'cod';
    if (method === 'razorpay' && !L.config().onlinePayments) return res.status(400).json({ error: 'Online payment is not enabled yet. Please choose Cash on Delivery.' });

    const t = L.priceCart(req.body.items, req.body.coupon);
    const order = {
      id: L.uid('o'), orderNo: db.nextOrderNo(), userId: req.user ? req.user.id : null, customer, address,
      items: t.lines, subtotal: t.subtotal, discount: t.discount, coupon: t.coupon, shipping: t.shipping, total: t.total,
      paymentMethod: method, paymentStatus: method === 'cod' ? 'cod-pending' : 'awaiting-payment',
      status: method === 'cod' ? 'placed' : 'pending-payment', notes: L.str(req.body.notes, 300),
      timeline: [{ status: method === 'cod' ? 'placed' : 'pending-payment', at: new Date().toISOString() }], createdAt: new Date().toISOString(),
    };
    let rz = null;
    if (method === 'razorpay') {
      rz = await L.razorpayCreateOrder(order.total * 100, order.orderNo);
      order.razorpayOrderId = rz.id;
    }
    db.insert('orders', order);
    if (method === 'cod') reduceStock(order);
    if (method === 'cod') notifyOrder(order);
    res.json({ orderNo: order.orderNo, total: order.total, paymentMethod: method, razorpay: rz ? { orderId: rz.id, amount: rz.amount, keyId: process.env.RAZORPAY_KEY_ID } : null });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

r.post('/payments/razorpay/verify', (req, res) => {
  const { orderNo, razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig } = req.body || {};
  const order = db.find('orders', o => o.orderNo === orderNo && o.razorpayOrderId === oid);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!L.razorpayVerify(oid, pid, sig)) return res.status(400).json({ error: 'Payment verification failed' });
  if (order.paymentStatus !== 'paid') {
    const upd = db.update('orders', o => o.id === order.id, { paymentStatus: 'paid', status: 'placed', razorpayPaymentId: pid, timeline: [...order.timeline, { status: 'paid', at: new Date().toISOString() }] });
    reduceStock(upd); notifyOrder(upd);
  }
  res.json({ ok: true, orderNo });
});

function reduceStock(order) {
  const products = db.all('products');
  order.items.forEach(it => { const p = products.find(x => x.id === it.productId); const v = p && p.variants.find(x => x.id === it.variantId); if (v && v.stock != null) v.stock = Math.max(0, v.stock - it.qty); });
  db.set('products', products);
}
function notifyOrder(o) {
  const rows = o.items.map(i => `<tr><td>${L.esc(i.name)} (${L.esc(i.variantLabel)})</td><td>x${i.qty}</td><td>Rs.${i.total}</td></tr>`).join('');
  const html = `<h2>Way Cup Chai - Order ${o.orderNo}</h2><table cellpadding="6">${rows}</table><p>Subtotal Rs.${o.subtotal} | Discount Rs.${o.discount} | Shipping Rs.${o.shipping}<br><b>Total Rs.${o.total}</b> (${o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online'})</p><p>${L.esc(o.customer.name)}, ${L.esc(o.customer.phone)}<br>${L.esc(o.address.line1)}, ${L.esc(o.address.city)}, ${L.esc(o.address.state)} - ${L.esc(o.address.pincode)}</p>`;
  if (o.customer.email) L.sendMail(o.customer.email, `Your Way Cup Chai order ${o.orderNo}`, html);
  L.sendMail(process.env.MAIL_TO, `New order ${o.orderNo} - Rs.${o.total}`, html);
}

r.get('/orders/mine', L.requireAuth, (req, res) => res.json(db.filter('orders', o => o.userId === req.user.id).reverse()));
r.get('/orders/track', formLimiter, (req, res) => {
  const no = L.str(req.query.orderNo, 20).toUpperCase(), phone = L.str(req.query.phone, 20).replace(/\D/g, '');
  const o = db.find('orders', x => x.orderNo === no && x.customer.phone.replace(/\D/g, '').endsWith(phone.slice(-10)) && phone.length >= 10);
  if (!o) return res.status(404).json({ error: 'No order found. Check the order number and phone number.' });
  res.json({ orderNo: o.orderNo, status: o.status, paymentStatus: o.paymentStatus, total: o.total, items: o.items, timeline: o.timeline, trackingId: o.trackingId || '', courier: o.courier || '', createdAt: o.createdAt });
});
r.get('/orders/:orderNo/summary', (req, res) => {
  const o = db.find('orders', x => x.orderNo === req.params.orderNo);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  res.json({ orderNo: o.orderNo, total: o.total, status: o.status, paymentMethod: o.paymentMethod, items: o.items.length });
});

// ---------- Enquiries (wholesale / contact / events / gifting) ----------
r.post('/enquiries', formLimiter, (req, res) => {
  const b = req.body || {};
  const e = { id: L.uid('q'), kind: ['wholesale', 'contact', 'event', 'gifting'].includes(b.kind) ? b.kind : 'contact',
    name: L.str(b.name, 80), email: L.str(b.email, 120), phone: L.str(b.phone, 20), company: L.str(b.company, 120), country: L.str(b.country, 60) || 'India',
    requirement: L.str(b.requirement, 120), message: L.str(b.message, 1500), status: 'new', createdAt: new Date().toISOString() };
  if (!e.name || !L.isPhone(e.phone)) return res.status(400).json({ error: 'Please enter your name and a valid phone number' });
  if (e.email && !L.isEmail(e.email)) return res.status(400).json({ error: 'Enter a valid email' });
  db.insert('enquiries', e);
  L.sendMail(process.env.MAIL_TO, `New ${e.kind} enquiry from ${e.name}`, `<p>${L.esc(e.name)} | ${L.esc(e.phone)} | ${L.esc(e.email)} | ${L.esc(e.company)}</p><p>${L.esc(e.requirement)}</p><p>${L.esc(e.message)}</p>`);
  res.json({ ok: true, message: 'Thank you! Our team will contact you shortly.' });
});

r.post('/newsletter', formLimiter, (req, res) => {
  const email = L.str(req.body.email, 120).toLowerCase();
  if (!L.isEmail(email)) return res.status(400).json({ error: 'Enter a valid email' });
  if (!db.find('subscribers', s => s.email === email)) db.insert('subscribers', { email, createdAt: new Date().toISOString() });
  res.json({ ok: true, message: "You're in! Watch your inbox for chai offers." });
});

// ---------- Blog / events ----------
r.get('/blog', (req, res) => {
  let list = db.all('posts');
  if (req.query.category) list = list.filter(p => p.category === req.query.category);
  res.json(list.map(({ body, ...p }) => p).sort((a, b) => b.date.localeCompare(a.date)));
});
r.get('/blog/:slug', (req, res) => {
  const p = db.find('posts', x => x.slug === req.params.slug);
  return p ? res.json(p) : res.status(404).json({ error: 'Post not found' });
});
r.get('/events', (_req, res) => res.json(db.all('events')));

module.exports = r;
