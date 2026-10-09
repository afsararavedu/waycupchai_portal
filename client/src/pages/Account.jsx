import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, rupee } from '../api';
import { useApp } from '../state';
import { PageHero, useSeo, Loading } from '../components/Common';

const STEPS = ['placed', 'packed', 'shipped', 'delivered'];

export function OrderTimeline({ status, timeline = [] }) {
  if (status === 'cancelled') return <p className="err">This order was cancelled.</p>;
  const idx = STEPS.indexOf(status === 'pending-payment' ? 'placed' : status);
  return (
    <ol className="steps">
      {STEPS.map((s, i) => { const hit = timeline.find(t => t.status === s); return <li key={s} className={i <= idx ? 'done' : ''}><span>{i + 1}</span><b>{s[0].toUpperCase() + s.slice(1)}</b>{hit && <small>{new Date(hit.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small>}</li>; })}
    </ol>
  );
}

export default function Account() {
  useSeo('My account');
  const { user, login, logout, setUser } = useApp();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState(null);
  const [prof, setProf] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (user) { api.get('/orders/mine').then(setOrders).catch(() => setOrders([])); const a = (user.addresses || [])[0] || {}; setProf({ name: user.name, phone: user.phone || '', line1: a.line1 || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '' }); } }, [user]);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const r = await api.post(mode === 'login' ? '/auth/login' : '/auth/register', f); login(r); if (r.user.role === 'admin') nav('/admin'); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const saveProfile = async (e) => {
    e.preventDefault();
    try { const r = await api.put('/auth/me', { name: prof.name, phone: prof.phone, addresses: [{ line1: prof.line1, city: prof.city, state: prof.state, pincode: prof.pincode }] }); setUser(r.user); setMsg('Saved!'); } catch (ex) { setMsg(ex.message); }
  };

  if (!user) {
    return (
      <>
        <PageHero title={mode === 'login' ? 'Log in' : 'Create account'} sub="Track orders and check out faster" />
        <div className="wrap section narrow"><form className="form card" onSubmit={submit}>
          {mode === 'register' && <label>Full name<input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} autoComplete="name" /></label>}
          <label>Email<input type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} autoComplete="email" /></label>
          {mode === 'register' && <label>Phone<input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} inputMode="tel" autoComplete="tel" /></label>}
          <label>Password<input type="password" required minLength={6} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {err && <p className="err">{err}</p>}
          <button className="btn block" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}</button>
          <p className="center-link">{mode === 'login' ? <>New here? <button type="button" className="linklike" onClick={() => setMode('register')}>Create an account</button></> : <>Already registered? <button type="button" className="linklike" onClick={() => setMode('login')}>Log in</button></>}</p>
        </form></div>
      </>
    );
  }

  return (
    <>
      <PageHero title={`Hello, ${user.name.split(' ')[0]}`} sub={user.email} />
      <div className="wrap section account-grid">
        <section>
          <h2>My orders</h2>
          {!orders ? <Loading /> : orders.length === 0 ? <p className="empty">No orders yet. <Link to="/shop">Start shopping</Link></p> : orders.map(o => (
            <div className="order-card" key={o.id}>
              <div className="row"><b>{o.orderNo}</b><span>{new Date(o.createdAt).toLocaleDateString('en-IN')}</span><b>{rupee(o.total)}</b></div>
              <small>{o.items.map(i => `${i.name} (${i.variantLabel}) x${i.qty}`).join(', ')}</small>
              <OrderTimeline status={o.status} timeline={o.timeline} />
              {o.trackingId && <small>Courier: {o.courier} &middot; Tracking: {o.trackingId}</small>}
            </div>
          ))}
        </section>
        <aside>
          <h2>Profile &amp; address</h2>
          {prof && <form className="form card" onSubmit={saveProfile}>
            <label>Name<input value={prof.name} onChange={e => setProf({ ...prof, name: e.target.value })} /></label>
            <label>Phone<input value={prof.phone} onChange={e => setProf({ ...prof, phone: e.target.value })} /></label>
            <label>Address<input value={prof.line1} onChange={e => setProf({ ...prof, line1: e.target.value })} /></label>
            <div className="grid3"><label>City<input value={prof.city} onChange={e => setProf({ ...prof, city: e.target.value })} /></label><label>State<input value={prof.state} onChange={e => setProf({ ...prof, state: e.target.value })} /></label><label>Pincode<input value={prof.pincode} onChange={e => setProf({ ...prof, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} /></label></div>
            <button className="btn sm">Save</button>{msg && <p className="ok">{msg}</p>}
          </form>}
          {user.role === 'admin' && <Link className="btn alt block" to="/admin">Open admin panel</Link>}
          <button className="btn ghost block" onClick={logout}>Log out</button>
        </aside>
      </div>
    </>
  );
}

export function TrackOrder() {
  useSeo('Track your order');
  const [f, setF] = useState({ orderNo: '', phone: '' });
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setRes(null);
    try { setRes(await api.get(`/orders/track?orderNo=${encodeURIComponent(f.orderNo)}&phone=${encodeURIComponent(f.phone)}`)); } catch (ex) { setErr(ex.message); }
  };
  return (
    <>
      <PageHero title="Track your order" sub="Enter your order number and phone number" />
      <div className="wrap section narrow">
        <form className="form card" onSubmit={submit}>
          <div className="grid2"><label>Order number<input required placeholder="WCC1001" value={f.orderNo} onChange={e => setF({ ...f, orderNo: e.target.value })} /></label><label>Phone number<input required inputMode="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></label></div>
          <button className="btn">Track</button>{err && <p className="err">{err}</p>}
        </form>
        {res && <div className="order-card"><div className="row"><b>{res.orderNo}</b><span>{res.paymentStatus}</span><b>{rupee(res.total)}</b></div><OrderTimeline status={res.status} timeline={res.timeline} />{res.trackingId && <p>Courier: <b>{res.courier}</b> &middot; Tracking ID: <b>{res.trackingId}</b></p>}</div>}
      </div>
    </>
  );
}
