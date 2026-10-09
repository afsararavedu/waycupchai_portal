const base = '/api';

export const token = {
  get: () => { try { return localStorage.getItem('wcc_token'); } catch { return null; } },
  set: (t) => { try { t ? localStorage.setItem('wcc_token', t) : localStorage.removeItem('wcc_token'); } catch { /* ignore */ } },
};

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token.get();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) { const e = new Error((data && data.error) || 'Something went wrong'); e.status = res.status; throw e; }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
};

export const rupee = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const off = (mrp, price) => (mrp > price ? Math.round((1 - price / mrp) * 100) : 0);
