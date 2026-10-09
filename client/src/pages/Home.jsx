import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch, ProductCard, SectionHead, useSeo, Loading } from '../components/Common';
import { useApp } from '../state';

const SLIDES = [
  { img: '/images/packs.jpg', kicker: 'Aroma · Robust · Marvellous', title: 'Best Chai from the Heart of Assam', text: 'Strong, fragrant CTC chai blended in small batches. Na kam, na ziyada — ekdam perfect.', cta: ['Shop chai', '/shop'], cta2: ['Our story', '/sourcing'], pos: 'center' },
  { img: '/images/chai-pour.jpg', kicker: 'Masala · Elaichi · Kahwa', title: 'Time for a proper cup', text: 'Clove, cinnamon, cardamom and saffron — pour yourself something warm.', cta: ['Explore flavours', '/shop?collection=gourmet'], cta2: ['Which chai is for me?', '/what-tea-is-best-for-me'], pos: 'center' },
  { img: '/images/story-garden.jpg', kicker: 'Wholesale · Hotels · Tea stalls', title: 'Chai for every counter, café and kitchen', text: 'Fresh CTC, Dust, PF, PD, BOP & BOPS in bulk for shops, cafes and offices.', cta: ['Wholesale enquiry', '/wholesale'], cta2: ['Gifting', '/gifting'], pos: 'center' },
];

const TILES = [
  { t: 'Classic CTC Chai', img: '/images/packs.jpg', to: '/shop?type=ctc-tea' },
  { t: 'Masala & Elaichi', img: '/images/p-cardamom.jpg', to: '/shop?collection=masala' },
  { t: 'Wellness Tea', img: '/images/p-tulsi.jpg', to: '/shop?collection=wellness' },
  { t: 'Gourmet & Kahwa', img: '/images/p-kahwa.jpg', to: '/shop?collection=gourmet' },
  { t: 'Gift Packs', img: '/images/bags.jpg', to: '/gifting' },
];

export default function Home() {
  useSeo('', 'Buy premium Assam CTC chai, masala chai, kahwa and wellness teas online from Way Cup Chai, Rayachoty. Fresh blends from the heart of Assam tea gardens.');
  const [i, setI] = useState(0);
  const { setEnquiry } = useApp();
  const trending = useFetch('/products?tag=trending');
  const best = useFetch('/products?tag=best-selling');
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % SLIDES.length), 6000); return () => clearInterval(t); }, []);

  return (
    <>
      <section className="hero" aria-roledescription="carousel">
        {SLIDES.map((s, n) => (
          <div key={s.title} className={`slide ${n === i ? 'on' : ''}`} style={{ '--img': `url(${s.img})`, backgroundImage: `linear-gradient(90deg,rgba(60,12,28,.88) 0%,rgba(60,12,28,.6) 45%,rgba(60,12,28,.2) 100%),url(${s.img})`, backgroundPosition: s.pos }} aria-hidden={n !== i}>
            <div className="wrap slide-in">
              <span className="kicker">{s.kicker}</span>
              <h1>{s.title}</h1>
              <p>{s.text}</p>
              <div className="hero-cta"><Link className="btn" to={s.cta[1]}>{s.cta[0]}</Link><Link className="btn ghost light" to={s.cta2[1]}>{s.cta2[0]}</Link></div>
            </div>
          </div>
        ))}
        <div className="dots">{SLIDES.map((_, n) => <button key={n} className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={`Slide ${n + 1}`} />)}</div>
      </section>

      <section className="strip"><div className="wrap strip-in">
        <div><b>&#127807; Direct from Assam</b><span>Hand-picked from Upper Assam gardens</span></div>
        <div><b>&#128230; Fresh packed</b><span>Small batches, resealable pouches</span></div>
        <div><b>&#9989; FSSAI licensed</b><span>Quality you can trust</span></div>
        <div><b>&#128666; Free shipping</b><span>On orders above &#8377;450</span></div>
      </div></section>

      <section className="section"><div className="wrap">
        <SectionHead title="Shop by category" sub="Find your cup" />
        <div className="tiles">{TILES.map(t => <Link key={t.t} to={t.to} className="tile"><img src={t.img} alt="" loading="lazy" /><span>{t.t}</span></Link>)}</div>
      </div></section>

      <section className="section alt"><div className="wrap">
        <SectionHead title="Trending now" sub="What everyone is brewing" to="/trending" />
        {trending.loading ? <Loading /> : <div className="pgrid">{(trending.data || []).slice(0, 4).map(p => <ProductCard key={p.id} p={p} />)}</div>}
      </div></section>

      <section className="story"><div className="wrap story-in">
        <img src="/images/story-garden.jpg" alt="Founder standing in an Assam tea garden" loading="lazy" />
        <div>
          <span className="kicker dark">Our story</span>
          <h2>From the hearts of Assam tea gardens</h2>
          <p>Way Cup Chai began with a simple belief: a good cup of chai should be strong, fragrant and honest. We travel to the tea gardens of Upper Assam, choose the leaf ourselves, then blend and pack in small batches at our home base in Rayachoty, Andhra Pradesh.</p>
          <p>No shortcuts, no fuss &mdash; just <b>aroma, robust flavour and a marvellous finish</b> in every cup.</p>
          <Link className="btn" to="/sourcing">Read our story</Link>
        </div>
      </div></section>

      <section className="section"><div className="wrap">
        <SectionHead title="Time for self-care" sub="Explore Way Cup Chai" />
        <div className="quick">
          <Link to="/what-tea-is-best-for-me"><b>&#127861; What tea is best for me?</b><span>Take the 1-minute chai quiz</span></Link>
          <Link to="/about-tea"><b>&#128218; About tea</b><span>Types, grades and brewing</span></Link>
          <Link to="/sourcing"><b>&#127807; Sourcing</b><span>Assam gardens to your cup</span></Link>
          <Link to="/shop"><b>&#128717; Shop all</b><span>Every blend in one place</span></Link>
          <Link to="/gifting"><b>&#127873; Gifting</b><span>Pouch packs &amp; hampers</span></Link>
          <Link to="/wholesale"><b>&#128188; Wholesale</b><span>Bulk CTC &amp; dust grades</span></Link>
        </div>
      </div></section>

      <section className="section alt"><div className="wrap">
        <SectionHead title="Best sellers" sub="Customer favourites" to="/best-selling" />
        {best.loading ? <Loading /> : <div className="pgrid">{(best.data || []).slice(0, 4).map(p => <ProductCard key={p.id} p={p} />)}</div>}
      </div></section>

      <section className="banner-cta">
        <img src="/images/about-banner.jpg" alt="Way Cup Chai - Robust, Aromatic, Marvellous" loading="lazy" />
        <div className="wrap"><div>
          <h2>Own a tea stall, cafe, hotel or shop?</h2>
          <p>Get fresh Assam CTC, dust, PF, PD, BOP and BOPS in bulk &mdash; plus private-label options.</p>
          <button className="btn" onClick={() => setEnquiry({ kind: 'wholesale' })}>Request wholesale prices</button>
        </div></div>
      </section>

      <section className="section seo"><div className="wrap narrow">
        <h2>Buy premium Assam chai online</h2>
        <p>Way Cup Chai brings the bold, malty taste of Assam CTC to your kitchen. Choose from our signature masala chai with clove, cinnamon and bay leaf, fragrant elaichi chai, Kashmiri-style kahwa, dessert-style chocolate chai, soothing rose &amp; vanilla and refreshing tulsi green chai.</p>
        <h3>Why Assam CTC?</h3>
        <p>CTC (crush, tear, curl) leaves brew quickly into a deep, strong cup that stands up beautifully to milk and spices &mdash; the way India has loved its chai for generations. Read more in our <Link to="/about-tea">guide to tea</Link>.</p>
        <h3>Wholesale &amp; gifting</h3>
        <p>Businesses can enquire about <Link to="/wholesale">wholesale tea</Link> for bulk orders, and our <Link to="/gifting">gift packs</Link> make thoughtful presents for family, friends and teams.</p>
      </div></section>
    </>
  );
}
