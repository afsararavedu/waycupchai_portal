const express = require('express');
const db = require('../db');
const L = require('../lib');

const r = express.Router();
r.use(L.requireAdmin);

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

r.get('/stats', (_req, res) => {
  const orders = db.all('orders');
  const paid = orders.filter(o => ['placed', 'packed', 'shipped', 'delivered'].includes(o.status));
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    orders: orders.length, revenue: paid.reduce((s, o) => s + o.total, 0),
    todayOrders: orders.filter(o => o.createdAt.slice(0, 10) === today).length,
    newOrders: orders.filter(o => o.status === 'placed').length,
    newEnquiries: db.all('enquiries').filter(e => e.status === 'new').length,
    customers: db.all('users').filter(u => u.role === 'customer').length,
    subscribers: db.all('subscribers').length,
    lowStock: db.all('products').flatMap(p => p.variants.filter(v => v.stock != null && v.stock <= 10).map(v => ({ product: p.name, variant: v.label, stock: v.stock }))),
  });
});

// Products
r.get('/products', (_req, res) => res.json(db.all('products')));
function cleanProduct(b, existing) {
  const variants = (Array.isArray(b.variants) ? b.variants : []).map(v => ({
    id: L.str(v.id || `${Number(v.grams)}g`, 20), label: L.str(v.label, 20) || `${Number(v.grams)} g`, grams: Number(v.grams) || 0,
    mrp: Math.max(0, Number(v.mrp) || 0), price: Math.max(0, Number(v.price) || 0), stock: v.stock === '' || v.stock == null ? null : Math.max(0, Number(v.stock)),
  })).filter(v => v.price > 0);
  if (!L.str(b.name) || !variants.length) throw new Error('Name and at least one priced variant are required');
  return {
    name: L.str(b.name, 120), slug: existing ? existing.slug : slugify(b.slug || b.name),
    type: L.str(b.type, 40) || 'ctc-tea', collection: L.str(b.collection, 40) || 'classic', region: L.str(b.region, 40) || 'assam',
    tags: (Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',')).map(t => L.str(t, 30).toLowerCase()).filter(Boolean),
    short: L.str(b.short, 240), description: L.str(b.description, 3000), ingredients: L.str(b.ingredients, 400), brew: L.str(b.brew, 400),
    images: (Array.isArray(b.images) ? b.images : String(b.images || '').split(/\n|,/)).map(s => L.str(s, 300)).filter(Boolean),
    variants, active: b.active !== false,
  };
}
r.post('/products', (req, res) => {
  try {
    const p = cleanProduct(req.body);
    if (db.find('products', x => x.slug === p.slug)) p.slug += '-' + Date.now().toString(36).slice(-4);
    res.json(db.insert('products', { id: L.uid('p'), createdAt: new Date().toISOString(), ...p }));
  } catch (e) { res.status(400).json({ error: e.message }); }
});
r.put('/products/:id', (req, res) => {
  try {
    const ex = db.find('products', x => x.id === req.params.id);
    if (!ex) return res.status(404).json({ error: 'Not found' });
    res.json(db.update('products', x => x.id === ex.id, cleanProduct(req.body, ex)));
  } catch (e) { res.status(400).json({ error: e.message }); }
});
r.delete('/products/:id', (req, res) => { db.remove('products', x => x.id === req.params.id); res.json({ ok: true }); });

// Orders
r.get('/orders', (_req, res) => res.json([...db.all('orders')].reverse()));
r.put('/orders/:orderNo', (req, res) => {
  const o = db.find('orders', x => x.orderNo === req.params.orderNo);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const status = ['pending-payment', 'placed', 'packed', 'shipped', 'delivered', 'cancelled'].includes(req.body.status) ? req.body.status : o.status;
  const patch = { status, courier: L.str(req.body.courier ?? o.courier, 60), trackingId: L.str(req.body.trackingId ?? o.trackingId, 60) };
  if (status === 'delivered' && o.paymentMethod === 'cod') patch.paymentStatus = 'cod-collected';
  if (status !== o.status) patch.timeline = [...o.timeline, { status, at: new Date().toISOString() }];
  const upd = db.update('orders', x => x.id === o.id, patch);
  if (status !== o.status && upd.customer.email) L.sendMail(upd.customer.email, `Order ${upd.orderNo} is ${status}`, `<p>Hi ${L.esc(upd.customer.name)}, your Way Cup Chai order <b>${upd.orderNo}</b> is now <b>${status}</b>.${upd.trackingId ? ` Tracking: ${L.esc(upd.courier)} ${L.esc(upd.trackingId)}` : ''}</p>`);
  res.json(upd);
});

// Enquiries
r.get('/enquiries', (_req, res) => res.json([...db.all('enquiries')].reverse()));
r.put('/enquiries/:id', (req, res) => res.json(db.update('enquiries', e => e.id === req.params.id, { status: ['new', 'contacted', 'closed'].includes(req.body.status) ? req.body.status : 'new' })));

// Coupons
r.get('/coupons', (_req, res) => res.json(db.all('coupons')));
r.post('/coupons', (req, res) => {
  const b = req.body, code = L.str(b.code, 20).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code || !(Number(b.value) > 0)) return res.status(400).json({ error: 'Code and value required' });
  if (db.find('coupons', c => c.code === code)) return res.status(409).json({ error: 'Code already exists' });
  res.json(db.insert('coupons', { code, type: b.type === 'flat' ? 'flat' : 'percent', value: Number(b.value), minOrder: Number(b.minOrder) || 0, maxDiscount: Number(b.maxDiscount) || 0, active: true, note: L.str(b.note, 120) }));
});
r.put('/coupons/:code', (req, res) => res.json(db.update('coupons', c => c.code === req.params.code, { active: !!req.body.active })));
r.delete('/coupons/:code', (req, res) => { db.remove('coupons', c => c.code === req.params.code); res.json({ ok: true }); });

// Reviews moderation
r.get('/reviews', (_req, res) => res.json([...db.all('reviews')].reverse().map(x => ({ ...x, product: (db.find('products', p => p.id === x.productId) || {}).name }))));
r.put('/reviews/:id', (req, res) => res.json(db.update('reviews', x => x.id === req.params.id, { approved: !!req.body.approved })));
r.delete('/reviews/:id', (req, res) => { db.remove('reviews', x => x.id === req.params.id); res.json({ ok: true }); });

// Blog
r.get('/posts', (_req, res) => res.json(db.all('posts')));
r.post('/posts', (req, res) => {
  const b = req.body; if (!L.str(b.title)) return res.status(400).json({ error: 'Title required' });
  const post = { slug: slugify(b.title) || L.uid('post-'), title: L.str(b.title, 160), category: L.str(b.category, 40) || 'all-about-tea', image: L.str(b.image, 300) || '/images/story-garden.jpg',
    date: new Date().toISOString().slice(0, 10), excerpt: L.str(b.excerpt, 300), body: String(b.body || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean) };
  res.json(db.insert('posts', post));
});
r.delete('/posts/:slug', (req, res) => { db.remove('posts', p => p.slug === req.params.slug); res.json({ ok: true }); });

r.get('/subscribers', (_req, res) => res.json(db.all('subscribers')));

module.exports = r;
