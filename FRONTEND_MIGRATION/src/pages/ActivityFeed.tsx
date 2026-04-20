import React, { useState, useEffect } from 'react';
import {
  Activity,
  User,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import { activity as activityApi } from '../lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ActivityType = 'Document Upload' | 'Cost Event' | 'Asset Update' | 'User Login' | 'System Alert';

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

const typeIcons: Record<string, any> = {
  'Document Upload': FileText,
  'Cost Event': DollarSign,
  'Asset Update': Activity,
  'User Login': User,
  'System Alert': AlertCircle,
};

const statusColors: Record<ActivityItem['status'], string> = {
  success: 'text-emerald-500 bg-emerald-50 border-emerald-100',
  warning: 'text-amber-500 bg-amber-50 border-amber-100',
  error: 'text-red-500 bg-red-50 border-red-100',
  info: 'text-blue-500 bg-blue-50 border-blue-100',
};

function mapStatus(s: string): ActivityItem['status'] {
  if (s === 'success') return 'success';
  if (s === 'warning') return 'warning';
  if (s === 'error') return 'error';
  return 'info';
}

export default function ActivityFeed() {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('brims_role') === 'admin';
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    activityApi.list({ limit: 100 })
      .then((data) => {
        const mapped: ActivityItem[] = data.map((d) => ({
          id: String(d.id),
          type: (d.event_type as ActivityType) || 'System Alert',
          user: d.user_email,
          action: d.action,
          target: d.target,
          timestamp: d.created_at.replace('T', ' ').substring(0, 16),
          status: mapStatus(d.status),
        }));
        setActivities(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = activities.filter(a =>
    !searchQuery ||
    a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by date
  const grouped: Record<string, ActivityItem[]> = filtered.reduce((acc: Record<string, ActivityItem[]>, item) => {
    const date = item.timestamp.split(' ')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ActivityItem[]>);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-6 bg-red-50 rounded-full">
          <ShieldAlert size={48} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm text-center font-medium">
          The Activity Feed is only accessible to system administrators. Please contact support if you believe this is an error.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-brims-navy text-white px-8 py-3 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Activity</h1>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Chronological Event Log</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filter activity..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-brims-navy outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brims-navy" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-400">No activity found.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([date, items], dateIdx) => (
            <div key={date} className="space-y-6 relative">
              <div className="sticky top-0 z-10 py-2 bg-slate-50/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {new Date(date).toLocaleDateString('en-JM', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  <div className="h-[1px] flex-1 bg-slate-200" />
                </div>
              </div>

              <div className="space-y-4 pl-4 border-l-2 border-slate-100 ml-4">
                {items.map((item, idx) => {
                  const Icon = typeIcons[item.type] || AlertCircle;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (dateIdx * 0.1) + (idx * 0.05) }}
                      className="group relative flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brims-amber/30 transition-all cursor-pointer"
                    >
                      <div className={cn(
                        "absolute -left-[25px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm z-20",
                        item.status === 'success' ? 'bg-emerald-500' :
                        item.status === 'warning' ? 'bg-amber-500' :
                        item.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      )} />

                      <div className={cn("p-3 rounded-lg border", statusColors[item.status])}>
                        <Icon size={20} />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{item.action}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Clock size={12} />
                            {item.timestamp.split(' ')[1]}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          <span className="text-brims-navy font-bold">{item.user}</span>
                          <span className="mx-1.5 opacity-30">•</span>
                          <span>{item.target}</span>
                        </p>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                        <ChevronRight size={18} className="text-slate-300" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
