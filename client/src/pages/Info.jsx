import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHero, useSeo, EnquiryForm, useFetch, ProductCard, Loading } from '../components/Common';
import { useApp } from '../state';

export function AboutUs() {
  useSeo('About us', 'Way Cup Chai by Afsarnamak Chai Pvt Ltd, Rayachoty - premium Assam chai, blended and packed in small batches.');
  return (
    <>
      <PageHero title="About Way Cup Chai" sub="Aroma. Robust. Marvellous." image="/images/brand-grid.jpg" />
      <div className="wrap section narrow prose">
        <img src="/images/logo.png" alt="Way Cup Chai badge" className="prose-logo" />
        <p>Way Cup Chai is the chai brand of <b>Afsarnamak Chai Pvt Ltd</b>, based in Kothapeta, Rayachoty in Andhra Pradesh. Our promise is in our tagline &mdash; <i>Na Kam Na Ziyada, Ekdam Perfect</i>: not too little, not too much, just right.</p>
        <p>We source CTC tea from the gardens of Upper Assam, blend it with whole spices like clove, cinnamon, bay leaf and cardamom, and pack it fresh in resealable pouches. Every blend is added with immune vitamins and made to be boiled with milk for the kind of chai you remember from your favourite tea stall.</p>
        <h2>What we stand for</h2>
        <ul><li><b>Strong, honest chai</b> &mdash; bold Assam leaf, no fuss.</li><li><b>Small batches</b> &mdash; blended and packed fresh at home base.</li><li><b>Fair sourcing</b> &mdash; direct relationships with growers and producers.</li><li><b>For everyone</b> &mdash; from households and tea stalls to hotels and offices.</li></ul>
        <img src="/images/bags.jpg" alt="Way Cup Chai branded bags" className="wide" loading="lazy" />
      </div>
    </>
  );
}

export function Sourcing() {
  useSeo('Our story & sourcing', 'From the hearts of Assam tea gardens - how Way Cup Chai sources and blends its tea.');
  return (
    <>
      <PageHero title="From the hearts of Assam tea gardens" sub="Our story & sourcing" image="/images/story-garden.jpg" />
      <div className="wrap section prose two-col">
        <img src="/images/story-dibrugarh.jpg" alt="Founder at Dibrugarh airport on the way to the Assam tea gardens" loading="lazy" />
        <div>
          <h2>Meet the leaf at its source</h2>
          <p>Assam produces more tea than anywhere else in India, and Upper Assam &mdash; around Dibrugarh &mdash; is famous for its strong, malty leaf. Our founder travels there personally to choose the tea that goes into every Way Cup Chai pouch.</p>
          <p>The leaf is CTC (crush, tear, curl), which brews fast and dark and stands up to milk and spice. Back in Rayachoty, it is blended with whole spices, quality-checked and packed in small batches.</p>
          <p>Short chain, fresh pack, honest chai.</p>
        </div>
      </div>
      <div className="wrap section"><div className="steps-row">
        {[['1', 'Garden', 'Hand-picked leaf from Upper Assam'], ['2', 'Select', 'Grades chosen personally at source'], ['3', 'Blend', 'Whole spices & vitamins added'], ['4', 'Pack', 'Fresh, resealable pouches (FSSAI licensed)'], ['5', 'Your cup', 'Shipped across India']].map(([n, t, d]) => <div key={n}><span>{n}</span><b>{t}</b><small>{d}</small></div>)}
      </div></div>
      <div className="center section"><Link className="btn" to="/shop">Taste the difference</Link></div>
    </>
  );
}

export function AboutTea() {
  useSeo('About tea', 'Types of tea, CTC vs orthodox, grades like BOP and dust, and how to brew the perfect cup.');
  return (
    <>
      <PageHero title="About tea" sub="A short guide to what's in your cup" image="/images/chai-pour.jpg" />
      <div className="wrap section narrow prose">
        <h2>CTC explained</h2><p>CTC stands for crush, tear, curl. Leaves are processed into small, hard granules that brew quickly into a strong, dark cup &mdash; ideal for milk chai.</p>
        <h2>Common grades</h2>
        <ul><li><b>Dust</b> &mdash; the finest grade; brews fastest and strongest.</li><li><b>PF / PD</b> &mdash; Pekoe Fannings and Pekoe Dust; small granules, strong liquor.</li><li><b>BOP</b> &mdash; Broken Orange Pekoe; slightly larger pieces, balanced strength and aroma.</li><li><b>BOPS</b> &mdash; a BOP-family grade with a bolder, brisker character.</li></ul>
        <h2>The perfect cup</h2><p>Boil 1 cup of water with about 1 teaspoon of tea for two minutes, add milk and sugar, simmer for 2&ndash;3 minutes, strain and serve hot. For green and herbal tea, steep in hot (not boiling) water for 2&ndash;4 minutes.</p>
        <h2>Spices we use</h2><p>Clove (lovang), cinnamon (dalchini), bay leaf (tej patta), cardamom (elaichi), saffron, rose, vanilla and tulsi, depending on the blend.</p>
      </div>
    </>
  );
}

const FAQS = [
  ['Do you offer Cash on Delivery?', 'Yes. Cash on Delivery is available across India. Online payment (UPI / cards) is shown at checkout when enabled.'],
  ['How long does delivery take?', 'Usually 2-4 business days in South India and 4-7 business days elsewhere in India.'],
  ['Is shipping free?', 'Shipping is free on orders of Rs.450 and above. A small fee applies below that.'],
  ['How do I make the perfect cup of chai?', 'Boil water with about a teaspoon of tea for two minutes, add milk and sugar, simmer 2-3 minutes and strain. See the brewing notes on every product page.'],
  ['Is Way Cup Chai FSSAI licensed?', 'Yes. Our pouches carry our FSSAI licence number.'],
  ['Do you supply wholesale and private label?', 'Yes - CTC, dust, PF, PD, BOP and BOPS grades in bulk, plus private-label options. Use the Wholesale enquiry form.'],
  ['How should I store the tea?', 'Reseal the pouch after use and keep it in a cool, dry place away from sunlight and strong smells.'],
  ['How can I track my order?', 'Use the Track Order page with your order number and phone number, or log in to your account.'],
];
export function FAQ() {
  useSeo('FAQs');
  const [open, setOpen] = useState(0);
  return (
    <>
      <PageHero title="Frequently asked questions" />
      <div className="wrap section narrow">
        {FAQS.map(([q, a], i) => <div key={q} className={`faq ${open === i ? 'open' : ''}`}><button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>{q}<span>{open === i ? '−' : '+'}</span></button>{open === i && <p>{a}</p>}</div>)}
        <p className="center-link">Still have a question? <Link to="/contact-us">Contact us</Link></p>
      </div>
    </>
  );
}

export function Contact() {
  useSeo('Contact us');
  const { config } = useApp();
  return (
    <>
      <PageHero title="Contact us" sub="We'd love to hear from you" />
      <div className="wrap section two-col">
        <div className="prose">
          <h2>Way Cup Chai</h2>
          <p><b>{config ? config.company : 'Afsarnamak Chai Pvt Ltd'}</b><br />{config ? config.address : ''}</p>
          <p>Phone: <a href={`tel:${config ? config.phone.replace(/\s/g, '') : ''}`}>{config ? config.phone : ''}</a> / <a href={`tel:${config ? config.phone2.replace(/\s/g, '') : ''}`}>{config ? config.phone2 : ''}</a><br />Email: <a href={`mailto:${config ? config.email : ''}`}>{config ? config.email : ''}</a></p>
          {config && <a className="btn alt" href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>}
          <iframe title="Map to Way Cup Chai, Rayachoty" className="map" loading="lazy" src="https://www.google.com/maps?q=Kothapeta+Rayachoty+516269&output=embed" />
        </div>
        <div><h2>Send a message</h2><EnquiryForm kind="contact" compact /></div>
      </div>
    </>
  );
}

export function Wholesale() {
  useSeo('Wholesale tea', 'Bulk CTC, dust, PF, PD, BOP and BOPS tea for tea stalls, hotels, cafes, offices and retailers. Private label available.');
  return (
    <>
      <PageHero title="Wholesale chai" sub="Fresh CTC, Dust, PF, PD, BOP & BOPS in bulk" image="/images/poster.jpg" />
      <div className="wrap section two-col">
        <div className="prose">
          <h2>Partner with Way Cup Chai</h2>
          <p>Whether you run a tea stall, hotel, restaurant, cafe, office pantry or retail shop, we supply consistent, strong Assam CTC at wholesale rates &mdash; with the Way Cup quality you can taste.</p>
          <ul><li>Grades: CTC, Dust, PF, PD, BOP, BOPS</li><li>Masala, green, Irani and chocolate-flavoured blends</li><li>Bulk packs and custom sizes</li><li>Private-label / own-brand packing</li><li>Dispatch across India</li></ul>
          <img src="/images/poster.jpg" alt="Way Cup Chai wholesale grades" loading="lazy" />
        </div>
        <div><h2>Request wholesale prices</h2><EnquiryForm kind="wholesale" /></div>
      </div>
    </>
  );
}

export function Gifting() {
  useSeo('Gifting', 'Way Cup Chai gift packs and corporate gifting.');
  const { data, loading } = useFetch('/products?collection=gifting');
  return (
    <>
      <PageHero title="Gifting" sub="Chai makes a thoughtful gift" image="/images/bags.jpg" />
      <div className="wrap section">
        {loading ? <Loading /> : <div className="pgrid">{data.map(p => <ProductCard key={p.id} p={p} />)}</div>}
        <div className="two-col gift-form">
          <div className="prose"><h2>Corporate &amp; bulk gifting</h2><p>Festivals, weddings, client gifts, employee hampers &mdash; tell us your quantity and budget and we'll put together a custom Way Cup Chai gift set.</p></div>
          <EnquiryForm kind="gifting" compact />
        </div>
      </div>
    </>
  );
}

export function Events() {
  useSeo('Events');
  const { data } = useFetch('/events');
  return (
    <>
      <PageHero title="Events" sub="Bring Way Cup Chai to your venue" image="/images/good-choice.jpg" />
      <div className="wrap section two-col">
        <div className="prose"><h2>Live chai counters &amp; tastings</h2>{(data || []).map(e => <p key={e.id}><b>{e.title}</b> &mdash; {e.note}</p>)}<p>Planning a wedding, office party or festival? Tell us the date, venue and number of guests.</p></div>
        <EnquiryForm kind="event" compact />
      </div>
    </>
  );
}

const Doc = ({ title, children }) => { useSeo(title); return (<><PageHero title={title} /><div className="wrap section narrow prose">{children}<p className="muted"><i>Last updated: October 2026</i></p></div></>); };

export const Returns = () => (
  <Doc title="Return & refund policy">
    <p>Because tea is a food product, we cannot accept returns of opened packs. We want you to be delighted with every order, so:</p>
    <ul><li>If your order arrives <b>damaged, leaking or incorrect</b>, contact us within <b>48 hours of delivery</b> with your order number and a photo. We will replace it or refund you.</li><li>Orders can be <b>cancelled before dispatch</b> at no charge. Call or WhatsApp us as soon as possible.</li><li>Refunds for online payments are returned to the original payment method within 5-7 business days after approval.</li><li>Cash-on-Delivery refunds are made by bank/UPI transfer.</li></ul>
    <p>Contact: see our <Link to="/contact-us">Contact page</Link>.</p>
  </Doc>
);
export const Privacy = () => (
  <Doc title="Privacy policy">
    <p>Afsarnamak Chai Pvt Ltd (&quot;Way Cup Chai&quot;) respects your privacy. We collect the details you give us &mdash; name, phone, email and delivery address &mdash; only to process orders, provide support and (if you opt in) send offers.</p>
    <ul><li>We do not sell your personal data.</li><li>Payments are processed by Razorpay; we never see or store your card or UPI details.</li><li>We share delivery details with courier partners solely to deliver your order.</li><li>You can ask us to update or delete your data by contacting us.</li></ul>
  </Doc>
);
export const Terms = () => (
  <Doc title="Terms & conditions">
    <p>By using waycupchai.com you agree to these terms. Products, prices and offers may change without notice. Prices are in Indian Rupees and inclusive of applicable taxes. We reserve the right to cancel orders in case of pricing or stock errors, with a full refund of any payment made.</p>
    <p>Delivery times are estimates. Product images are illustrative. All content, logos and brand names are the property of Afsarnamak Chai Pvt Ltd.</p>
  </Doc>
);

export function NotFound() {
  useSeo('Page not found');
  return <div className="wrap section center"><h1>404</h1><p>We couldn't find that page.</p><Link className="btn" to="/">Back to home</Link></div>;
}
