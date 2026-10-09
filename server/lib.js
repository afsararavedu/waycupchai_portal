const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET) console.warn('[warn] JWT_SECRET not set - using an insecure development secret. Set it in your .env!');

const config = () => ({
  siteName: 'Way Cup Chai',
  tagline: 'Na Kam Na Ziyada Ekdam Perfect',
  company: 'Afsarnamak Chai Pvt Ltd',
  address: '51/142-4-27, Kothapeta-51, Near Main Ralu School, MPL Road, Rayachoty, Annamayya District, Andhra Pradesh - 516269',
  phone: process.env.STORE_PHONE || '+91 90006 94224',
  phone2: process.env.STORE_PHONE_2 || '+91 70221 55609',
  email: process.env.STORE_EMAIL || 'hello@waycupchai.com',
  whatsapp: process.env.WHATSAPP_NUMBER || '919000694224',
  freeShippingMin: Number(process.env.FREE_SHIPPING_MIN || 450),
  shippingFee: Number(process.env.SHIPPING_FEE || 49),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  onlinePayments: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  siteUrl: process.env.SITE_URL || 'https://waycupchai.com',
});

const uid = (p = '') => p + crypto.randomBytes(8).toString('hex');
const sign = (user) => jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
const publicUser = (u) => u && ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, addresses: u.addresses || [] });

function readUser(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    const p = jwt.verify(h.slice(7), JWT_SECRET);
    return db.find('users', u => u.id === p.id) || null;
  } catch { return null; }
}
const optionalAuth = (req, _res, next) => { req.user = readUser(req); next(); };
const requireAuth = (req, res, next) => { req.user = readUser(req); return req.user ? next() : res.status(401).json({ error: 'Please log in' }); };
const requireAdmin = (req, res, next) => { req.user = readUser(req); return req.user && req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' }); };

const str = (v, max = 300) => String(v == null ? '' : v).trim().slice(0, max);
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isPhone = (p) => /^[+]?[0-9\s-]{10,15}$/.test(p);
const isPin = (p) => /^[1-9][0-9]{5}$/.test(p);

// ---- Pricing (always computed server-side; never trust client prices) ----
function priceCart(items, couponCode) {
  const cfg = config();
  const lines = [];
  for (const it of Array.isArray(items) ? items : []) {
    const p = db.find('products', x => x.id === it.productId && x.active !== false);
    if (!p) throw new Error('A product in your cart is no longer available');
    const vr = p.variants.find(x => x.id === it.variantId);
    if (!vr) throw new Error(`Pack size unavailable for ${p.name}`);
    const qty = Math.max(1, Math.min(50, parseInt(it.qty, 10) || 1));
    if (vr.stock != null && vr.stock < qty) throw new Error(`Only ${vr.stock} left of ${p.name} (${vr.label})`);
    lines.push({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0], variantId: vr.id, variantLabel: vr.label, mrp: vr.mrp, price: vr.price, qty, total: vr.price * qty });
  }
  if (!lines.length) throw new Error('Your cart is empty');
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  let discount = 0, coupon = null;
  if (couponCode) {
    const c = db.find('coupons', x => x.code === str(couponCode).toUpperCase() && x.active);
    if (!c) throw new Error('Invalid or expired coupon');
    if (subtotal < (c.minOrder || 0)) throw new Error(`Coupon needs a minimum order of Rs.${c.minOrder}`);
    discount = c.type === 'percent' ? Math.round(subtotal * c.value / 100) : c.value;
    if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
    discount = Math.min(discount, subtotal);
    coupon = c.code;
  }
  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount >= cfg.freeShippingMin ? 0 : cfg.shippingFee;
  return { lines, subtotal, discount, coupon, shipping, total: afterDiscount + shipping };
}

// ---- Email (optional) ----
let transporter = null;
function mailer() {
  if (transporter !== null) return transporter;
  if (!process.env.SMTP_HOST) return (transporter = false);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}
async function sendMail(to, subject, html) {
  const t = mailer();
  if (!t || !to) return false;
  try { await t.sendMail({ from: `"Way Cup Chai" <${process.env.SMTP_USER}>`, to, subject, html }); return true; }
  catch (e) { console.error('[mail] failed:', e.message); return false; }
}
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- Razorpay (plain REST, no SDK needed) ----
async function razorpayCreateOrder(amountPaise, receipt) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error && j.error.description ? j.error.description : 'Razorpay error');
  return j;
}
function razorpayVerify(orderId, paymentId, signature) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${orderId}|${paymentId}`).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature))); } catch { return false; }
}

module.exports = { config, uid, sign, publicUser, optionalAuth, requireAuth, requireAdmin, readUser, str, isEmail, isPhone, isPin, priceCart, sendMail, esc, razorpayCreateOrder, razorpayVerify };
