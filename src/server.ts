import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Testimony, ConnectCardSubmission, MeetingRequest } from './types';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase: SupabaseClient | null = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

function databaseUnavailableError() {
  return new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

function logDatabaseError(operation: string, error: unknown) {
  console.error(`Database error while ${operation}:`, error);
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

  // Get Testimonies
  app.get('/api/testimonies', async (_req, res) => {
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('testimonies').select('*').eq('isApproved', true).order('likes', { ascending: false });
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

  app.patch('/api/admin/church-info', requireAdmin, async (req, res) => {
    const { id, ...updates } = req.body;
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('church_info').update(updates).eq('id', id).select('*').single();
      if (error) throw error;
      res.json({ success: true, church: data });
    } catch (error) {
      logDatabaseError('updating church info', error);
      res.status(503).json({ error: 'Unable to update church information' });
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
    const event = { id: `event-${Date.now()}`, ...req.body };
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
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('events').update(req.body).eq('id', id).select('*').single();
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
    try {
      if (!supabase) throw databaseUnavailableError();
      const { data, error } = await supabase.from('testimonies').update({ isApproved }).eq('id', id).select('*').single();
      if (error) throw error;
      res.json({ success: true, testimony: data });
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
