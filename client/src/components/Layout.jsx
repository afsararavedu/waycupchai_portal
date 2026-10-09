import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../state';
import { api, rupee } from '../api';
import { EnquiryModal, Newsletter } from './Common';

export function Header() {
  const { config, cartCount, user, setDrawer } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [mega, setMega] = useState(null);
  const [mobSub, setMobSub] = useState(null);
  const loc = useLocation();
  useEffect(() => { setOpen(false); setSearch(false); setMega(null); }, [loc.pathname, loc.search]);
  const menu = (config && config.menu) || [];

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="wrap topbar-in">
          <span className="ship">Free shipping on orders of {rupee(config ? config.freeShippingMin : 450)} and above &middot; <b>Na Kam Na Ziyada Ekdam Perfect</b></span>
          <span className="top-links">
            <a href={`https://wa.me/${config ? config.whatsapp : ''}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <a href={`tel:${config ? config.phone.replace(/\s/g, '') : ''}`}>{config ? config.phone : ''}</a>
            <Link to="/track-order">Track order</Link>
            <WholesaleLink />
          </span>
        </div>
      </div>
      <div className="mainbar">
        <div className="wrap mainbar-in">
          <button className="icon-btn burger" aria-label="Menu" onClick={() => setOpen(true)}>&#9776;</button>
          <Link to="/" className="brand" aria-label="Way Cup Chai home">
            <img src="/images/logo-192.png" alt="Way Cup Chai logo" width="54" height="54" />
            <span className="brand-text"><b>WAY CUP CHAI</b><i>@Self Motivated</i></span>
          </Link>
          <nav className="nav" onMouseLeave={() => setMega(null)}>
            {menu.map((m, i) => m.groups ? (
              <div key={m.label} className="nav-item" onMouseEnter={() => setMega(i)}>
                <Link to="/shop" className={mega === i ? 'on' : ''}>{m.label} <small>&#9662;</small></Link>
                {mega === i && (
                  <div className="mega">
                    <div className="wrap mega-in">
                      {m.groups.map(g => (
                        <div key={g.title}><h4>{g.title}</h4>{g.links.map(l => <Link key={l.label} to={l.to}>{l.label}</Link>)}</div>
                      ))}
                      <div className="mega-promo"><img src="/images/packs.jpg" alt="Way Cup Chai pouches" loading="lazy" /><Link to="/shop" className="btn sm">Shop all chai</Link></div>
                    </div>
                  </div>
                )}
              </div>
            ) : <div key={m.label} className="nav-item"><NavLink to={m.to}>{m.label}</NavLink></div>)}
          </nav>
          <div className="actions">
            <button className="icon-btn" aria-label="Search" onClick={() => setSearch(s => !s)}>&#128269;</button>
            <Link to="/offers" className="offers-pill">% Offers</Link>
            <Link to={user ? (user.role === 'admin' ? '/admin' : '/account') : '/account'} className="icon-btn" aria-label="Account">&#128100;</Link>
            <button className="icon-btn cart-btn" aria-label="Cart" onClick={() => setDrawer(true)}>&#128722;{cartCount > 0 && <span className="badge">{cartCount}</span>}</button>
          </div>
        </div>
        {search && <SearchBar close={() => setSearch(false)} />}
      </div>

      {open && (
        <div className="mob-overlay" onClick={() => setOpen(false)}>
          <aside className="mob-menu" onClick={e => e.stopPropagation()}>
            <div className="mob-head"><img src="/images/logo-192.png" alt="" width="40" height="40" /><b>Way Cup Chai</b><button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">&#10005;</button></div>
            <Link to="/">Home</Link><Link to="/offers">Offers</Link>
            {menu.map((m, i) => m.groups ? (
              <div key={m.label}>
                <button className="mob-acc" onClick={() => setMobSub(mobSub === i ? null : i)}>{m.label}<span>{mobSub === i ? '−' : '+'}</span></button>
                {mobSub === i && <div className="mob-sub">{m.groups.map(g => <div key={g.title}><h5>{g.title}</h5>{g.links.map(l => <Link key={l.label} to={l.to}>{l.label}</Link>)}</div>)}</div>}
              </div>
            ) : <Link key={m.label} to={m.to}>{m.label}</Link>)}
            <Link to="/what-tea-is-best-for-me">What tea is best for me?</Link><Link to="/events">Events</Link><Link to="/faq">FAQs</Link><Link to="/contact-us">Contact us</Link><Link to="/track-order">Track order</Link>
          </aside>
        </div>
      )}
    </header>
  );
}

function WholesaleLink() {
  const { setEnquiry } = useApp();
  return <button className="linklike" onClick={() => setEnquiry({ kind: 'wholesale' })}>Wholesale Enquiry</button>;
}

function SearchBar({ close }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState([]);
  const nav = useNavigate();
  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return; }
    const t = setTimeout(() => api.get(`/products?q=${encodeURIComponent(q)}`).then(r => setRes(r.slice(0, 5))).catch(() => {}), 200);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="searchbar">
      <form className="wrap" onSubmit={e => { e.preventDefault(); if (q.trim()) { nav(`/shop?q=${encodeURIComponent(q)}`); close(); } }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search masala chai, kahwa, tulsi..." aria-label="Search products" />
        <button className="btn sm" type="submit">Search</button>
        {res.length > 0 && (
          <div className="search-res">
            {res.map(p => <Link key={p.id} to={`/product/${p.slug}`}><img src={p.images[0]} alt="" /><span>{p.name}</span><b>{rupee(p.fromPrice)}</b></Link>)}
          </div>
        )}
      </form>
    </div>
  );
}

export function CartDrawer() {
  const { drawer, setDrawer, cart, setQty, cartSubtotal, config } = useApp();
  const nav = useNavigate();
  if (!drawer) return null;
  const min = config ? config.freeShippingMin : 450;
  const left = Math.max(0, min - cartSubtotal);
  return (
    <div className="drawer-overlay" onClick={() => setDrawer(false)}>
      <aside className="drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label="Shopping cart">
        <div className="drawer-head"><h3>Your cart</h3><button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close">&#10005;</button></div>
        {cart.length === 0 ? (
          <div className="drawer-empty"><p>Your cart is empty.</p><Link className="btn" to="/shop" onClick={() => setDrawer(false)}>Start shopping</Link></div>
        ) : (
          <>
            <div className="ship-bar"><div className="ship-fill" style={{ width: `${Math.min(100, (cartSubtotal / min) * 100)}%` }} /></div>
            <p className="ship-msg">{left > 0 ? <>Add <b>{rupee(left)}</b> more for <b>free shipping</b></> : <>You've unlocked <b>free shipping</b>!</>}</p>
            <div className="drawer-items">
              {cart.map(it => (
                <div className="cart-line" key={it.productId + it.variantId}>
                  <img src={it.image} alt="" />
                  <div><Link to={`/product/${it.slug}`} onClick={() => setDrawer(false)}>{it.name}</Link><small>{it.label}</small>
                    <div className="qty"><button onClick={() => setQty(it.productId, it.variantId, it.qty - 1)} aria-label="Decrease">&minus;</button><span>{it.qty}</span><button onClick={() => setQty(it.productId, it.variantId, it.qty + 1)} aria-label="Increase">+</button></div>
                  </div>
                  <b>{rupee(it.price * it.qty)}</b>
                </div>
              ))}
            </div>
            <div className="drawer-foot">
              <div className="row"><span>Subtotal</span><b>{rupee(cartSubtotal)}</b></div>
              <button className="btn block" onClick={() => { setDrawer(false); nav('/checkout'); }}>Checkout</button>
              <button className="btn ghost block" onClick={() => { setDrawer(false); nav('/cart'); }}>View cart</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function Footer() {
  const { config, setEnquiry } = useApp();
  return (
    <footer className="footer">
      <div className="wrap foot-top">
        <div className="foot-brand">
          <img src="/images/logo.png" alt="Way Cup Chai" width="110" height="110" loading="lazy" />
          <p>From the hearts of Assam tea gardens to your cup. <b>Na kam, na ziyada &mdash; ekdam perfect.</b></p>
        </div>
        <Newsletter />
      </div>
      <div className="wrap foot-cols">
        <div><h4>Way Cup Chai</h4><Link to="/about-us">About us</Link><Link to="/sourcing">Our story &amp; sourcing</Link><Link to="/about-tea">About tea</Link><Link to="/faq">FAQs</Link><Link to="/blog">Blog</Link></div>
        <div><h4>Shop</h4><Link to="/shop">All products</Link><Link to="/trending">Trending</Link><Link to="/signature">Signature</Link><Link to="/best-selling">Best selling</Link><Link to="/offers">Offers</Link></div>
        <div><h4>Business</h4><Link to="/wholesale">Wholesale</Link><Link to="/gifting">Gifting</Link><Link to="/events">Events</Link><button className="linklike" onClick={() => setEnquiry({ kind: 'wholesale' })}>Wholesale enquiry</button></div>
        <div><h4>Support</h4><Link to="/contact-us">Contact</Link><Link to="/track-order">Track your order</Link><Link to="/return-refund">Return &amp; refund</Link><Link to="/privacy-policy">Privacy policy</Link><Link to="/terms">Terms &amp; conditions</Link></div>
        <div className="foot-contact"><h4>Reach us</h4>
          <p>{config ? config.company : 'Afsarnamak Chai Pvt Ltd'}<br />{config ? config.address : ''}</p>
          <p><a href={`tel:${config ? config.phone.replace(/\s/g, '') : ''}`}>{config ? config.phone : ''}</a><br /><a href={`tel:${config ? (config.phone2 || '').replace(/\s/g, '') : ''}`}>{config ? config.phone2 : ''}</a><br /><a href={`mailto:${config ? config.email : ''}`}>{config ? config.email : ''}</a></p>
        </div>
      </div>
      <div className="foot-bottom"><div className="wrap">&copy; {new Date().getFullYear()} Way Cup Chai &middot; {config ? config.company : ''}. All rights reserved. &nbsp; <span className="fssai">FSSAI licensed</span></div></div>
    </footer>
  );
}

export function Floaters() {
  const { config, toast } = useApp();
  return (
    <>
      {config && <a className="wa-fab" href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Hi Way Cup Chai! I would like to order chai.')}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff" aria-hidden="true"><path d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.3.6 4.4 1.7 6.3L3 29l7.4-2c1.8 1 3.7 1.500 5.700 1.500 7 0 12.600-5.600 12.600-12.500S23 3 16 3zm0 22.800c-1.800 0-3.600-.5-5.100-1.400l-.4-.2-4.400 1.200 1.200-4.300-.3-.4a10.200 10.200 0 0 1-1.600-5.500C5.400 9.700 10.100 5.200 16 5.200s10.600 4.500 10.600 10.300S21.900 25.800 16 25.800zm5.800-7.600c-.3-.2-1.900-.9-2.200-1-.3-.1-.5-.2-.7.200-.2.300-.8 1-1 1.200-.2.200-.4.200-.700.100-.300-.2-1.300-.5-2.500-1.500-.9-.8-1.500-1.800-1.700-2.100-.2-.3 0-.5.100-.6l.5-.6c.200-.2.200-.3.300-.5.100-.2.100-.4 0-.5l-1-2.300c-.2-.600-.5-.5-.7-.5h-.6c-.2 0-.5.100-.8.400-.3.300-1.100 1.100-1.100 2.600s1.100 3 1.300 3.200c.2.200 2.200 3.400 5.300 4.700 2 .8 2.800.9 3.800.7.600-.1 1.900-.8 2.200-1.500.3-.7.300-1.400.2-1.500-.1-.1-.3-.2-.6-.4z" /></svg>
      </a>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export { EnquiryModal };
