import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Plus,
  Search,
  Filter,
  X,
  Calendar,
  FileText,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { costEvents as costEventsApi, assets as assetsApi } from '../lib/api';
import { Asset } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Category = 'Property Tax' | 'Maintenance and Repair' | 'Renovation' | 'Insurance Premium' | 'Other';

const CATEGORIES: Category[] = ['Property Tax', 'Maintenance and Repair', 'Renovation', 'Insurance Premium', 'Other'];

const categoryColors: Record<string, string> = {
  'Property Tax': 'bg-red-50 text-red-700 border-red-200',
  'Maintenance and Repair': 'bg-amber-50 text-amber-700 border-amber-200',
  'Renovation': 'bg-purple-50 text-purple-700 border-purple-200',
  'Insurance Premium': 'bg-blue-50 text-blue-700 border-blue-200',
  'Other': 'bg-slate-50 text-slate-600 border-slate-200',
};

interface EventRow {
  id: number;
  date: string;
  assetName: string;
  assetId: number;
  category: string;
  description: string;
  amount: number;
}

interface NewEventForm {
  assetId: string;
  date: string;
  category: Category;
  description: string;
  amount: string;
}

export default function CostEvents() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<NewEventForm>({
    assetId: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Other',
    description: '',
    amount: '',
  });

  const loadEvents = () => {
    costEventsApi.list()
      .then((data) => {
        setEvents(data.map(d => ({
          id: d.id,
          date: d.date,
          assetName: d.asset_name,
          assetId: d.asset_id,
          category: d.category,
          description: d.description,
          amount: Number(d.amount),
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
    assetsApi.list().then(setAssetList).catch(console.error);
  }, []);

  const filteredEvents = events.filter(e =>
    !searchQuery ||
    e.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSpend = filteredEvents.reduce((sum, e) => sum + e.amount, 0);
  const maxAmount = events.length > 0 ? Math.max(...events.map(e => e.amount)) : 0;
  const categories = events.map(e => e.category);
  const mostActive = categories.length > 0
    ? Object.entries(categories.reduce((acc: Record<string, number>, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {}))
        .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || '—'
    : '—';

  const stats = [
    { label: 'Total Spend', value: `JMD ${(totalSpend / 1_000_000).toFixed(2)}M`, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Largest Single Expense', value: `JMD ${maxAmount.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600' },
    { label: 'Most Active Category', value: mostActive.split(' ')[0], icon: CreditCard, color: 'text-amber-600' },
  ];

  const handleSaveEvent = async () => {
    if (!form.assetId || !form.date || !form.amount) return;
    setSaving(true);
    try {
      await (await import('../lib/api')).assets.addCostEvent(form.assetId, {
        date: form.date,
        category: form.category,
        description: form.description,
        amount: form.amount,
      });
      setIsSlideOverOpen(false);
      setForm({ assetId: '', date: new Date().toISOString().split('T')[0], category: 'Other', description: '', amount: '' });
      loadEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Stat Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className="p-3 bg-slate-50 rounded-lg">
              <stat.icon size={24} className={stat.color} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-brims-navy focus:border-transparent outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-[1px] bg-slate-200 mx-2" />
          <button
            onClick={() => setIsSlideOverOpen(true)}
            className="flex items-center gap-2 bg-brims-navy text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all shadow-lg shadow-brims-navy/20"
          >
            <Plus size={18} />
            Add Event
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brims-navy" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Asset Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Category</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Description</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No cost events found.</td>
                  </tr>
                ) : filteredEvents.map((event, idx) => (
                  <motion.tr
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 text-sm font-mono font-bold text-slate-600">{event.date}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{event.assetName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        categoryColors[event.category] || categoryColors['Other']
                      )}>
                        {event.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-600 truncate max-w-[200px]">{event.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-bold text-slate-900">JMD {event.amount.toLocaleString()}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Panel */}
      <AnimatePresence>
        {isSlideOverOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSlideOverOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Add Cost Event</h2>
                  <p className="text-xs text-slate-500 font-medium">Record a new financial transaction</p>
                </div>
                <button
                  onClick={() => setIsSlideOverOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp size={12} /> Target Asset
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                    value={form.assetId}
                    onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  >
                    <option value="">Select an asset...</option>
                    {assetList.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar size={12} /> Date
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Tag size={12} /> Category
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText size={12} /> Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe the expense..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign size={12} /> Amount (JMD)
                  </label>
                  <input
                    type="text"
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-3">
                <button
                  onClick={() => setIsSlideOverOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  disabled={saving || !form.assetId}
                  className="flex-1 bg-brims-navy text-white px-8 py-3 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all shadow-lg shadow-brims-navy/20 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
