import { createRemoteJWKSet, jwtVerify } from 'jose';

type JsonRecord = Record<string, unknown>;

const json = (value: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
});

const error = (message: string, status = 400) => json({ error: message }, status);

function secureHeaders(headers: Headers) {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('X-Frame-Options', 'DENY');
  return headers;
}

async function bodyJson(request: Request): Promise<JsonRecord | null> {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 20_000) return null;
  try {
    const value: unknown = await request.json();
    return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
  } catch {
    return null;
  }
}

function nonEmpty(value: unknown, max = 2_000): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

async function adminIdentity(request: Request, env: Env): Promise<{ email: string; id: string } | null> {
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  const team = env.ACCESS_TEAM_DOMAIN?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!assertion || !team || !env.ACCESS_AUD) return null;

  try {
    const issuer = `https://${team}`.endsWith('.cloudflareaccess.com')
      ? `https://${team}`
      : `https://${team}.cloudflareaccess.com`;
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(assertion, jwks, { issuer, audience: env.ACCESS_AUD });
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    const id = typeof payload.sub === 'string' ? payload.sub : '';
    const allowlist = (env.ADMIN_EMAILS || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
    return email && id && allowlist.includes(email) ? { email, id } : null;
  } catch {
    return null;
  }
}

async function rows<T>(env: Env, sql: string, ...values: unknown[]): Promise<T[]> {
  const result = await env.DB.prepare(sql).bind(...values).all<T>();
  return result.results;
}

async function one<T>(env: Env, sql: string, ...values: unknown[]): Promise<T | null> {
  return env.DB.prepare(sql).bind(...values).first<T>();
}

function normalizeChurch(row: JsonRecord | null) {
  if (!row) return null;
  let serviceTimes: unknown = [];
  try { serviceTimes = JSON.parse(String(row.serviceTimes)); } catch { serviceTimes = []; }
  return { ...row, serviceTimes, isLiveNow: Boolean(row.isLiveNow) };
}

const eventFields = ['title', 'description', 'date', 'endDate', 'time', 'location', 'category', 'bannerUrl'] as const;
const departmentFields = ['name', 'description', 'howToJoin'] as const;
const churchFields = ['name', 'tagline', 'pastorName', 'pastorTitle', 'address', 'city', 'state', 'phone', 'email', 'facebook_url', 'liveStreamEmbedId', 'liveStreamUrl', 'serviceTimes', 'accentColor', 'logoText', 'isLiveNow'] as const;
const givingCategories = ['Tithe', 'Offering', 'Thanksgiving', 'Building Fund', 'Missions', 'Other'];

function eventFrom(body: JsonRecord): JsonRecord | null {
  const endDate = body.endDate === '' || body.endDate === undefined ? null : body.endDate;
  if (!eventFields.every((field) => field === 'endDate' || field === 'bannerUrl' || nonEmpty(body[field]))) return null;
  if (body.bannerUrl !== undefined && typeof body.bannerUrl !== 'string') return null;
  if (endDate !== null && typeof endDate !== 'string') return null;
  if (typeof endDate === 'string' && endDate && typeof body.date === 'string' && endDate < body.date) return null;
  if (!['Special', 'Weekly', 'Youth', 'Women', 'Men', 'Prayer'].includes(String(body.category))) return null;
  return { ...body, endDate, bannerUrl: typeof body.bannerUrl === 'string' ? body.bannerUrl : '' };
}

async function adminApi(request: Request, env: Env, path: string): Promise<Response> {
  const identity = await adminIdentity(request, env);
  if (!identity) return error('Admin access required', 401);
  const method = request.method;

  if (path === '/api/admin/session' && method === 'GET') return json({ user: identity });

  if (path === '/api/admin/church-info') {
    if (method === 'GET') return json(normalizeChurch(await one<JsonRecord>(env, 'SELECT * FROM church_info LIMIT 1')));
    if (method === 'PATCH') {
      const body = await bodyJson(request);
      if (!body) return error('Church details must be valid JSON');
      const id = typeof body.id === 'string' ? body.id : 'parish-1';
      const entries = churchFields.filter((key) => key in body).map((key) => [key, body[key]] as const);
      if (!entries.length) return error('No church detail changes were provided');
      if (entries.some(([key, value]) => key === 'serviceTimes' ? !Array.isArray(value) : key === 'isLiveNow' ? typeof value !== 'boolean' : typeof value !== 'string')) return error('Church details include an invalid field');
      const assignments = entries.map(([key]) => `"${key}" = ?`).join(', ');
      const values = entries.map(([key, value]) => key === 'serviceTimes' ? JSON.stringify(value) : key === 'isLiveNow' ? Number(value) : key === 'liveStreamUrl' ? (String(value).trim() || null) : value);
      await env.DB.prepare(`UPDATE church_info SET ${assignments} WHERE id = ?`).bind(...values, id).run();
      return json(normalizeChurch(await one<JsonRecord>(env, 'SELECT * FROM church_info WHERE id = ?', id)));
    }
  }

  if (path === '/api/admin/events') {
    if (method === 'GET') return json(await rows(env, 'SELECT * FROM events ORDER BY date'));
    if (method === 'POST') {
      const body = await bodyJson(request); const event = body && eventFrom(body);
      if (!event) return error('Event details are incomplete or invalid');
      const id = `event-${crypto.randomUUID()}`;
      await env.DB.prepare('INSERT INTO events (id,title,description,date,endDate,time,location,category,bannerUrl) VALUES (?,?,?,?,?,?,?,?,?)')
        .bind(id,event.title,event.description,event.date,event.endDate,event.time,event.location,event.category,event.bannerUrl).run();
      return json({ success: true, event: { id, ...event } }, 201);
    }
  }

  const eventMatch = path.match(/^\/api\/admin\/events\/([^/]+)$/);
  if (eventMatch && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(decodeURIComponent(eventMatch[1])).run();
    return json({ success: true });
  }
  if (eventMatch && method === 'PUT') {
    const body = await bodyJson(request); const event = body && eventFrom(body);
    if (!event) return error('Event details are incomplete or invalid');
    const id = decodeURIComponent(eventMatch[1]);
    await env.DB.prepare('UPDATE events SET title=?,description=?,date=?,endDate=?,time=?,location=?,category=?,bannerUrl=? WHERE id=?')
      .bind(event.title,event.description,event.date,event.endDate,event.time,event.location,event.category,event.bannerUrl,id).run();
    return json({ success: true, event: { id, ...event } });
  }

  if (path === '/api/admin/departments') {
    if (method === 'GET') return json(await rows(env, 'SELECT * FROM departments ORDER BY name'));
    if (method === 'POST') {
      const body = await bodyJson(request);
      if (!body || !departmentFields.every((key) => nonEmpty(body[key]))) return error('Department details are incomplete');
      const department = { id: `dept-${crypto.randomUUID()}`, name: body.name, description: body.description, howToJoin: body.howToJoin };
      await env.DB.prepare('INSERT INTO departments (id,name,description,howToJoin) VALUES (?,?,?,?)').bind(department.id,department.name,department.description,department.howToJoin).run();
      return json({ success: true, department }, 201);
    }
  }
  const departmentMatch = path.match(/^\/api\/admin\/departments\/([^/]+)$/);
  if (departmentMatch && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM departments WHERE id = ?').bind(decodeURIComponent(departmentMatch[1])).run();
    return json({ success: true });
  }
  if (departmentMatch && method === 'PUT') {
    const body = await bodyJson(request);
    if (!body || !departmentFields.every((key) => nonEmpty(body[key]))) return error('Department details are incomplete');
    const id = decodeURIComponent(departmentMatch[1]);
    await env.DB.prepare('UPDATE departments SET name=?,description=?,howToJoin=? WHERE id=?').bind(body.name,body.description,body.howToJoin,id).run();
    return json({ success: true, department: { id, name: body.name, description: body.description, howToJoin: body.howToJoin } });
  }

  if (path === '/api/admin/giving-accounts') {
    if (method === 'GET') return json(await rows(env, 'SELECT * FROM giving_accounts ORDER BY category'));
    if (method === 'POST') {
      const body = await bodyJson(request);
      if (!body || !givingCategories.includes(String(body.category)) || !['bankName','accountName','accountNumber'].every((key) => nonEmpty(body[key], 160))) return error('Choose a valid category and provide bank, account name, and account number');
      const account = { id: `giving-${crypto.randomUUID()}`, category: body.category, bankName: body.bankName, accountName: body.accountName, accountNumber: body.accountNumber };
      await env.DB.prepare('INSERT INTO giving_accounts (id,category,bankName,accountName,accountNumber) VALUES (?,?,?,?,?)').bind(account.id,account.category,account.bankName,account.accountName,account.accountNumber).run();
      return json({ success: true, account }, 201);
    }
  }
  const givingMatch = path.match(/^\/api\/admin\/giving-accounts\/([^/]+)$/);
  if (givingMatch && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM giving_accounts WHERE id = ?').bind(decodeURIComponent(givingMatch[1])).run();
    return json({ success: true });
  }
  if (givingMatch && method === 'PUT') {
    const body = await bodyJson(request);
    if (!body || !givingCategories.includes(String(body.category)) || !['bankName','accountName','accountNumber'].every((key) => nonEmpty(body[key], 160))) return error('Choose a valid category and provide bank, account name, and account number');
    const id = decodeURIComponent(givingMatch[1]);
    await env.DB.prepare('UPDATE giving_accounts SET category=?,bankName=?,accountName=?,accountNumber=? WHERE id=?').bind(body.category,body.bankName,body.accountName,body.accountNumber,id).run();
    return json({ success: true, account: { id, category: body.category, bankName: body.bankName, accountName: body.accountName, accountNumber: body.accountNumber } });
  }

  if (path === '/api/admin/testimonies' && method === 'GET') return json(await rows(env, 'SELECT * FROM testimonies ORDER BY date DESC'));
  const testimonyMatch = path.match(/^\/api\/admin\/testimonies\/([^/]+)$/);
  if (testimonyMatch && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM testimonies WHERE id = ?').bind(decodeURIComponent(testimonyMatch[1])).run();
    return json({ success: true });
  }
  if (testimonyMatch && method === 'PATCH') {
    const body = await bodyJson(request);
    if (!body || typeof body.isApproved !== 'boolean') return error('isApproved must be a boolean');
    const id = decodeURIComponent(testimonyMatch[1]);
    await env.DB.prepare('UPDATE testimonies SET isApproved=? WHERE id=?').bind(Number(body.isApproved),id).run();
    if (body.isApproved) {
      await env.DB.prepare('UPDATE testimonies SET isApproved=0 WHERE id IN (SELECT id FROM testimonies WHERE isApproved=1 ORDER BY date DESC, id DESC LIMIT -1 OFFSET 6)').run();
    }
    const testimony = await one(env, 'SELECT * FROM testimonies WHERE id=?', id);
    return json({ success: true, testimony });
  }

  if (path === '/api/admin/meeting-requests' && method === 'GET') return json(await rows(env, 'SELECT * FROM meeting_requests ORDER BY submittedAt DESC'));
  const meetingMatch = path.match(/^\/api\/admin\/meeting-requests\/([^/]+)$/);
  if (meetingMatch && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM meeting_requests WHERE id=?').bind(decodeURIComponent(meetingMatch[1])).run();
    return json({ success: true });
  }
  if (path === '/api/admin/connect-cards' && method === 'GET') {
    const cards = await rows<JsonRecord>(env, 'SELECT * FROM connect_cards ORDER BY submittedAt DESC');
    return json(cards.map((card) => ({ ...card, isFirstTime: Boolean(card.isFirstTime), interestInGroups: JSON.parse(String(card.interestInGroups || '[]')) })));
  }
  const connectMatch = path.match(/^\/api\/admin\/connect-cards\/([^/]+)$/);
  if (connectMatch && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM connect_cards WHERE id=?').bind(decodeURIComponent(connectMatch[1])).run();
    return json({ success: true });
  }

  return error('Not found', 404);
}

async function api(request: Request, env: Env, path: string): Promise<Response> {
  if (path.startsWith('/api/admin/')) return adminApi(request, env, path);
  if (request.method === 'GET') {
    if (path === '/api/church-info') return json(normalizeChurch(await one<JsonRecord>(env, 'SELECT * FROM church_info LIMIT 1')));
    if (path === '/api/events') return json(await rows(env, 'SELECT * FROM events ORDER BY date'));
    if (path === '/api/departments') return json(await rows(env, 'SELECT * FROM departments ORDER BY name'));
    if (path === '/api/giving-accounts') return json(await rows(env, 'SELECT * FROM giving_accounts ORDER BY category'));
    if (path === '/api/testimonies') return json(await rows(env, 'SELECT * FROM testimonies WHERE isApproved=1 ORDER BY date DESC, id DESC LIMIT 6'));
  }

  if (path === '/api/connect-cards' && request.method === 'POST') {
    const body = await bodyJson(request);
    if (!body || !['fullName','email','phone'].every((key) => nonEmpty(body[key], 180))) return error('Name, email, and phone are required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) return error('Enter a valid email address');
    if (body.isFirstTime !== undefined && typeof body.isFirstTime !== 'boolean') return error('isFirstTime must be a boolean');
    const submittedAt = new Date().toISOString();
    const id = `submission-${crypto.randomUUID()}`;
    const prayerRequest = typeof body.prayerRequest === 'string' ? body.prayerRequest.slice(0, 3000) : '';
    const interestInGroups = Array.isArray(body.interestInGroups) ? body.interestInGroups.filter((item): item is string => typeof item === 'string').slice(0, 20) : [];
    await env.DB.prepare('INSERT INTO connect_cards (id,fullName,email,phone,isFirstTime,prayerRequest,interestInGroups,submittedAt) VALUES (?,?,?,?,?,?,?,?)')
      .bind(id,String(body.fullName).trim(),String(body.email).trim(),String(body.phone).trim(),Number(body.isFirstTime !== false),prayerRequest,JSON.stringify(interestInGroups),submittedAt).run();
    return json({ success: true, message: 'Connect card received', submissionId: id }, 201);
  }

  if (path === '/api/meeting-requests' && request.method === 'POST') {
    const body = await bodyJson(request);
    if (!body || !['fullName','contact','preferredDateTime','reason'].every((key) => nonEmpty(body[key], 3_000))) return error('All meeting request details are required');
    const submittedAt = new Date().toISOString();
    const id = `meeting-${crypto.randomUUID()}`;
    await env.DB.prepare('INSERT INTO meeting_requests (id,fullName,contact,preferredDateTime,reason,submittedAt) VALUES (?,?,?,?,?,?)')
      .bind(id,String(body.fullName).trim(),String(body.contact).trim(),String(body.preferredDateTime).trim(),String(body.reason).trim(),submittedAt).run();
    return json({ success: true, meetingRequest: { id, ...body, submittedAt } }, 201);
  }

  if (path === '/api/testimonies' && request.method === 'POST') {
    const body = await bodyJson(request);
    if (!body || !['authorName','title','content'].every((key) => nonEmpty(body[key], key === 'content' ? 6_000 : 180))) return error('Name, title, and testimony are required');
    const id = `test-${crypto.randomUUID()}`;
    const date = new Date().toISOString().slice(0, 10);
    await env.DB.prepare('INSERT INTO testimonies (id,authorName,title,content,date,likes,isApproved) VALUES (?,?,?,?,?,0,0)')
      .bind(id,String(body.authorName).trim(),String(body.title).trim(),String(body.content).trim(),date).run();
    return json({ success: true, message: 'Testimony received for review', testimony: { id, authorName: body.authorName, title: body.title, content: body.content, date, likes: 0, isApproved: false } }, 201);
  }

  const likeMatch = path.match(/^\/api\/testimonies\/([^/]+)\/like$/);
  if (likeMatch && request.method === 'POST') {
    const id = decodeURIComponent(likeMatch[1]);
    const result = await env.DB.prepare('UPDATE testimonies SET likes=likes+1 WHERE id=? AND isApproved=1 RETURNING likes').bind(id).first<{ likes: number }>();
    return result ? json({ success: true, likes: result.likes }) : error('Testimony not found', 404);
  }

  return error('Not found', 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    try {
      if (path.startsWith('/api/')) return await api(request, env, path);

      if (path.startsWith('/admin')) {
        const identity = await adminIdentity(request, env);
        if (!identity) return error('Admin access required', 401);
      }

      const siteUrl = (env.PUBLIC_SITE_URL || url.origin).trim().replace(/\/$/, '');
      if (path === '/robots.txt' && request.method === 'GET') {
        return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
      if (path === '/sitemap.xml' && request.method === 'GET') {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc><changefreq>weekly</changefreq></url></urlset>`;
        return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
      }

      const response = await env.ASSETS.fetch(request);
      const headers = secureHeaders(new Headers(response.headers));
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (cause) {
      console.error(JSON.stringify({ event: 'request_failed', path, message: cause instanceof Error ? cause.message : 'unknown error' }));
      return error('The request could not be completed. Please try again.', 500);
    }
  },
};
