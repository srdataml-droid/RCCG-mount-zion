import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, X } from 'lucide-react';
import { ChurchEvent } from '../types';

const DAY = 24 * 60 * 60 * 1000;
const palette = ['bg-[#b8942b]', 'bg-[#8a6714]', 'bg-stone-600', 'bg-[#c58f2b]', 'bg-[#665742]', 'bg-[#a37c19]'];
const fromDate = (value: string) => new Date(`${value}T12:00:00`);
const offset = (date: Date, days: number) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; };
const difference = (one: Date, two: Date) => Math.round((one.getTime() - two.getTime()) / DAY);
function dateText(start: string, end?: string | null) { const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }; return end ? `${fromDate(start).toLocaleDateString('en-NZ', options)} – ${fromDate(end).toLocaleDateString('en-NZ', options)}` : fromDate(start).toLocaleDateString('en-NZ', options); }

export default function EventsCalendar({ events }: { events: ChurchEvent[] }) {
  const [selected, setSelected] = useState<ChurchEvent | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => { const today = new Date(); today.setHours(12, 0, 0, 0); return offset(today, -today.getDay() + weekOffset * 7); }, [weekOffset]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => offset(weekStart, index)), [weekStart]);
  const weekEnd = days[6];
  const visible = events.filter(event => fromDate(event.date) <= weekEnd && fromDate(event.endDate || event.date) >= weekStart);

  return <>
    <div className="mt-8 rounded-2xl border border-[#d9c48a] bg-white p-4 shadow-sm dark:border-[#8a6714] dark:bg-stone-900">
      <div className="mb-4 flex items-center justify-between gap-2"><button onClick={() => setWeekOffset(value => value - 1)} className="calendar-nav" aria-label="Previous week"><ChevronLeft size={18} />Previous</button><p className="text-center text-sm font-bold text-stone-800 dark:text-stone-100">{dateText(days[0].toISOString().slice(0, 10), days[6].toISOString().slice(0, 10))}</p><button onClick={() => setWeekOffset(value => value + 1)} className="calendar-nav" aria-label="Next week">Next<ChevronRight size={18} /></button></div>
      <div className="grid grid-cols-7 border-b border-stone-200 pb-3 dark:border-stone-700">{days.map(day => <div key={day.toISOString()} className="text-center text-xs font-bold text-stone-500 dark:text-stone-400"><span>{day.toLocaleDateString('en-NZ', { weekday: 'short' })}</span><span className="mt-1 block text-base text-stone-800 dark:text-stone-100">{day.getDate()}</span></div>)}</div>
      <div className="mt-3 space-y-2">{visible.length ? visible.map((event, index) => { const start = Math.max(0, difference(fromDate(event.date), weekStart)); const end = Math.min(6, difference(fromDate(event.endDate || event.date), weekStart)); return <div key={event.id} className="grid grid-cols-7"><button onClick={() => setSelected(event)} style={{ gridColumn: `${start + 1} / ${end + 2}` }} className={`h-9 min-w-0 truncate rounded-full px-3 text-left text-xs font-bold text-white shadow-sm transition hover:brightness-110 ${palette[index % palette.length]}`}>{event.title}</button></div>; }) : <p className="py-5 text-center text-sm text-stone-600 dark:text-stone-300">There are no events this week.</p>}</div>
    </div>
    <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">Tap an event for details. Bars touching the week’s edge continue outside this week.</p>
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 p-4" role="dialog" aria-modal="true" aria-label={`${selected.title} details`}><article className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-stone-900"><div className="flex items-start justify-between gap-4 p-6"><div><p className="eyebrow">{selected.category}</p><h3 className="mt-2 font-serif text-3xl text-stone-900 dark:text-white">{selected.title}</h3></div><button onClick={() => setSelected(null)} aria-label="Close event details" className="rounded-full p-1 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"><X /></button></div>{selected.bannerUrl && <img src={selected.bannerUrl} alt={`${selected.title} event banner`} loading="lazy" decoding="async" className="max-h-56 w-full object-cover" />}<div className="space-y-4 p-6 pt-4"><p className="leading-7 text-stone-700 dark:text-stone-200">{selected.description}</p><p className="flex gap-2 text-sm text-stone-700 dark:text-stone-200"><CalendarDays className="shrink-0 text-[#a37c19]" size={18} />{dateText(selected.date, selected.endDate)}</p><p className="flex gap-2 text-sm text-stone-700 dark:text-stone-200"><Clock className="shrink-0 text-[#a37c19]" size={18} />{selected.time}</p><p className="flex gap-2 text-sm text-stone-700 dark:text-stone-200"><MapPin className="shrink-0 text-[#a37c19]" size={18} />{selected.location}</p></div></article></div>}
  </>;
}
