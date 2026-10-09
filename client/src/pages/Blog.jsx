import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageHero, useSeo, useFetch, Loading } from '../components/Common';

const CATS = [['', 'All'], ['all-about-tea', 'All about tea'], ['tea-recipes', 'Tea recipes'], ['from-bush-to-cup', 'From bush to cup'], ['tea-and-health', 'Tea & health']];
const label = (c) => (CATS.find(x => x[0] === c) || [0, c])[1];

export default function Blog() {
  useSeo('Blog', 'Chai recipes, tea guides and stories from the Assam tea gardens.');
  const [sp, setSp] = useSearchParams();
  const cat = sp.get('category') || '';
  const { data, loading } = useFetch(`/blog${cat ? `?category=${cat}` : ''}`);
  return (
    <>
      <PageHero title="The Way Cup blog" sub="Recipes, guides and stories" image="/images/story-garden.jpg" />
      <div className="wrap section">
        <div className="chips">{CATS.map(([v, l]) => <button key={v} className={`chip ${cat === v ? 'on' : ''}`} onClick={() => setSp(v ? { category: v } : {})}>{l}</button>)}</div>
        {loading ? <Loading /> : data.length === 0 ? <p className="empty">No posts in this category yet.</p> : (
          <div className="bgrid">{data.map(p => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="bcard"><img src={p.image} alt="" loading="lazy" /><div><small>{label(p.category)} &middot; {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small><h3>{p.title}</h3><p>{p.excerpt}</p><span>Read more &rarr;</span></div></Link>
          ))}</div>
        )}
      </div>
    </>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const { data, error, loading } = useFetch(`/blog/${slug}`);
  useSeo(data ? data.title : 'Blog', data ? data.excerpt : '');
  if (loading) return <Loading />;
  if (error) return <div className="wrap section"><h2>Post not found</h2><Link className="btn" to="/blog">Back to blog</Link></div>;
  return (
    <article className="wrap section narrow post">
      <nav className="crumbs"><Link to="/blog">Blog</Link> / <span>{label(data.category)}</span></nav>
      <h1>{data.title}</h1>
      <small>{new Date(data.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
      <img src={data.image} alt="" />
      {data.body.map((para, i) => <p key={i}>{para}</p>)}
      <div className="post-cta"><h3>Ready for a proper cup?</h3><Link className="btn" to="/shop">Shop Way Cup Chai</Link></div>
    </article>
  );
}
