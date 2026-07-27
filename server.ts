import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Testimony, ConnectCardSubmission, MeetingRequest } from './src/types';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase: SupabaseClient | null = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
const givingCategories = ['Tithe', 'Offering', 'Thanksgiving', 'Building Fund', 'Missions', 'Other'] as const;

function givingAccountFromBody(body: unknown) {
  const value = body as Record<string, unknown>;
  if (!givingCategories.includes(value.category as typeof givingCategories[number])) throw new Error('Choose a valid giving category');
  const fields = ['bankName', 'accountName', 'accountNumber'] as const;
  if (fields.some(field => typeof value[field] !== 'string' || !value[field].trim())) throw new Error('Bank name, account name, and account number are required');
  return { category: value.category as typeof givingCategories[number], bankName: (value.bankName as string).trim(), accountName: (value.accountName as string).trim(), accountNumber: (value.accountNumber as string).trim() };
}

function databaseUnavailableError() {
  return new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

function logDatabaseError(operation: string, error: unknown) {
  console.error(`Database error while ${operation}:`, error);
}

// Supabase's message is useful to an administrator (for example, it can name
// an invalid column or a required field) but the complete object stays in the
// server log for diagnosis.
function databaseErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

// Verifies the Supabase session token sent by the admin page before allowing
// any admin route to proceed. Locked to one specific admin user ID (set via
// ADMIN_USER_ID) rather than email — the ID stays stable even if the admin
// changes their own email later via the Account tab, so a self-service email
// change never locks anyone out. Even if another Supabase Auth user is ever
// created for any unrelated reason, they still would not get admin access.
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    if (!supabase) throw databaseUnavailableError();
    const adminUserId = process.env.ADMIN_USER_ID;
    if (!adminUserId) {
      console.error('ADMIN_USER_ID is not set — refusing all admin requests until it is configured.');
      return res.status(503).json({ error: 'Admin access is not configured' });
    }
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Not authenticated' });
    if (data.user.id !== adminUserId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    next();
  } catch (error) {
    logDatabaseError('verifying admin session', error);
    res.status(503).json({ error: 'Unable to verify admin session' });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API ROUTES (Always place before Vite middlewares)

  // The site is permanently single-parish, so this returns one church record.
  app.get('/api/church-info', async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('church_info').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Church information is not configured' });
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching church information', error);
      res.status(503).json({ error: 'Unable to load church information' });
    }
  });

  // Get Events
  app.get('/api/events', async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('events').select('*').order('date');
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching events', error);
      res.status(503).json({ error: 'Unable to load events' });
    }
  });

  // Departments are editable data, not frontend configuration.
  app.get('/api/departments', async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching departments', error);
      res.status(503).json({ error: 'Unable to load departments' });
    }
  });

  app.get('/api/giving-accounts', async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('giving_accounts').select('*').order('category');
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching giving accounts', error);
      res.status(503).json({ error: 'Unable to load giving accounts' });
    }
  });

  // Get Testimonies
  app.get('/api/testimonies', async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('testimonies').select('*').eq('isApproved', true).order('date', { ascending: false }).order('id', { ascending: false }).limit(6);
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching testimonies', error);
      res.status(503).json({ error: 'Unable to load testimonies' });
    }
  });

  // Submit Testimony
  app.post('/api/testimonies', async (req, res) => {
    const { authorName, title, content } = req.body;
    if (![authorName, title, content].every((value) => typeof value === 'string' && value.trim())) return res.status(400).json({ error: 'Name, title, and testimony are required' });
    const testimony: Testimony = {
      id: `test-${Date.now()}`,
      authorName: authorName.trim(),
      title: title.trim(),
      content: content.trim(),
      likes: 0,
      isApproved: false, // Needs admin approval to prevent spam (church moderation)
      date: new Date().toISOString().split('T')[0],
    };
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('testimonies').insert(testimony).select('*').single();
      if (error) throw error;
      res.status(201).json({
        success: true,
        message: 'Testimony submitted successfully. It will display once approved by our pastorate team!',
        testimony: data
      });
    } catch (error) {
      logDatabaseError('submitting testimony', error);
      res.status(503).json({ error: 'Unable to submit testimony' });
    }
  });

  // Like Testimony
  app.post('/api/testimonies/:id/like', async (req, res) => {
    const { id } = req.params;
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.rpc('increment_testimony_likes', { testimony_id: id });
      if (error) throw error;
      if (data === null) return res.status(404).json({ error: 'Testimony not found' });
      res.json({ success: true, likes: data });
    } catch (error) {
      logDatabaseError('liking testimony', error);
      res.status(503).json({ error: 'Unable to like testimony' });
    }
  });

  // Submit Connect Card (New Visitor card)
  app.post('/api/connect-cards', async (req, res) => {
    const { fullName, email, phone, isFirstTime, prayerRequest, interestInGroups } = req.body;
    if (![fullName, email, phone].every((value) => typeof value === 'string' && value.trim())) return res.status(400).json({ error: 'Name, email, and phone are required' });
    const submission: ConnectCardSubmission = {
      id: `submission-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      isFirstTime: isFirstTime === true,
      prayerRequest: typeof prayerRequest === 'string' ? prayerRequest.trim() : '',
      interestInGroups: Array.isArray(interestInGroups) ? interestInGroups.filter((group): group is string => typeof group === 'string') : [],
      submittedAt: new Date().toISOString(),
    };
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('connect_cards').insert(submission).select('*').single();
      if (error) throw error;
      res.status(201).json({
        success: true,
        message: 'Thank you for connecting with us! A pastor or group leader will contact you shortly.',
        submission: data
      });
    } catch (error) {
      logDatabaseError('submitting connect card', error);
      res.status(503).json({ error: 'Unable to submit connect card' });
    }
  });

  app.post('/api/meeting-requests', async (req, res) => {
    const { fullName, contact, preferredDateTime, reason } = req.body;
    if (![fullName, contact, preferredDateTime, reason].every((value) => typeof value === 'string' && value.trim())) return res.status(400).json({ error: 'Name, contact, preferred time, and reason are required' });
    const meetingRequest: MeetingRequest = { id: `meeting-${Date.now()}`, fullName: fullName.trim(), contact: contact.trim(), preferredDateTime: preferredDateTime.trim(), reason: reason.trim(), submittedAt: new Date().toISOString() };
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('meeting_requests').insert(meetingRequest).select('*').single();
      if (error) throw error;
      res.status(201).json({ success: true, meetingRequest: data });
    } catch (error) {
      logDatabaseError('submitting meeting request', error);
      res.status(503).json({ error: 'Unable to submit meeting request' });
    }
  });


  // ============ ADMIN ROUTES — all gated behind requireAdmin ============

  app.get('/api/admin/church-info', requireAdmin, async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('church_info').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Church information is not configured' });
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching church information for admin', error);
      res.status(503).json({ error: 'Unable to load church information' });
    }
  });

  app.patch('/api/admin/church-info', requireAdmin, async (req, res) => {
    const { id, name, tagline, pastorName, pastorTitle, address, city, state, phone, email, facebook_url, liveStreamEmbedId, liveStreamUrl, serviceTimes, accentColor, logoText, isLiveNow } = req.body;
    const updates = { name, tagline, pastorName, pastorTitle, address, city, state, phone, email, facebook_url, liveStreamEmbedId, liveStreamUrl: typeof liveStreamUrl === 'string' && liveStreamUrl.trim() ? liveStreamUrl.trim() : null, serviceTimes, accentColor, logoText, isLiveNow };
    const requiredStrings = [name, tagline, pastorName, pastorTitle, address, city, state, phone, email, facebook_url, liveStreamEmbedId, accentColor, logoText];
    if (typeof id !== 'string' || !id || requiredStrings.some(value => typeof value !== 'string') || (liveStreamUrl !== null && liveStreamUrl !== undefined && typeof liveStreamUrl !== 'string') || !Array.isArray(serviceTimes) || typeof isLiveNow !== 'boolean') return res.status(400).json({ error: 'Church details include an invalid or missing required field' });
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('church_info').update(updates).eq('id', id).select('*').single();
      if (error) throw error;
      // ChurchPanel consumes a ChurchInfo object for both GET and PATCH, so
      // keep the response shape identical after a successful save.
      res.json(data);
    } catch (error) {
      console.error('Full Supabase error while updating church information:', error);
      logDatabaseError('updating church info', error);
      res.status(503).json({ error: `Unable to update church information: ${databaseErrorMessage(error, 'database request failed')}` });
    }
  });

  app.get('/api/admin/events', requireAdmin, async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('events').select('*').order('date');
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching events for admin', error);
      res.status(503).json({ error: 'Unable to load events' });
    }
  });

  app.post('/api/admin/events', requireAdmin, async (req, res) => {
    const { endDate, ...eventDetails } = req.body;
    if (endDate !== undefined && endDate !== null && (typeof endDate !== 'string' || !endDate)) return res.status(400).json({ error: 'End date must be a valid date or left blank' });
    if (endDate && typeof eventDetails.date === 'string' && endDate < eventDetails.date) return res.status(400).json({ error: 'End date cannot be before the start date' });
    const event = { id: `event-${Date.now()}`, ...eventDetails, endDate: endDate || null };
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('events').insert(event).select('*').single();
      if (error) throw error;
      res.status(201).json({ success: true, event: data });
    } catch (error) {
      logDatabaseError('creating event', error);
      res.status(503).json({ error: 'Unable to create event' });
    }
  });

  app.put('/api/admin/events/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { endDate, ...eventDetails } = req.body;
    if (endDate !== undefined && endDate !== null && (typeof endDate !== 'string' || !endDate)) return res.status(400).json({ error: 'End date must be a valid date or left blank' });
    if (endDate && typeof eventDetails.date === 'string' && endDate < eventDetails.date) return res.status(400).json({ error: 'End date cannot be before the start date' });
    try {
      if (!supabase) throw databaseUnavailableError();
      const updates = { ...eventDetails, ...(endDate !== undefined ? { endDate: endDate || null } : {}) };
      const { data, error } = await supabase.from('events').update(updates).eq('id', id).select('*').single();
      if (error) throw error;
      res.json({ success: true, event: data });
    } catch (error) {
      logDatabaseError('updating event', error);
      res.status(503).json({ error: 'Unable to update event' });
    }
  });

  app.delete('/api/admin/events/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (!supabase) throw databaseUnavailableError();
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      logDatabaseError('deleting event', error);
      res.status(503).json({ error: 'Unable to delete event' });
    }
  });

  app.get('/api/admin/departments', requireAdmin, async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching departments for admin', error);
      res.status(503).json({ error: 'Unable to load departments' });
    }
  });

  app.post('/api/admin/departments', requireAdmin, async (req, res) => {
    const department = { id: `dept-${Date.now()}`, ...req.body };
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('departments').insert(department).select('*').single();
      if (error) throw error;
      res.status(201).json({ success: true, department: data });
    } catch (error) {
      logDatabaseError('creating department', error);
      res.status(503).json({ error: 'Unable to create department' });
    }
  });

  app.put('/api/admin/departments/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('departments').update(req.body).eq('id', id).select('*').single();
      if (error) throw error;
      res.json({ success: true, department: data });
    } catch (error) {
      logDatabaseError('updating department', error);
      res.status(503).json({ error: 'Unable to update department' });
    }
  });

  app.delete('/api/admin/departments/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (!supabase) throw databaseUnavailableError();
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      logDatabaseError('deleting department', error);
      res.status(503).json({ error: 'Unable to delete department' });
    }
  });

  app.get('/api/admin/giving-accounts', requireAdmin, async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('giving_accounts').select('*').order('category');
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching giving accounts for admin', error);
      res.status(503).json({ error: 'Unable to load giving accounts' });
    }
  });

  app.post('/api/admin/giving-accounts', requireAdmin, async (req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const account = { id: `giving-${Date.now()}`, ...givingAccountFromBody(req.body) };
      const { data, error } = await supabase.from('giving_accounts').insert(account).select('*').single();
      if (error) throw error;
      res.status(201).json({ success: true, account: data });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unable to create giving account';
      res.status(reason.startsWith('Choose') || reason.includes('required') ? 400 : 503).json({ error: reason });
    }
  });

  app.put('/api/admin/giving-accounts/:id', requireAdmin, async (req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('giving_accounts').update(givingAccountFromBody(req.body)).eq('id', req.params.id).select('*').single();
      if (error) throw error;
      res.json({ success: true, account: data });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unable to update giving account';
      res.status(reason.startsWith('Choose') || reason.includes('required') ? 400 : 503).json({ error: reason });
    }
  });

  app.delete('/api/admin/giving-accounts/:id', requireAdmin, async (req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { error } = await supabase.from('giving_accounts').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      logDatabaseError('deleting giving account', error);
      res.status(503).json({ error: 'Unable to delete giving account' });
    }
  });

  // All testimonies, not just approved ones — admin needs to see the moderation queue.
  app.get('/api/admin/testimonies', requireAdmin, async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('testimonies').select('*').order('date', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching testimonies for admin', error);
      res.status(503).json({ error: 'Unable to load testimonies' });
    }
  });

  app.patch('/api/admin/testimonies/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { isApproved } = req.body;
    if (typeof isApproved !== 'boolean') return res.status(400).json({ error: 'isApproved must be a boolean' });
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('testimonies').update({ isApproved }).eq('id', id).select('*').single();
      if (error) throw error;
      let unapprovedTestimonyIds: string[] = [];
      if (isApproved) {
        const { data: approved, error: approvedError } = await supabase.from('testimonies').select('id').eq('isApproved', true).order('date', { ascending: true }).order('id', { ascending: true });
        if (approvedError) throw approvedError;
        const overflow = Math.max(0, (approved?.length ?? 0) - 6);
        if (overflow) {
          const oldestIds = (approved ?? []).slice(0, overflow).map(testimony => testimony.id);
          const { error: unapproveError } = await supabase.from('testimonies').update({ isApproved: false }).in('id', oldestIds);
          if (unapproveError) throw unapproveError;
          unapprovedTestimonyIds = oldestIds;
        }
      }
      res.json({ success: true, testimony: data, unapprovedTestimonyIds });
    } catch (error) {
      logDatabaseError('updating testimony approval', error);
      res.status(503).json({ error: 'Unable to update testimony' });
    }
  });

  app.delete('/api/admin/testimonies/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      if (!supabase) throw databaseUnavailableError();
      const { error } = await supabase.from('testimonies').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      logDatabaseError('deleting testimony', error);
      res.status(503).json({ error: 'Unable to delete testimony' });
    }
  });

  app.get('/api/admin/meeting-requests', requireAdmin, async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('meeting_requests').select('*').order('submittedAt', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching meeting requests', error);
      res.status(503).json({ error: 'Unable to load meeting requests' });
    }
  });

  app.delete('/api/admin/meeting-requests/:id', requireAdmin, async (req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { error } = await supabase.from('meeting_requests').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      logDatabaseError('deleting meeting request', error);
      res.status(503).json({ error: 'Unable to delete meeting request' });
    }
  });

  app.get('/api/admin/connect-cards', requireAdmin, async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('connect_cards').select('*').order('submittedAt', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      logDatabaseError('fetching connect cards', error);
      res.status(503).json({ error: 'Unable to load connect cards' });
    }
  });

  app.delete('/api/admin/connect-cards/:id', requireAdmin, async (req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { error } = await supabase.from('connect_cards').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      logDatabaseError('deleting connect card', error);
      res.status(503).json({ error: 'Unable to delete connect card' });
    }
  });

  // VITE DEV MIDDLEWARE or PRODUCTION STATIC ROUTING
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
