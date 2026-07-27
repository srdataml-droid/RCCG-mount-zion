import { FormEvent, useEffect, useState } from 'react';
import { supabaseAuth } from './supabaseClient';
import { ChurchInfo, ChurchEvent, Department, Testimony, MeetingRequest } from '../types';

type Tab = 'church' | 'events' | 'departments' | 'testimonies' | 'meetings' | 'account';

async function adminFetch(url: string, options: RequestInit = {}) {
  const session = (await supabaseAuth?.auth.getSession())?.data.session;
  const token = session?.access_token;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>('church');

  return (
    <main className="min-h-screen bg-stone-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <h1 className="font-serif text-xl">Mount Zion Admin</h1>
        <button onClick={onSignOut} className="text-sm text-stone-400 hover:text-white">Sign out</button>
      </header>
      <nav className="flex flex-wrap gap-2 border-b border-white/10 px-6 py-3">
        {(['church', 'events', 'departments', 'testimonies', 'meetings', 'account'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm capitalize ${tab === t ? 'bg-[#d4af37] text-stone-950 font-bold' : 'bg-white/5 text-stone-300 hover:bg-white/10'}`}
          >
            {t}
          </button>
        ))}
      </nav>
      <div className="mx-auto max-w-4xl px-6 py-8">
        {tab === 'church' && <ChurchInfoTab />}
        {tab === 'events' && <EventsTab />}
        {tab === 'departments' && <DepartmentsTab />}
        {tab === 'testimonies' && <TestimoniesTab />}
        {tab === 'meetings' && <MeetingsTab />}
        {tab === 'account' && <AccountTab />}
      </div>
    </main>
  );
}

function SavedNote({ saved }: { saved: boolean }) {
  return saved ? <p className="mt-2 text-sm text-emerald-400">Saved.</p> : null;
}

function ChurchInfoTab() {
  const [church, setChurch] = useState<ChurchInfo | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch('/api/church-info').then((r) => r.json()).then(setChurch); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!church) return;
    await adminFetch('/api/admin/church-info', { method: 'PUT', body: JSON.stringify(church) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!church) return <p className="text-stone-400">Loading…</p>;

  const fields: (keyof ChurchInfo)[] = ['name', 'tagline', 'pastorName', 'pastorTitle', 'address', 'city', 'state', 'phone', 'email', 'facebook_url', 'logoText'];

  return (
    <form onSubmit={save} className="space-y-4">
      <h2 className="font-serif text-2xl">Church Info</h2>
      {fields.map((field) => (
        <label key={field} className="block text-sm">
          <span className="capitalize text-stone-300">{field}</span>
          <input
            value={church[field] as string}
            onChange={(e) => setChurch({ ...church, [field]: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2"
          />
        </label>
      ))}
      <button className="rounded-lg bg-[#d4af37] px-5 py-2.5 font-bold text-stone-950 hover:bg-[#e6c65b]">Save</button>
      <SavedNote saved={saved} />
    </form>
  );
}

function EventsTab() {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const empty: Omit<ChurchEvent, 'id'> = { title: '', description: '', date: '', time: '', location: '', category: 'Weekly', bannerUrl: '' };
  const [form, setForm] = useState(empty);

  function refresh() { adminFetch('/api/admin/events').then(setEvents); }
  useEffect(refresh, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    await adminFetch('/api/admin/events', { method: 'POST', body: JSON.stringify(form) });
    setForm(empty);
    refresh();
  }

  async function remove(id: string) {
    await adminFetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="space-y-8">
      <h2 className="font-serif text-2xl">Events</h2>
      <form onSubmit={add} className="space-y-3 rounded-xl border border-white/10 p-4">
        <p className="text-sm font-bold text-[#d4af37]">Add event</p>
        <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
        <input placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
        <div className="flex gap-3">
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
          <input placeholder="Time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
        </div>
        <input placeholder="Location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ChurchEvent['category'] })} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2">
          {['Special', 'Weekly', 'Youth', 'Women', 'Men', 'Prayer'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="rounded-lg bg-[#d4af37] px-5 py-2.5 font-bold text-stone-950 hover:bg-[#e6c65b]">Add event</button>
      </form>
      <div className="space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3">
            <div><p className="font-bold">{ev.title}</p><p className="text-sm text-stone-400">{ev.date} · {ev.time} · {ev.location}</p></div>
            <button onClick={() => remove(ev.id)} className="text-sm text-red-300 hover:text-red-200">Delete</button>
          </div>
        ))}
        {events.length === 0 && <p className="text-stone-400">No events yet.</p>}
      </div>
    </div>
  );
}

function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const empty: Omit<Department, 'id'> = { name: '', description: '', howToJoin: '' };
  const [form, setForm] = useState(empty);

  function refresh() { adminFetch('/api/admin/departments').then(setDepartments); }
  useEffect(refresh, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    await adminFetch('/api/admin/departments', { method: 'POST', body: JSON.stringify(form) });
    setForm(empty);
    refresh();
  }

  async function remove(id: string) {
    await adminFetch(`/api/admin/departments/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="space-y-8">
      <h2 className="font-serif text-2xl">Departments</h2>
      <form onSubmit={add} className="space-y-3 rounded-xl border border-white/10 p-4">
        <p className="text-sm font-bold text-[#d4af37]">Add department</p>
        <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
        <input placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
        <input placeholder="How to join" required value={form.howToJoin} onChange={(e) => setForm({ ...form, howToJoin: e.target.value })} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
        <button className="rounded-lg bg-[#d4af37] px-5 py-2.5 font-bold text-stone-950 hover:bg-[#e6c65b]">Add department</button>
      </form>
      <div className="space-y-2">
        {departments.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3">
            <div><p className="font-bold">{d.name}</p><p className="text-sm text-stone-400">{d.description}</p></div>
            <button onClick={() => remove(d.id)} className="text-sm text-red-300 hover:text-red-200">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimoniesTab() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  function refresh() { adminFetch('/api/admin/testimonies').then(setTestimonies); }
  useEffect(refresh, []);

  async function setApproval(id: string, isApproved: boolean) {
    await adminFetch(`/api/admin/testimonies/${id}`, { method: 'PUT', body: JSON.stringify({ isApproved }) });
    refresh();
  }

  async function remove(id: string) {
    await adminFetch(`/api/admin/testimonies/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="space-y-3">
      <h2 className="font-serif text-2xl">Testimonies</h2>
      {testimonies.map((t) => (
        <div key={t.id} className="rounded-lg border border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="font-bold">{t.title} — {t.authorName}</p>
            <span className={`text-xs font-bold ${t.isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>{t.isApproved ? 'Approved' : 'Pending'}</span>
          </div>
          <p className="mt-1 text-sm text-stone-400">{t.content}</p>
          <div className="mt-2 flex gap-3 text-sm">
            {!t.isApproved && <button onClick={() => setApproval(t.id, true)} className="text-emerald-400 hover:text-emerald-300">Approve</button>}
            {t.isApproved && <button onClick={() => setApproval(t.id, false)} className="text-amber-400 hover:text-amber-300">Unapprove</button>}
            <button onClick={() => remove(t.id)} className="text-red-300 hover:text-red-200">Delete</button>
          </div>
        </div>
      ))}
      {testimonies.length === 0 && <p className="text-stone-400">No testimonies yet.</p>}
    </div>
  );
}

function MeetingsTab() {
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  useEffect(() => { adminFetch('/api/admin/meeting-requests').then(setMeetings); }, []);

  return (
    <div className="space-y-3">
      <h2 className="font-serif text-2xl">Meeting Requests</h2>
      {meetings.map((m) => (
        <div key={m.id} className="rounded-lg border border-white/10 px-4 py-3">
          <p className="font-bold">{m.fullName}</p>
          <p className="text-sm text-stone-400">{m.contact} · Preferred: {m.preferredDateTime}</p>
          <p className="mt-1 text-sm">{m.reason}</p>
        </div>
      ))}
      {meetings.length === 0 && <p className="text-stone-400">No meeting requests yet.</p>}
    </div>
  );
}

function AccountTab() {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  async function updateEmail(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    const { error } = (await supabaseAuth?.auth.updateUser({ email: newEmail })) ?? {};
    setMessage(error ? 'Could not update email.' : 'Check the new email inbox to confirm the change.');
    setNewEmail('');
  }

  async function updatePassword(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    const { error } = (await supabaseAuth?.auth.updateUser({ password: newPassword })) ?? {};
    setMessage(error ? 'Could not update password.' : 'Password updated.');
    setNewPassword('');
  }

  return (
    <div className="space-y-8">
      <h2 className="font-serif text-2xl">Account</h2>
      <form onSubmit={updateEmail} className="space-y-3 rounded-xl border border-white/10 p-4">
        <p className="text-sm font-bold text-[#d4af37]">Change email</p>
        <input type="email" required placeholder="New email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
        <button className="rounded-lg bg-[#d4af37] px-5 py-2.5 font-bold text-stone-950 hover:bg-[#e6c65b]">Update email</button>
        <p className="text-xs text-stone-500">A confirmation link will be sent to the new email before the change takes effect.</p>
      </form>
      <form onSubmit={updatePassword} className="space-y-3 rounded-xl border border-white/10 p-4">
        <p className="text-sm font-bold text-[#d4af37]">Change password</p>
        <input type="password" required minLength={6} placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2" />
        <button className="rounded-lg bg-[#d4af37] px-5 py-2.5 font-bold text-stone-950 hover:bg-[#e6c65b]">Update password</button>
      </form>
      {message && <p className="text-sm text-emerald-400">{message}</p>}
    </div>
  );
}
