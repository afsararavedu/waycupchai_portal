import { useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useFetch, ProductCard, PageHero, Loading, useSeo } from '../components/Common';

const TYPES = [['', 'All'], ['ctc-tea', 'CTC Chai'], ['green-tea', 'Green Tea'], ['herbal-tea', 'Herbal / Kahwa'], ['gift-box', 'Gift Packs']];
const COLLECTIONS = [['', 'All'], ['classic', 'Classic'], ['masala', 'Masala'], ['wellness', 'Wellness'], ['gourmet', 'Gourmet'], ['gifting', 'Gifting']];

const PRESET = {
  '/trending': { tag: 'trending', title: 'Trending chai', sub: 'What everyone is brewing right now' },
  '/signature': { tag: 'signature', title: 'Signature blends', sub: 'The blends we are proudest of' },
  '/best-selling': { tag: 'best-selling', title: 'Best sellers', sub: 'Customer favourites' },
  '/offers': { sale: true, title: 'Offers & deals', sub: 'Save more on your favourite chai' },
};

export default function Shop() {
  const { pathname } = useLocation();
  const preset = PRESET[pathname];
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const f = { type: sp.get('type') || '', collection: sp.get('collection') || '', tag: preset ? preset.tag || '' : sp.get('tag') || '', region: sp.get('region') || '', q: sp.get('q') || '', sort: sp.get('sort') || '', max: sp.get('max') || '' };
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const { data, loading, error } = useFetch(`/products?${qs}`);
  const title = preset ? preset.title : f.q ? `Search: "${f.q}"` : 'Shop all chai';
  useSeo(title, 'Browse Way Cup Chai - premium Assam CTC, masala, kahwa and wellness teas.');
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n); };

  let list = data || [];
  if (preset && preset.sale) list = list.filter(p => p.fromMrp > p.fromPrice);

  return (
    <>
      <PageHero title={title} sub={preset ? preset.sub : `${list.length} product${list.length === 1 ? '' : 's'}`} image="/images/story-garden.jpg" />
      <div className="wrap shop">
        {!preset && (
          <>
            <button className="btn ghost sm filter-toggle" onClick={() => setFiltersOpen(o => !o)}>{filtersOpen ? 'Hide filters' : 'Filters & sort'}</button>
            <aside className={`filters ${filtersOpen ? 'open' : ''}`}>
              <h4>Type</h4>{TYPES.map(([v, l]) => <button key={v} className={f.type === v ? 'on' : ''} onClick={() => set('type', v)}>{l}</button>)}
              <h4>Collection</h4>{COLLECTIONS.map(([v, l]) => <button key={v} className={f.collection === v ? 'on' : ''} onClick={() => set('collection', v)}>{l}</button>)}
              <h4>Price</h4>{[['', 'Any'], ['100', 'Under ₹100'], ['250', 'Under ₹250'], ['500', 'Under ₹500']].map(([v, l]) => <button key={v} className={f.max === v ? 'on' : ''} onClick={() => set('max', v)}>{l}</button>)}
              <h4>Sort by</h4>
              <select value={f.sort} onChange={e => set('sort', e.target.value)} aria-label="Sort products">
                <option value="">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Top rated</option><option value="name">Name A-Z</option>
              </select>
              {(f.type || f.collection || f.max || f.region || f.tag || f.q) && <button className="linklike clear" onClick={() => setSp({})}>Clear all filters</button>}
            </aside>
          </>
        )}
        <div className="shop-main" style={preset ? { gridColumn: '1 / -1' } : undefined}>
          {loading ? <Loading /> : error ? <p className="err">{error}</p> : list.length === 0 ? <p className="empty">No products match. Try clearing filters.</p> : <div className="pgrid">{list.map(p => <ProductCard key={p.id} p={p} />)}</div>}
        </div>
      </div>
    </>
  );
}
