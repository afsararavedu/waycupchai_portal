// Tiny JSON-file database (no native modules -> works on any Hostinger Node plan).
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
fs.mkdirSync(DATA_DIR, { recursive: true });

const COLLECTIONS = ['products', 'users', 'orders', 'coupons', 'enquiries', 'reviews', 'posts', 'subscribers', 'events'];
const cache = {};
const timers = {};

function file(name) { return path.join(DATA_DIR, `${name}.json`); }

function load(name) {
  if (cache[name]) return cache[name];
  try { cache[name] = JSON.parse(fs.readFileSync(file(name), 'utf8')); }
  catch { cache[name] = null; }
  return cache[name];
}

function flush(name) {
  const tmp = file(name) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache[name], null, 2));
  fs.renameSync(tmp, file(name));
}

function save(name) {
  clearTimeout(timers[name]);
  timers[name] = setTimeout(() => flush(name), 150);
}

const db = {
  exists(name) { return load(name) !== null; },
  all(name) { return load(name) || []; },
  set(name, rows) { cache[name] = rows; flush(name); },
  find(name, fn) { return db.all(name).find(fn); },
  filter(name, fn) { return db.all(name).filter(fn); },
  insert(name, row) { const rows = db.all(name); rows.push(row); cache[name] = rows; save(name); return row; },
  update(name, fn, patch) {
    const rows = db.all(name); let hit = null;
    rows.forEach((r, i) => { if (fn(r)) { rows[i] = { ...r, ...patch }; hit = rows[i]; } });
    cache[name] = rows; save(name); return hit;
  },
  remove(name, fn) { const rows = db.all(name).filter(r => !fn(r)); cache[name] = rows; save(name); },
  nextOrderNo() {
    const meta = load('meta') || { orderSeq: 1000 };
    meta.orderSeq += 1; cache.meta = meta; flush('meta');
    return `WCC${meta.orderSeq}`;
  },
  flushAll() { Object.keys(cache).forEach(n => { try { flush(n); } catch (e) { /* ignore */ } }); },
  COLLECTIONS,
};

process.on('SIGTERM', () => { db.flushAll(); process.exit(0); });
process.on('SIGINT', () => { db.flushAll(); process.exit(0); });

module.exports = db;
