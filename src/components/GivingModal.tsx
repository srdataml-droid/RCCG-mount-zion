import { useState } from 'react';
import { Heart, X, Copy, Check } from 'lucide-react';
import { GivingAccount, GivingCategory } from '../types';

const CATEGORIES: GivingCategory[] = ['Tithe', 'Offering', 'Thanksgiving', 'Building Fund', 'Missions', 'Other'];

export default function GivingModal({ isOpen, onClose, accounts }: { isOpen: boolean; onClose: () => void; accounts: GivingAccount[] }) {
  const [category, setCategory] = useState<GivingCategory>('Tithe');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const account = accounts.find(item => item.category === category);
  const reference = `${category.toUpperCase().replace(/\s+/g, '-')}-MOUNT-ZION`;

  function copyAccountNumber() {
    if (!account?.accountNumber) return;
    navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 p-4" role="dialog" aria-modal="true" aria-label="Giving information">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl dark:bg-stone-900">
        <div className="flex items-start justify-between">
          <div>
            <Heart className="text-[#b8942b]" />
            <h2 className="mt-3 font-serif text-3xl text-stone-900 dark:text-white">Give to Mount Zion</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 text-stone-500 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800" aria-label="Close"><X /></button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          Give by direct bank transfer. Choose what your gift is for, then use the account details below with the matching reference.
        </p>

        <label className="mt-5 block text-sm font-medium text-stone-700 dark:text-stone-200">
          What is this gift for?
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm dark:border-stone-600 dark:bg-stone-800 dark:text-white"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        {account ? (
          <div className="mt-5 rounded-lg border border-[#d4af37]/40 bg-[#fffaf0] p-4 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-200">
            <p><strong>Bank:</strong> {account.bankName}</p>
            <p className="mt-1"><strong>Account name:</strong> {account.accountName}</p>
            <div className="mt-1 flex items-center gap-2">
              <strong>Account number:</strong> {account.accountNumber}
              {account.accountNumber && (
                <button onClick={copyAccountNumber} className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-white dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-700">
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <p className="mt-2"><strong>Reference:</strong> {reference}</p>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-[#d4af37]/40 bg-[#fffaf0] p-4 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-200">
            Bank details for this category are being set up — please speak with a member of the church team.
          </div>
        )}

        <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
        </p>

        <button onClick={onClose} className="mt-6 w-full rounded-lg bg-[#b8942b] px-4 py-3 text-sm font-bold text-white hover:bg-[#94721c]">Close</button>
      </div>
    </div>
  );
}
