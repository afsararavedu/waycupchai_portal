import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, rupee, off } from '../api';
import { useApp } from '../state';

export function useSeo(title, desc) {
  useEffect(() => {
    document.title = title ? `${title} | Way Cup Chai` : 'Way Cup Chai - Premium Assam Chai | Na Kam Na Ziyada Ekdam Perfect';
    if (desc) { let m = document.querySelector('meta[name="description"]'); if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); } m.content = desc; }
  }, [title, desc]);
}

export function Stars({ value = 0, count }) {
  const full = Math.round(value);
  return <span className="stars" aria-label={`${value} out of 5`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= full ? 'on' : ''}>&#9733;</i>)}{count != null && <small>({count})</small>}</span>;
}

export function ProductCard({ p }) {
  const { addToCart, wishlist, toggleWish } = useApp();
  const v = p.variants[0];
  const d = off(p.fromMrp, p.fromPrice);
  const liked = wishlist.includes(p.id);
  return (
    <article className="pcard">
      <Link to={`/product/${p.slug}`} className="pimg">
        <img src={p.images[0]} alt={p.name} loading="lazy" />
        {d > 0 && <span className="ribbon">{d}% OFF</span>}
        {(p.tags || []).includes('best-selling') && <span className="ribbon alt">Best seller</span>}
      </Link>
      <button className={`heart ${liked ? 'on' : ''}`} onClick={() => toggleWish(p.id)} aria-label="Add to wishlist">{liked ? '♥' : '♡'}</button>
      <div className="pbody">
        <Link to={`/product/${p.slug}`}><h3>{p.name}</h3></Link>
        <Stars value={p.rating} count={p.reviewCount || undefined} />
        <p className="pshort">{p.short}</p>
        <div className="pprice"><b>{rupee(p.fromPrice)}</b>{p.fromMrp > p.fromPrice && <s>{rupee(p.fromMrp)}</s>}<small>from {v.label}</small></div>
        <button className="btn block" onClick={() => addToCart(p, v)}>Add to cart</button>
      </div>
    </article>
  );
}

export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true; setData(null); setError('');
    api.get(path).then(d => live && setData(d)).catch(e => live && setError(e.message));
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  return { data, error, loading: !data && !error };
}

export function Loading() { return <div className="loading"><div className="spinner" /></div>; }

export function PageHero({ title, sub, image }) {
  return (
    <section className="page-hero" style={image ? { backgroundImage: `linear-gradient(rgba(74,15,34,.78),rgba(74,15,34,.78)),url(${image})` } : undefined}>
      <div className="wrap"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
    </section>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { const r = await api.post('/newsletter', { email }); setMsg(r.message); setEmail(''); } catch (err) { setMsg(err.message); }
  };
  return (
    <form className="newsletter" onSubmit={submit}>
      <h4>Get chai offers &amp; recipes</h4>
      <div><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email" /><button className="btn">Subscribe</button></div>
      {msg && <small>{msg}</small>}
    </form>
  );
}

const REQUIREMENTS = ['CTC / Dust tea (bulk)', 'Masala chai', 'Green tea', 'Premix / vending', 'Private label / own brand', 'Gift boxes', 'Other'];

export function EnquiryForm({ kind = 'contact', compact = false, onDone }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', company: '', requirement: REQUIREMENTS[0], message: '' });
  const [state, setState] = useState({ busy: false, msg: '', ok: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setState({ busy: true, msg: '', ok: false });
    try { const r = await api.post('/enquiries', { ...f, kind }); setState({ busy: false, msg: r.message, ok: true }); setF({ name: '', email: '', phone: '', company: '', requirement: REQUIREMENTS[0], message: '' }); onDone && setTimeout(onDone, 1800); }
    catch (err) { setState({ busy: false, msg: err.message, ok: false }); }
  };
  const showReq = kind === 'wholesale' || kind === 'gifting' || kind === 'event';
  return (
    <form className="form" onSubmit={submit}>
      <div className="grid2">
        <label>Name*<input required value={f.name} onChange={set('name')} autoComplete="name" /></label>
        <label>Phone*<input required value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" /></label>
      </div>
      <div className="grid2">
        <label>Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
        {!compact && <label>Company / shop<input value={f.company} onChange={set('company')} /></label>}
      </div>
      {showReq && <label>Requirement<select value={f.requirement} onChange={set('requirement')}>{REQUIREMENTS.map(r => <option key={r}>{r}</option>)}</select></label>}
      <label>Message / quantity<textarea rows={compact ? 3 : 4} value={f.message} onChange={set('message')} placeholder="Tell us what you need - quantity per month, grade, packaging..." /></label>
      <button className="btn" disabled={state.busy}>{state.busy ? 'Sending...' : 'Send enquiry'}</button>
      {state.msg && <p className={state.ok ? 'ok' : 'err'}>{state.msg}</p>}
    </form>
  );
}

export function EnquiryModal() {
  const { enquiry, setEnquiry } = useApp();
  if (!enquiry) return null;
  return (
    <div className="modal-overlay" onClick={() => setEnquiry(null)}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Enquiry form">
        <button className="icon-btn close" onClick={() => setEnquiry(null)} aria-label="Close">&#10005;</button>
        <h3>{enquiry.kind === 'wholesale' ? 'Wholesale enquiry' : 'Send us an enquiry'}</h3>
        <p className="muted">CTC, dust, PF, PD, BOP &amp; BOPS grades and private-label options. We'll call you back.</p>
        <EnquiryForm kind={enquiry.kind} compact onDone={() => setEnquiry(null)} />
      </div>
    </div>
  );
}

export function SectionHead({ title, sub, to, cta }) {
  return <div className="sec-head"><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{to && <Link to={to} className="btn ghost sm">{cta || 'View all'}</Link>}</div>;
}
