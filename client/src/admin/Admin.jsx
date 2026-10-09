import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, rupee } from '../api';
import { useApp } from '../state';
import { Loading, useSeo } from '../components/Common';

const TABS = ['Dashboard', 'Orders', 'Products', 'Enquiries', 'Coupons', 'Reviews', 'Blog'];
const STATUSES = ['placed', 'packed', 'shipped', 'delivered', 'cancelled', 'pending-payment'];

export default function Admin() {
  useSeo('Admin');
  const { user, logout } = useApp();
  const nav = useNavigate();
  const [tab, setTab] = useState('Dashboard');
  if (!user || user.role !== 'admin') return <div className="wrap section center"><h2>Admin access only</h2><Link className="btn" to="/account">Log in as admin</Link></div>;
  return (
    <div className="admin wrap">
      <div className="admin-head"><h1>Admin panel</h1><div><Link className="btn ghost sm" to="/">View site</Link> <button className="btn ghost sm" onClick={() => { logout(); nav('/'); }}>Log out</button></div></div>
      <div className="tab-btns">{TABS.map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === 'Dashboard' && <Dashboard />}{tab === 'Orders' && <Orders />}{tab === 'Products' && <Products />}
      {tab === 'Enquiries' && <Enquiries />}{tab === 'Coupons' && <Coupons />}{tab === 'Reviews' && <Reviews />}{tab === 'Blog' && <Blog />}
    </div>
  );
}

function useList(path) {
  const [rows, setRows] = useState(null);
  const reload = useCallback(() => api.get(path).then(setRows).catch(() => setRows([])), [path]);
  useEffect(() => { reload(); }, [reload]);
  return [rows, reload];
}

function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(setS); }, []);
  if (!s) return <Loading />;
  const cards = [['Revenue', rupee(s.revenue)], ['Orders', s.orders], ["Today's orders", s.todayOrders], ['New orders', s.newOrders], ['New enquiries', s.newEnquiries], ['Customers', s.customers], ['Subscribers', s.subscribers]];
  return (
    <>
      <div className="stat-grid">{cards.map(([l, v]) => <div className="stat" key={l}><small>{l}</small><b>{v}</b></div>)}</div>
      {s.lowStock.length > 0 && <div className="card"><h3>Low stock</h3>{s.lowStock.map((x, i) => <p key={i}>{x.product} ({x.variant}) &mdash; <b>{x.stock}</b> left</p>)}</div>}
    </>
  );
}

function Orders() {
  const [rows, reload] = useList('/admin/orders');
  const [sel, setSel] = useState(null);
  const update = async (o, patch) => { await api.put(`/admin/orders/${o.orderNo}`, patch); reload(); };
  if (!rows) return <Loading />;
  return (
    <div className="table-wrap"><table>
      <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr></thead>
      <tbody>{rows.map(o => (
        <>
          <tr key={o.id}><td><b>{o.orderNo}</b></td><td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td><td>{o.customer.name}<br /><small>{o.customer.phone}</small></td><td>{rupee(o.total)}</td><td>{o.paymentMethod === 'cod' ? 'COD' : 'Online'}<br /><small>{o.paymentStatus}</small></td>
            <td><select value={o.status} onChange={e => update(o, { status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></td>
            <td><button className="linklike" onClick={() => setSel(sel === o.id ? null : o.id)}>{sel === o.id ? 'Hide' : 'Details'}</button></td></tr>
          {sel === o.id && <tr key={o.id + 'd'}><td colSpan={7} className="detail">
            <p>{o.items.map(i => `${i.name} (${i.variantLabel}) x${i.qty}`).join(' | ')}</p>
            <p><b>Ship to:</b> {o.customer.name}, {o.customer.phone}, {o.address.line1}, {o.address.city}, {o.address.state} - {o.address.pincode}{o.notes && <> &middot; <i>{o.notes}</i></>}</p>
            <form className="inline-form" onSubmit={e => { e.preventDefault(); const d = new FormData(e.target); update(o, { courier: d.get('courier'), trackingId: d.get('trackingId') }); }}>
              <input name="courier" placeholder="Courier" defaultValue={o.courier} /><input name="trackingId" placeholder="Tracking ID" defaultValue={o.trackingId} /><button className="btn sm">Save tracking</button>
            </form>
          </td></tr>}
        </>
      ))}</tbody>
    </table>{rows.length === 0 && <p className="empty">No orders yet.</p>}</div>
  );
}

const blank = { name: '', type: 'ctc-tea', collection: 'classic', region: 'assam', tags: '', short: '', description: '', ingredients: '', brew: '', images: '', variants: [{ grams: 250, label: '250 g', mrp: 0, price: 0, stock: 100 }], active: true };

function Products() {
  const [rows, reload] = useList('/admin/products');
  const [edit, setEdit] = useState(null);
  if (!rows) return <Loading />;
  if (edit) return <ProductForm init={edit} done={() => { setEdit(null); reload(); }} />;
  return (
    <>
      <button className="btn sm" onClick={() => setEdit(blank)}>+ Add product</button>
      <div className="table-wrap"><table><thead><tr><th /><th>Name</th><th>Type</th><th>Variants</th><th>Active</th><th /></tr></thead>
        <tbody>{rows.map(p => <tr key={p.id}><td><img className="thumb" src={p.images[0]} alt="" /></td><td><b>{p.name}</b></td><td>{p.type}</td><td>{p.variants.map(v => `${v.label} ${rupee(v.price)}`).join(', ')}</td><td>{p.active !== false ? 'Yes' : 'No'}</td>
          <td><button className="linklike" onClick={() => setEdit({ ...p, tags: (p.tags || []).join(', '), images: p.images.join('\n') })}>Edit</button> <button className="linklike danger" onClick={async () => { if (confirm(`Delete ${p.name}?`)) { await api.del(`/admin/products/${p.id}`); reload(); } }}>Delete</button></td></tr>)}</tbody></table></div>
    </>
  );
}

function ProductForm({ init, done }) {
  const [f, setF] = useState(init);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setV = (i, k, val) => setF({ ...f, variants: f.variants.map((v, n) => n === i ? { ...v, [k]: val } : v) });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { f.id ? await api.put(`/admin/products/${f.id}`, f) : await api.post('/admin/products', f); done(); } catch (ex) { setErr(ex.message); }
  };
  return (
    <form className="form card" onSubmit={save}>
      <h3>{f.id ? 'Edit product' : 'New product'}</h3>
      <label>Name<input required value={f.name} onChange={set('name')} /></label>
      <div className="grid3"><label>Type<select value={f.type} onChange={set('type')}>{['ctc-tea', 'green-tea', 'herbal-tea', 'black-tea', 'gift-box'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Collection<select value={f.collection} onChange={set('collection')}>{['classic', 'masala', 'wellness', 'gourmet', 'gifting'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Region<input value={f.region} onChange={set('region')} /></label></div>
      <label>Tags (comma separated: best-selling, trending, signature, gifting, immunity, dessert)<input value={f.tags} onChange={set('tags')} /></label>
      <label>Short description<input value={f.short} onChange={set('short')} /></label>
      <label>Description<textarea rows={4} value={f.description} onChange={set('description')} /></label>
      <div className="grid2"><label>Ingredients<input value={f.ingredients} onChange={set('ingredients')} /></label><label>How to brew<input value={f.brew} onChange={set('brew')} /></label></div>
      <label>Image paths (one per line, e.g. /images/packs.jpg)<textarea rows={3} value={f.images} onChange={set('images')} /></label>
      <h4>Pack sizes &amp; prices</h4>
      {f.variants.map((v, i) => (
        <div className="grid5" key={i}>
          <label>Grams<input type="number" value={v.grams} onChange={e => setV(i, 'grams', e.target.value)} /></label><label>Label<input value={v.label} onChange={e => setV(i, 'label', e.target.value)} /></label>
          <label>MRP<input type="number" value={v.mrp} onChange={e => setV(i, 'mrp', e.target.value)} /></label><label>Price<input type="number" value={v.price} onChange={e => setV(i, 'price', e.target.value)} /></label>
          <label>Stock<input type="number" value={v.stock ?? ''} onChange={e => setV(i, 'stock', e.target.value)} /></label>
        </div>
      ))}
      <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, variants: [...f.variants, { grams: 0, label: '', mrp: 0, price: 0, stock: 100 }] })}>+ Add pack size</button>
      <label className="check"><input type="checkbox" checked={f.active !== false} onChange={e => setF({ ...f, active: e.target.checked })} /> Visible on website</label>
      {err && <p className="err">{err}</p>}
      <div><button className="btn">Save product</button> <button type="button" className="btn ghost" onClick={done}>Cancel</button></div>
    </form>
  );
}

function Enquiries() {
  const [rows, reload] = useList('/admin/enquiries');
  if (!rows) return <Loading />;
  return (
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Contact</th><th>Details</th><th>Status</th></tr></thead>
      <tbody>{rows.map(e => <tr key={e.id}><td>{new Date(e.createdAt).toLocaleDateString('en-IN')}</td><td>{e.kind}</td><td><b>{e.name}</b><br /><a href={`tel:${e.phone}`}>{e.phone}</a><br /><small>{e.email}</small><br /><small>{e.company}</small></td><td><small>{e.requirement}</small><br />{e.message}</td>
        <td><select value={e.status} onChange={async ev => { await api.put(`/admin/enquiries/${e.id}`, { status: ev.target.value }); reload(); }}>{['new', 'contacted', 'closed'].map(s => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>
      {rows.length === 0 && <p className="empty">No enquiries yet.</p>}</div>
  );
}

function Coupons() {
  const [rows, reload] = useList('/admin/coupons');
  const [f, setF] = useState({ code: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: 0, note: '' });
  const [err, setErr] = useState('');
  if (!rows) return <Loading />;
  return (
    <>
      <div className="table-wrap"><table><thead><tr><th>Code</th><th>Offer</th><th>Min order</th><th>Active</th><th /></tr></thead>
        <tbody>{rows.map(c => <tr key={c.code}><td><b>{c.code}</b></td><td>{c.type === 'percent' ? `${c.value}%` : rupee(c.value)} off{c.maxDiscount ? ` (max ${rupee(c.maxDiscount)})` : ''}</td><td>{rupee(c.minOrder)}</td>
          <td><input type="checkbox" checked={c.active} onChange={async e => { await api.put(`/admin/coupons/${c.code}`, { active: e.target.checked }); reload(); }} /></td>
          <td><button className="linklike danger" onClick={async () => { await api.del(`/admin/coupons/${c.code}`); reload(); }}>Delete</button></td></tr>)}</tbody></table></div>
      <form className="form card" onSubmit={async e => { e.preventDefault(); setErr(''); try { await api.post('/admin/coupons', f); setF({ ...f, code: '', note: '' }); reload(); } catch (ex) { setErr(ex.message); } }}>
        <h3>New coupon</h3>
        <div className="grid5"><label>Code<input required value={f.code} onChange={e => setF({ ...f, code: e.target.value })} /></label><label>Type<select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="percent">Percent</option><option value="flat">Flat Rs.</option></select></label>
          <label>Value<input type="number" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} /></label><label>Min order<input type="number" value={f.minOrder} onChange={e => setF({ ...f, minOrder: e.target.value })} /></label><label>Max discount<input type="number" value={f.maxDiscount} onChange={e => setF({ ...f, maxDiscount: e.target.value })} /></label></div>
        <label>Note shown to customers<input value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></label>
        {err && <p className="err">{err}</p>}<button className="btn sm">Add coupon</button>
      </form>
    </>
  );
}

function Reviews() {
  const [rows, reload] = useList('/admin/reviews');
  if (!rows) return <Loading />;
  return (
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>Review</th><th>Approved</th><th /></tr></thead>
      <tbody>{rows.map(r => <tr key={r.id}><td>{r.product}</td><td><b>{r.name}</b> &middot; {'★'.repeat(r.rating)}<br />{r.text}</td>
        <td><input type="checkbox" checked={r.approved} onChange={async e => { await api.put(`/admin/reviews/${r.id}`, { approved: e.target.checked }); reload(); }} /></td>
        <td><button className="linklike danger" onClick={async () => { await api.del(`/admin/reviews/${r.id}`); reload(); }}>Delete</button></td></tr>)}</tbody></table>
      {rows.length === 0 && <p className="empty">No reviews yet.</p>}</div>
  );
}

function Blog() {
  const [rows, reload] = useList('/admin/posts');
  const [f, setF] = useState({ title: '', category: 'all-about-tea', excerpt: '', image: '/images/story-garden.jpg', body: '' });
  if (!rows) return <Loading />;
  return (
    <>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Title</th><th /></tr></thead>
        <tbody>{rows.map(p => <tr key={p.slug}><td>{p.date}</td><td>{p.title}</td><td><button className="linklike danger" onClick={async () => { if (confirm('Delete post?')) { await api.del(`/admin/posts/${p.slug}`); reload(); } }}>Delete</button></td></tr>)}</tbody></table></div>
      <form className="form card" onSubmit={async e => { e.preventDefault(); await api.post('/admin/posts', f); setF({ ...f, title: '', excerpt: '', body: '' }); reload(); }}>
        <h3>New blog post</h3>
        <label>Title<input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></label>
        <div className="grid2"><label>Category<select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{['all-about-tea', 'tea-recipes', 'from-bush-to-cup', 'tea-and-health'].map(x => <option key={x}>{x}</option>)}</select></label>
          <label>Image path<input value={f.image} onChange={e => setF({ ...f, image: e.target.value })} /></label></div>
        <label>Excerpt<input value={f.excerpt} onChange={e => setF({ ...f, excerpt: e.target.value })} /></label>
        <label>Body (separate paragraphs with a blank line)<textarea rows={8} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} /></label>
        <button className="btn sm">Publish post</button>
      </form>
    </>
  );
}
