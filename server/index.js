require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const seed = require('./seed');
seed();

const app = express();
app.set('trust proxy', 1); // Hostinger sits behind a proxy
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'", 'https://checkout.razorpay.com'],
      'frame-src': ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com', 'https://www.youtube.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://lumberjack.razorpay.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? [process.env.SITE_URL || 'https://waycupchai.com'] : true }));
app.use(express.json({ limit: '200kb' }));

app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.use('/api', require('./routes/public'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ---- React build ----
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true }));
  app.use('/images', express.static(path.join(dist, 'images'), { maxAge: '30d' }));
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  const db = require('./db');
  const { config } = require('./lib');
  // Re-read index.html when the build changes (so a new `npm run build` never serves stale asset hashes)
  let htmlCache = { mtime: 0, text: '' };
  const getIndexHtml = () => {
    const f = path.join(dist, 'index.html');
    const m = fs.statSync(f).mtimeMs;
    if (m !== htmlCache.mtime) htmlCache = { mtime: m, text: fs.readFileSync(f, 'utf8') };
    return htmlCache.text;
  };

  // robots + sitemap
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nSitemap: ${config().siteUrl}/sitemap.xml\n`));
  app.get('/sitemap.xml', (_req, res) => {
    const base = config().siteUrl;
    const urls = ['/', '/shop', '/gifting', '/wholesale', '/blog', '/sourcing', '/about-us', '/about-tea', '/what-tea-is-best-for-me', '/faq', '/contact-us', '/offers', '/events',
      ...db.all('products').filter(p => p.active !== false).map(p => `/product/${p.slug}`), ...db.all('posts').map(p => `/blog/${p.slug}`)];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${base}${u}</loc></url>`).join('')}</urlset>`);
  });

  // Per-page SEO tags injected for crawlers & link previews (product + blog pages)
  const escAttr = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  app.get('*', (req, res) => {
    let title = 'Way Cup Chai - Premium Assam Chai | Na Kam Na Ziyada Ekdam Perfect';
    let desc = 'Buy premium Assam CTC chai, masala chai, kahwa and wellness teas online from Way Cup Chai, Rayachoty. Fresh blends from the heart of Assam tea gardens. Wholesale available.';
    let image = '/images/logo.png';
    const m = req.path.match(/^\/product\/([^/]+)/);
    if (m) { const p = db.find('products', x => x.slug === m[1]); if (p) { title = `${p.name} | Buy Online - Way Cup Chai`; desc = p.short; image = p.images[0] || image; } }
    const b = req.path.match(/^\/blog\/([^/]+)/);
    if (b) { const p = db.find('posts', x => x.slug === b[1]); if (p) { title = `${p.title} | Way Cup Chai Blog`; desc = p.excerpt; image = p.image; } }
    const base = config().siteUrl;
    const html = getIndexHtml()
      .replace(/<title>.*?<\/title>/, `<title>${escAttr(title)}</title>`)
      .replace('</head>', `<meta name="description" content="${escAttr(desc)}"><link rel="canonical" href="${base}${req.path}"><meta property="og:title" content="${escAttr(title)}"><meta property="og:description" content="${escAttr(desc)}"><meta property="og:image" content="${base}${image}"><meta property="og:type" content="website"><meta property="og:site_name" content="Way Cup Chai"><meta name="twitter:card" content="summary_large_image"></head>`);
    res.type('html').send(html);
  });
} else {
  app.get('/', (_req, res) => res.send('API running. Build the client: npm run build'));
}

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Something went wrong' }); });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Way Cup Chai running on port ${port}`));
