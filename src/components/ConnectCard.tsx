import { FormEvent, ReactNode, useRef, useState } from 'react';
import { CheckCircle2, Heart, Loader2, Mail, Phone, User } from 'lucide-react';

interface ConnectCardProps { onSuccessSubmit: () => void; }

export default function ConnectCard({ onSuccessSubmit }: ConnectCardProps) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', prayerRequest: '', isFirstTime: true });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const submitting = useRef(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (submitting.current) return; submitting.current = true;
    setStatus('sending');
    try {
      const response = await fetch('/api/connect-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, interestInGroups: [] }) });
      if (!response.ok) throw new Error('Request failed');
      setStatus('success');
      onSuccessSubmit();
    } catch {
      setStatus('error');
    } finally { submitting.current = false; }
  };

  if (status === 'success') return <div className="rounded-2xl border border-[#d4af37]/30 bg-white p-8 text-center text-stone-900 dark:bg-stone-800 dark:text-white"><CheckCircle2 className="mx-auto mb-3 text-[#b8942b]" size={42} /><h3 className="font-serif text-2xl">Welcome to the family</h3><p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Thank you, {form.fullName}. A member of the Mount Zion team will be in touch.</p></div>;

  return <form onSubmit={submit} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-800 sm:p-8">
    <div className="mb-6"><span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#9a7820]"><Heart size={13} /> I’m new here</span><h3 className="mt-2 font-serif text-3xl text-stone-900 dark:text-white">We would love to meet you</h3><p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Whether you are visiting in person or joining us online, you are welcome at Mount Zion.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" icon={<User size={15} />} value={form.fullName} onChange={fullName => setForm({ ...form, fullName })} />
      <Field label="Email address" type="email" icon={<Mail size={15} />} value={form.email} onChange={email => setForm({ ...form, email })} />
      <Field label="Phone number" type="tel" icon={<Phone size={15} />} value={form.phone} onChange={phone => setForm({ ...form, phone })} />
      <label className="text-sm font-medium text-stone-700 dark:text-stone-200">Is this your first time?<select value={String(form.isFirstTime)} onChange={e => setForm({ ...form, isFirstTime: e.target.value === 'true' })} className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 dark:border-stone-600 dark:bg-stone-900 dark:text-white"><option value="true">Yes, it is</option><option value="false">No, I have visited before</option></select></label>
    </div>
    <label className="mt-4 block text-sm font-medium text-stone-700 dark:text-stone-200">Prayer request (optional)<textarea value={form.prayerRequest} onChange={e => setForm({ ...form, prayerRequest: e.target.value })} rows={4} className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2.5 dark:border-stone-600 dark:bg-stone-900 dark:text-white" placeholder="How can we pray for you?" /></label>
    {status === 'error' && <p className="mt-3 text-sm text-red-700">We could not send your card. Please try again shortly.</p>}
    <button disabled={status === 'sending'} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#b8942b] px-4 py-3 text-sm font-bold text-white hover:bg-[#94721c] disabled:opacity-60">{status === 'sending' && <Loader2 size={16} className="animate-spin" />} Send my connect card</button>
  </form>;
}

function Field({ label, icon, value, onChange, type = 'text' }: { label: string; icon: ReactNode; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="text-sm font-medium text-stone-700 dark:text-stone-200">{label}<span className="relative mt-1 block text-stone-400"><span className="absolute left-3 top-3">{icon}</span><input required type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-3 text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-white" /></span></label>;
}
