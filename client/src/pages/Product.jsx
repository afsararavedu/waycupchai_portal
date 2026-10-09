import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api, rupee, off } from '../api';
import { useApp } from '../state';
import { useFetch, Stars, ProductCard, Loading, useSeo } from '../components/Common';

export default function Product() {
  const { slug } = useParams();
  const { data, error, loading } = useFetch(`/products/${slug}`);
  if (loading) return <Loading />;
  if (error) return <div className="wrap section"><h2>Product not found</h2><Link className="btn" to="/shop">Back to shop</Link></div>;
  return <ProductView key={slug} data={data} />;
}

function ProductView({ data }) {
  const { product: p, reviews, related } = data;
  const { addToCart, wishlist, toggleWish, config } = useApp();
  const nav = useNavigate();
  const [vid, setVid] = useState(p.variants[0].id);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tab, setTab] = useState('desc');
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  useSeo(p.name, p.short);
  const v = p.variants.find(x => x.id === vid);
  const out = v.stock != null && v.stock < 1;

  const checkPin = async (e) => { e.preventDefault(); try { setPinMsg((await api.get(`/pincode/${pin}`)).message); } catch (err) { setPinMsg(err.message); } };
  const waText = encodeURIComponent(`Hi Way Cup Chai! I'd like to order ${p.name} (${v.label}).`);

  return (
    <div className="wrap pdp">
      <nav className="crumbs"><Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{p.name}</span></nav>
      <div className="pdp-grid">
        <div className="gallery">
          <div className="gmain"><img src={p.images[img]} alt={p.name} />{off(v.mrp, v.price) > 0 && <span className="ribbon">{off(v.mrp, v.price)}% OFF</span>}</div>
          {p.images.length > 1 && <div className="gthumbs">{p.images.map((s, i) => <button key={s} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`}><img src={s} alt="" /></button>)}</div>}
        </div>
        <div className="pinfo">
          <h1>{p.name}</h1>
          <Stars value={p.rating} count={p.reviewCount} />
          <p className="short">{p.short}</p>
          <div className="pdp-price"><b>{rupee(v.price)}</b>{v.mrp > v.price && <s>{rupee(v.mrp)}</s>}{off(v.mrp, v.price) > 0 && <em>Save {off(v.mrp, v.price)}%</em>}<small>Inclusive of all taxes</small></div>
          <h4>Pack size</h4>
          <div className="variants">{p.variants.map(x => <button key={x.id} className={x.id === vid ? 'on' : ''} disabled={x.stock != null && x.stock < 1} onClick={() => { setVid(x.id); setQty(1); }}>{x.label}<small>{rupee(x.price)}</small></button>)}</div>
          <div className="buyrow">
            <div className="qty big"><button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease">&minus;</button><span>{qty}</span><button onClick={() => setQty(q => Math.min(20, q + 1))} aria-label="Increase">+</button></div>
            <button className="btn" disabled={out} onClick={() => addToCart(p, v, qty)}>{out ? 'Out of stock' : 'Add to cart'}</button>
            <button className="btn alt" disabled={out} onClick={() => { addToCart(p, v, qty, false); nav('/checkout'); }}>Buy now</button>
            <button className={`heart inline ${wishlist.includes(p.id) ? 'on' : ''}`} onClick={() => toggleWish(p.id)} aria-label="Wishlist">{wishlist.includes(p.id) ? '♥' : '♡'}</button>
          </div>
          {v.stock != null && v.stock > 0 && v.stock <= 10 && <p className="low">Only {v.stock} left!</p>}
          <form className="pin" onSubmit={checkPin}><input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter pincode" inputMode="numeric" aria-label="Pincode" /><button className="btn ghost sm">Check delivery</button>{pinMsg && <small>{pinMsg}</small>}</form>
          <ul className="perks"><li>&#128666; Free shipping above {rupee(config ? config.freeShippingMin : 450)}</li><li>&#128181; Cash on Delivery available</li><li>&#127807; Direct from Assam gardens</li></ul>
          {config && <a className="wa-link" href={`https://wa.me/${config.whatsapp}?text=${waText}`} target="_blank" rel="noreferrer">Order on WhatsApp &rarr;</a>}
        </div>
      </div>

      <div className="tabs">
        <div className="tab-btns" role="tablist">{[['desc', 'Description'], ['brew', 'How to brew'], ['ing', 'Ingredients'], ['rev', `Reviews (${reviews.length})`]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
        <div className="tab-body">
          {tab === 'desc' && <p>{p.description}</p>}
          {tab === 'brew' && <p>{p.brew}</p>}
          {tab === 'ing' && <p>{p.ingredients}</p>}
          {tab === 'rev' && <Reviews product={p} reviews={reviews} />}
        </div>
      </div>

      {related.length > 0 && <section className="section"><h2>You may also like</h2><div className="pgrid">{related.map(r => <ProductCard key={r.id} p={r} />)}</div></section>}
    </div>
  );
}

function Reviews({ product, reviews }) {
  const { user } = useApp();
  const [f, setF] = useState({ name: user ? user.name : '', rating: 5, text: '' });
  const [msg, setMsg] = useState('');
  const submit = async (e) => { e.preventDefault(); try { const r = await api.post('/reviews', { ...f, productId: product.id }); setMsg(r.message); setF({ ...f, text: '' }); } catch (err) { setMsg(err.message); } };
  return (
    <div className="reviews">
      {reviews.length === 0 && <p className="muted">No reviews yet &mdash; be the first!</p>}
      {reviews.map(r => <div className="review" key={r.id}><Stars value={r.rating} /><b>{r.name}</b><p>{r.text}</p></div>)}
      <form className="form" onSubmit={submit}>
        <h4>Write a review</h4>
        <div className="grid2"><label>Your name<input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
          <label>Rating<select value={f.rating} onChange={e => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}</select></label></div>
        <label>Review<textarea required rows={3} value={f.text} onChange={e => setF({ ...f, text: e.target.value })} /></label>
        <button className="btn sm">Submit review</button>{msg && <p className="ok">{msg}</p>}
      </form>
    </div>
  );
}
