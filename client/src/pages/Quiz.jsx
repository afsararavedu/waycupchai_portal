import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHero, useSeo, useFetch, ProductCard, Loading } from '../components/Common';

const QUESTIONS = [
  { q: 'How do you like your chai?', opts: [['strong', 'Strong & milky'], ['light', 'Light & clear (no milk)'], ['fancy', 'Something special / dessert-like']] },
  { q: 'Pick a flavour you love', opts: [['masala', 'Warm spices (clove, cinnamon)'], ['elaichi', 'Cardamom'], ['floral', 'Floral & sweet (rose, vanilla)'], ['herbal', 'Fresh herbal (tulsi)'], ['choco', 'Chocolate']] },
  { q: 'When will you drink it?', opts: [['morning', 'Morning wake-up'], ['evening', 'Evening break'], ['night', 'After dinner'], ['gift', "It's a gift"]] },
];

function pick(a) {
  if (a[2] === 'gift') return { slug: 'way-cup-gift-pack', why: 'Ready-to-gift pouches tied with a ribbon.' };
  if (a[0] === 'light' || a[1] === 'herbal') return { slug: 'tulsi-green-chai', why: 'Light, refreshing and milk-free.' };
  if (a[1] === 'choco') return { slug: 'chocolate-spice-chai', why: 'Dessert in a cup with warming spices.' };
  if (a[1] === 'floral') return { slug: 'rose-vanilla-chai', why: 'Floral, soothing and gently sweet.' };
  if (a[0] === 'fancy' || a[2] === 'night') return { slug: 'kahwa-saffron-almond-chai', why: 'Golden saffron-almond kahwa, lovely after dinner.' };
  if (a[1] === 'elaichi') return { slug: 'elaichi-cardamom-chai', why: 'Bold Assam CTC with fragrant cardamom.' };
  return { slug: 'way-cup-premium-masala-chai', why: 'Our signature clove-cinnamon-bay leaf masala - strong and aromatic.' };
}

export default function Quiz() {
  useSeo('What tea is best for me?', 'Take the Way Cup Chai quiz to find the chai that suits your taste.');
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState([]);
  const done = step >= QUESTIONS.length;
  const rec = done ? pick(ans) : null;
  const all = useFetch('/products');
  const p = rec && all.data ? all.data.find(x => x.slug === rec.slug) : null;
  return (
    <>
      <PageHero title="What tea is best for me?" sub="Three quick questions" image="/images/chai-pour.jpg" />
      <div className="wrap section narrow quiz">
        {!done ? (
          <>
            <div className="quiz-progress"><div style={{ width: `${(step / QUESTIONS.length) * 100}%` }} /></div>
            <h2>{QUESTIONS[step].q}</h2>
            <div className="quiz-opts">{QUESTIONS[step].opts.map(([v, l]) => <button key={v} className="btn ghost" onClick={() => { setAns([...ans, v]); setStep(step + 1); }}>{l}</button>)}</div>
          </>
        ) : (
          <>
            <h2>Your perfect chai</h2><p className="muted">{rec.why}</p>
            {all.loading ? <Loading /> : p ? <div className="pgrid one"><ProductCard p={p} /></div> : <Link className="btn" to="/shop">Browse all chai</Link>}
            <button className="btn ghost" onClick={() => { setStep(0); setAns([]); }}>Retake quiz</button>
          </>
        )}
      </div>
    </>
  );
}
