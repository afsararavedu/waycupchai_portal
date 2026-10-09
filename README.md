# Way Cup Chai - waycupchai.com

Online chai store: **React (Vite) frontend + Node/Express backend** in one deployable app.
Modelled on Teafloor's feature set, branded for Way Cup Chai.

## Features
- Header with mega-menu, live search, cart drawer with free-shipping progress bar, wishlist, account, offers
- Hero slider, category tiles, trending / best-seller sections, brand story, SEO text
- Shop with filters (type, collection, price), sorting; Trending / Signature / Best-selling / Offers pages
- Product page: pack-size variants, discounts, pincode check, reviews (moderated), related items, WhatsApp order link
- Cart, coupons (WELCOME10, CHAI50), server-side pricing, checkout with **Cash on Delivery** and **Razorpay** (UPI/cards)
- Customer accounts (register/login, order history, saved address), guest checkout, **Track order**
- "What tea is best for me?" quiz, blog, FAQ, About, Sourcing/Our story, About tea
- Wholesale / Gifting / Events / Contact enquiry forms (saved + optional email alerts)
- Admin panel at `/admin`: dashboard, orders (status + tracking), products & prices & stock, enquiries, coupons, reviews, blog
- SEO: per-page title/description/Open Graph, sitemap.xml, robots.txt; WhatsApp floating button

## Deploy on Hostinger (Node.js Web App / Business or Cloud plan)

1. **hPanel -> Websites -> Add website -> Node.js Apps**. Choose *Upload your website files* and upload `waycupchai.zip`
   (or connect GitHub).
2. Settings:
   - Node version: **20 or 22**
   - Entry file: `server/index.js`
   - Build/Install: Hostinger runs `npm install` automatically. The React app is **already built** in `client/dist`,
     so no build step is needed. (To rebuild after editing `client/src`: run `npm run build` locally, then re-upload.)
   - Start command: `npm start`
3. **Environment variables** (hPanel -> Node.js app -> Environment variables). Copy from `.env.example`. Minimum:
   - `NODE_ENV=production`
   - `JWT_SECRET` = long random string
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` = your admin login (change before first run!)
   - `SITE_URL=https://waycupchai.com`
   - `DATA_DIR` = a folder **outside** the deployed app, e.g. `/home/uXXXXXXX/waycupchai-data`
     (so orders/customers survive redeploys)
4. **Domain + SSL**: attach `waycupchai.com` to the app and enable the free SSL certificate.
5. Open `https://waycupchai.com/account`, log in with the admin email/password -> **Open admin panel**.
6. In admin: set real **prices, stock and descriptions** (seed prices are placeholders), approve reviews, check coupons.

### Turn on online payments (Razorpay)
Create a Razorpay account, then set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. The "UPI / Cards" option
activates automatically. Test in Razorpay test mode first.

### Email alerts (optional)
Create a mailbox in Hostinger Email and set `SMTP_HOST` (smtp.hostinger.com), `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO`.
You'll get order and enquiry emails; customers get order confirmations and status updates.

## Local development
```bash
npm install
npm --prefix client install
cp .env.example .env          # edit values
npm run dev:server            # API on :3000
npm run dev:client            # site on :5173 (proxies /api)
# production build + run:
npm run build && npm start
```

## Project layout
```
server/            Express API, JSON-file database (no native modules), seed data
  routes/public.js   catalogue, auth, orders, payments, enquiries, blog
  routes/admin.js    admin-only endpoints
client/src/        React app (pages/, components/, admin/, styles.css)
client/public/images   your brand images (optimised)
client/dist        production build served by Express
```

## Things to review before launch
- **Prices / pack sizes / stock** in admin are placeholders.
- **Legal pages** (Returns, Privacy, Terms) are sensible drafts - have them reviewed. Add your full **FSSAI licence number** to the footer/product text if you want it shown.
- **Social links, Instagram/YouTube**: add your URLs in `client/src/components/Layout.jsx` (Footer).
- Back up `DATA_DIR` regularly (it holds orders, customers, enquiries).
