// Seed data. Runs only for collections that don't exist yet, so your real data is never overwritten.
// EDIT PRICES / DESCRIPTIONS in the admin panel (/admin) or here before going live.
const bcrypt = require('bcryptjs');
const db = require('./db');

const img = (n) => `/images/${n}`;

// NOTE: prices below are PLACEHOLDERS (INR). Replace with your real MRP/selling prices.
const v = (grams, mrp, price, stock = 100) => ({ id: `${grams}g`, label: grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`, grams, mrp, price, stock });

const products = [
  {
    slug: 'way-cup-premium-masala-chai',
    name: 'Way Cup Premium Masala Chai',
    type: 'ctc-tea', collection: 'classic', region: 'assam',
    tags: ['best-selling', 'signature', 'trending', 'immunity'],
    short: 'Strong Assam CTC infused with clove, cinnamon and bay leaf. Our signature everyday cup.',
    description: 'Our signature blend: robust Assam CTC from the tea gardens of Upper Assam, finished with whole clove (lovang), cinnamon (dalchini) and bay leaf (tej patta). Dark, aromatic and full-bodied - made to be boiled with milk for a proper roadside-style chai at home. Added with immune vitamins.',
    ingredients: 'Assam CTC tea, clove (lovang), cinnamon (dalchini), bay leaf (tej patta)',
    brew: 'Boil 1 cup water + 1 tsp tea for 2 minutes, add 1/2 cup milk and sugar, simmer 2-3 minutes, strain and enjoy.',
    images: [img('packs.jpg'), img('poster.jpg')],
    variants: [v(100, 80, 70), v(250, 190, 165), v(500, 360, 310), v(1000, 700, 599)],
  },
  {
    slug: 'elaichi-cardamom-chai',
    name: 'Elaichi (Cardamom) Chai',
    type: 'ctc-tea', collection: 'masala', region: 'assam',
    tags: ['best-selling', 'trending'],
    short: 'Bold Assam CTC with fragrant green cardamom pods.',
    description: 'Fragrant green cardamom meets malty Assam CTC. A comforting, aromatic cup that smells as good as it tastes - the classic Indian elaichi chai.',
    ingredients: 'Assam CTC tea, green cardamom (elaichi)',
    brew: 'Boil 1 cup water + 1 tsp tea, add 1/2 cup milk, simmer for 2-3 minutes and strain.',
    images: [img('p-cardamom.jpg'), img('packs.jpg')],
    variants: [v(100, 90, 80), v(250, 215, 189), v(500, 410, 359)],
  },
  {
    slug: 'kahwa-saffron-almond-chai',
    name: 'Kahwa Chai - Saffron & Almond',
    type: 'herbal-tea', collection: 'gourmet', region: 'kashmir-style',
    tags: ['signature', 'gifting', 'trending'],
    short: 'A Kashmiri-style kahwa with saffron strands and sliced almonds.',
    description: 'A luxurious, golden cup inspired by traditional Kashmiri kahwa - delicate tea, saffron strands and sliced almonds. Lovely after dinner and a favourite for gifting.',
    ingredients: 'Green tea, saffron, almonds, cardamom, cinnamon',
    brew: 'Steep 1 tsp in 1 cup of hot water (90 C) for 3-4 minutes. Garnish with almond slivers and saffron.',
    images: [img('p-kahwa.jpg')],
    variants: [v(50, 260, 229), v(100, 480, 429)],
  },
  {
    slug: 'chocolate-spice-chai',
    name: 'Chocolate Spice Chai',
    type: 'ctc-tea', collection: 'gourmet', region: 'assam',
    tags: ['trending', 'dessert'],
    short: 'Dessert in a cup: Assam CTC with cocoa and warming spices.',
    description: 'Rich cocoa and warming spices wrapped around strong Assam CTC. A dessert-style chai that is wonderful with milk on a cold evening.',
    ingredients: 'Assam CTC tea, cocoa, clove, star anise',
    brew: 'Boil 1 cup milk-water mix with 1 tsp tea for 3 minutes, strain and sweeten to taste.',
    images: [img('p-chocolate.jpg')],
    variants: [v(100, 110, 99), v(250, 260, 229)],
  },
  {
    slug: 'rose-vanilla-chai',
    name: 'Rose & Vanilla Chai',
    type: 'ctc-tea', collection: 'gourmet', region: 'assam',
    tags: ['gifting', 'signature'],
    short: 'Floral rose petals and sweet vanilla in a smooth milk chai.',
    description: 'Dried rose petals and sweet vanilla lift a smooth Assam base into something floral and soothing. A gentle, fragrant chai for slow afternoons.',
    ingredients: 'Assam CTC tea, rose petals, vanilla, black pepper',
    brew: 'Boil 1 cup water + 1 tsp tea for 2 minutes, add 1/2 cup milk and simmer 2 minutes. Strain.',
    images: [img('p-rose.jpg')],
    variants: [v(100, 110, 99), v(250, 260, 229)],
  },
  {
    slug: 'tulsi-green-chai',
    name: 'Tulsi Green Chai',
    type: 'green-tea', collection: 'wellness', region: 'assam',
    tags: ['wellness', 'trending', 'immunity'],
    short: 'Light green tea with holy basil (tulsi). Refreshing, no milk needed.',
    description: 'Light, refreshing green tea blended with tulsi (holy basil) leaves. A clean, herbal cup to sip through the day - no milk required.',
    ingredients: 'Green tea, tulsi (holy basil)',
    brew: 'Steep 1 tsp in 1 cup of hot water (80 C) for 2-3 minutes. Do not boil. Add honey or lemon if you like.',
    images: [img('p-tulsi.jpg')],
    variants: [v(50, 150, 129), v(100, 270, 239)],
  },
  {
    slug: 'assam-ctc-classic-dust',
    name: 'Assam CTC Dust - Everyday Strong',
    type: 'ctc-tea', collection: 'classic', region: 'assam',
    tags: ['best-selling', 'value'],
    short: 'Strong, quick-brewing Assam CTC dust. Our everyday kitchen and tea-stall favourite.',
    description: 'Fresh Assam CTC dust grade: dark, quick to brew and built for strong milk chai. Perfect for homes, tea stalls, hotels and offices. Bulk packs available - see Wholesale.',
    ingredients: 'Assam CTC tea (dust grade)',
    brew: 'Boil 1 cup water + 3/4 tsp tea, add milk and sugar, simmer 2 minutes.',
    images: [img('badge-orange.jpg'), img('poster.jpg')],
    variants: [v(250, 150, 129), v(500, 280, 245), v(1000, 540, 469)],
  },
  {
    slug: 'way-cup-gift-pack',
    name: 'Way Cup Chai Gift Pack (3 pouches)',
    type: 'gift-box', collection: 'gifting', region: 'assam',
    tags: ['gifting', 'signature'],
    short: 'Three foil pouches tied with a ribbon - ready to gift.',
    description: 'Three of our best-loved chais in resealable foil pouches, tied with a ribbon. A thoughtful gift for family, friends and festive hampers. Corporate and bulk gifting available.',
    ingredients: 'Assorted - see individual packs',
    brew: 'See individual pouch for brewing instructions.',
    images: [img('packs.jpg'), img('bags.jpg')],
    variants: [v(300, 380, 349)],
  },
];

const coupons = [
  { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 300, maxDiscount: 100, active: true, note: '10% off your first order (max Rs.100)' },
  { code: 'CHAI50', type: 'flat', value: 50, minOrder: 600, active: true, note: 'Flat Rs.50 off on orders above Rs.600' },
];

const posts = [
  { slug: 'why-assam-ctc-makes-the-strongest-cup', title: 'Why Assam CTC makes the strongest cup of chai', category: 'all-about-tea', image: '/images/story-garden.jpg', date: '2026-09-15',
    excerpt: 'CTC (crush, tear, curl) leaves brew fast, dark and bold - which is why they are the backbone of Indian chai.',
    body: ['CTC stands for crush, tear, curl. After withering, the leaves are passed through rollers that break them into tiny, uniform granules. More surface area means faster extraction - a deep colour and a bold, malty cup in just a couple of minutes.', 'Assam, in the north-east of India, is the largest tea-growing region in the country. Its warm, humid climate and rich soil give the leaf a naturally strong, malty character that stands up beautifully to milk and spices.', 'That is why Assam CTC is the heart of every Way Cup Chai blend. Whether you take it plain, with elaichi, or with our signature clove-cinnamon-bay leaf masala, it is the strength of the Assam leaf that carries the flavour.'] },
  { slug: 'how-to-make-the-perfect-cup-of-masala-chai', title: 'How to make the perfect cup of masala chai at home', category: 'tea-recipes', image: '/images/chai-pour.jpg', date: '2026-09-22',
    excerpt: 'A simple method for a roadside-style chai: water first, then tea, then milk, then patience.',
    body: ['Start with water: bring one cup of fresh water to a boil. Add one level teaspoon of Way Cup Chai and let it boil for about two minutes so the colour and aroma open up.', 'Add half a cup of milk and your sugar. Bring it back up to a gentle boil, then lower the heat and simmer for two to three minutes. Watch it rise and lower the flame - that is the secret of a rich, creamy cup.', 'Strain into your favourite cup, pour from a height if you are feeling theatrical, and enjoy it hot. Na kam, na ziyada - ekdam perfect.'] },
  { slug: 'from-the-gardens-of-assam-to-your-cup', title: 'From the gardens of Assam to your cup', category: 'from-bush-to-cup', image: '/images/story-dibrugarh.jpg', date: '2026-10-01',
    excerpt: 'Our founder travelled to Dibrugarh to meet the growers behind our tea. Here is what we learned.',
    body: ['Great chai starts at the source. We travel to the tea gardens of Upper Assam around Dibrugarh to select leaf by hand-picked leaf, working directly with growers and producers.', 'Back in Rayachoty, we blend, spice and pack in small batches so every pouch reaches you fresh and fragrant.', 'We believe in keeping the chain short: garden, blend, pack, you. That is how a small-town brand can bring you the real taste of Assam.'] },
];

const events = [
  { id: 'e1', title: 'Chai tasting at your venue', place: 'Rayachoty & nearby', note: 'Book a live chai counter for weddings, offices and festivals.' },
];

function seed() {
  if (!db.exists('products')) db.set('products', products.map((p, i) => ({ id: `p${i + 1}`, active: true, createdAt: new Date().toISOString(), ...p })));
  if (!db.exists('coupons')) db.set('coupons', coupons);
  if (!db.exists('posts')) db.set('posts', posts);
  if (!db.exists('events')) db.set('events', events);
  ['orders', 'enquiries', 'reviews', 'subscribers'].forEach(n => { if (!db.exists(n)) db.set(n, []); });
  if (!db.exists('users')) {
    const email = (process.env.ADMIN_EMAIL || 'admin@waycupchai.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'ChangeThisNow!123';
    db.set('users', [{ id: 'u-admin', name: 'Admin', email, phone: '', role: 'admin', hash: bcrypt.hashSync(password, 10), createdAt: new Date().toISOString() }]);
    console.log(`[seed] admin user created: ${email}`);
  }
}

module.exports = seed;
