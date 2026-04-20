import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Bell,
  LogOut,
  User,
  ChevronDown,
  AlertCircle,
  Clock,
  Menu,
  TrendingUp,
  PieChart,
  Activity,
  Building2,
  Shield,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { users } from '../lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Alert {
  id: string;
  type: 'overdue' | 'upcoming';
  assetName: string;
  eventType: string;
  dueDate: string;
  amount: string;
}

const mockAlerts: Alert[] = [
  { id: '1', type: 'overdue', assetName: 'Ocean View Villa', eventType: 'Rent Payment', dueDate: '2026-03-10', amount: '$2,500' },
  { id: '2', type: 'upcoming', assetName: 'Kingston Heights', eventType: 'Mortgage Due', dueDate: '2026-03-25', amount: '$1,800' },
  { id: '3', type: 'upcoming', assetName: 'Montego Bay Apt', eventType: 'Maintenance', dueDate: '2026-04-05', amount: '$450' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ fullname: string; email: string; role: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem('brims_role');
  const isAdmin = role === 'admin';

  useEffect(() => {
    users.me().then(setCurrentUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('brims_token');
    localStorage.removeItem('brims_role');
    navigate('/login');
  };

  const initials = currentUser?.fullname
    ? currentUser.fullname.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const navItems = [
    { name: 'User Dashboard', path: '/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'Admin Dashboard', path: '/admin', icon: Shield, adminOnly: true },
    { name: 'Cost Events', path: '/cost-events', icon: TrendingUp, adminOnly: false },
    { name: 'Portfolio Report', path: '/report', icon: PieChart, adminOnly: false },
    { name: 'Activity Feed', path: '/activity', icon: Activity, adminOnly: true },
    { name: 'Asset Notes', path: '/notes', icon: FileText, adminOnly: false },
  ].filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-brims-navy text-white w-64 flex-shrink-0 flex flex-col transition-all duration-300 z-30',
          !isSidebarOpen && '-ml-64'
        )}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-brims-amber rounded-sm flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-brims-navy" />
            <span className="text-white font-bold text-lg z-10">B</span>
          </div>
          <span className="text-2xl font-bold tracking-tighter">BRIMS</span>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-md transition-all group',
                location.pathname === item.path
                  ? 'bg-white/10 text-brims-amber'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  'transition-colors',
                  location.pathname === item.path ? 'text-brims-amber' : 'text-slate-400 group-hover:text-white'
                )}
              />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.fullname || 'Loading...'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{currentUser?.role || role || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-500"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              {navItems.find((item) => item.path === location.pathname)?.name || 'BRIMS'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className={cn(
                  'p-2 hover:bg-slate-100 rounded-full transition-all relative',
                  isAlertsOpen && 'bg-slate-100'
                )}
              >
                <Bell size={20} className="text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>

              <AnimatePresence>
                {isAlertsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAlertsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">Alerts & Notifications</h3>
                        <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                          {mockAlerts.length} New
                        </span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {mockAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={cn(
                              'p-4 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors group',
                              alert.type === 'overdue' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-brims-amber'
                            )}
                          >
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                                alert.type === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                              )}
                            >
                              {alert.type === 'overdue' ? <AlertCircle size={20} /> : <Clock size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-slate-900 truncate">{alert.assetName}</p>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{alert.dueDate}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {alert.eventType} - <span className="font-semibold">{alert.amount}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-slate-50 text-center">
                        <button className="text-xs font-bold text-brims-navy hover:underline">View All Activity</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-brims-navy text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
