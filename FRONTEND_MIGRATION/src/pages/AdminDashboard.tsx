import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  Mail,
  Shield,
  FileText,
  TrendingUp,
  DollarSign,
  CreditCard,
  Activity,
  Download,
  MoreVertical,
  ChevronRight,
  Filter
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';
import { dashboard as dashboardApi, activity as activityApi } from '../lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ActivityRow {
  id: number;
  event_type: string;
  user_email: string;
  action: string;
  target: string;
  created_at: string;
  status: string;
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<{
    total_assets: number;
    total_portfolio_value: string;
    total_mortgage_balance: string;
  } | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.stats(),
      activityApi.list({ limit: 6 }),
    ]).then(([statsData, activityData]) => {
      setStats(statsData);
      setRecentActivity(activityData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const kpiStats = stats ? [
    { label: 'Total Assets Under Management', value: String(stats.total_assets), icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Combined Portfolio Value', value: `JMD ${(Number(stats.total_portfolio_value) / 1_000_000).toFixed(1)}M`, icon: DollarSign, color: 'text-blue-600' },
    { label: 'Total Outstanding Mortgage', value: `JMD ${(Number(stats.total_mortgage_balance) / 1_000_000).toFixed(1)}M`, icon: CreditCard, color: 'text-amber-600' },
  ] : [
    { label: 'Total Assets Under Management', value: '—', icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Combined Portfolio Value', value: '—', icon: DollarSign, color: 'text-blue-600' },
    { label: 'Total Outstanding Mortgage', value: '—', icon: CreditCard, color: 'text-amber-600' },
  ];

  const timeSince = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel - Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4">Portfolio Summary</h2>
            </div>
            <div className="p-4 space-y-4">
              {kpiStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center gap-4"
                >
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
                    <p className="text-lg font-bold text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Activity */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpiStats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
              >
                <div className="p-2 bg-slate-50 rounded-lg w-fit mb-4">
                  <stat.icon size={20} className={stat.color} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-brims-navy" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent System Activity</h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brims-navy" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">No recent activity.</p>
                </div>
              ) : recentActivity.map((item) => (
                <div key={item.id} className="px-6 py-4 border-b border-slate-50 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    item.status === 'success' ? 'bg-emerald-500' :
                    item.status === 'warning' ? 'bg-amber-500' :
                    item.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      <span className="font-bold text-slate-900">{item.user_email}</span>
                      {' — '}
                      <span>{item.action}</span>
                      {item.target && <span className="font-bold text-slate-900 ml-1">({item.target})</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeSince(item.created_at)} • {item.event_type}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom - Recent Activity Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-brims-navy" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Full Activity Log</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Event</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Target</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">When</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentActivity.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Activity size={16} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900">{item.action}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.event_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-600">{item.user_email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-brims-navy">{item.target}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500">{timeSince(item.created_at)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                      item.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      item.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      item.status === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    )}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
