import { FormEvent, useState } from 'react';
import { supabaseAuth } from './supabaseClient';

export default function AdminLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!supabaseAuth) {
      setError('Admin login is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError('Incorrect email or password.');
      return;
    }
    onSignedIn();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-stone-950 p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-[#d4af37]/30 bg-stone-900 p-8 text-white shadow-xl">
        <h1 className="font-serif text-2xl">Mount Zion Admin</h1>
        <p className="mt-1 text-sm text-stone-400">Sign in to manage the church website.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-600 bg-white/10 px-3 py-2 text-white"
            />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[#d4af37] px-4 py-3 text-sm font-bold text-stone-950 hover:bg-[#e6c65b] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
