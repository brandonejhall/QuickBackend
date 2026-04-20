import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Home,
  DollarSign,
  Plus,
  MoreHorizontal,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Box,
  Upload,
  FileText,
  X,
  Activity,
  ArrowRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Asset, Status, AssetType } from '../types';
import { assets as assetsApi, dashboard as dashboardApi, activity as activityApi } from '../lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusColors: Record<Status, string> = {
  'Owned': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Mortgaged': 'bg-blue-50 text-blue-700 border-blue-200',
  'Tenanted': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Vacant': 'bg-slate-50 text-slate-600 border-slate-200',
  'Under Renovation': 'bg-amber-50 text-amber-700 border-amber-200',
  'Listed for Sale': 'bg-purple-50 text-purple-700 border-purple-200',
  'Disposed': 'bg-red-50 text-red-700 border-red-200',
  'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Maintenance': 'bg-orange-50 text-orange-700 border-orange-200',
};

const typeIcons: Record<AssetType, any> = {
  'Residential': Home,
  'Commercial': Building2,
  'Land': MapPin,
  'Industrial': Box,
  'Mixed Use': Building2,
  'Vehicle': Truck,
  'Equipment': Box,
  'Other': Box,
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [stats, setStats] = useState<{
    total_assets: number;
    total_portfolio_value: string;
    total_monthly_rental_income: string;
    assets_by_status: Record<string, number>;
  } | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{ id: number; action: string; target: string; created_at: string; event_type: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: string}[]>([]);

  useEffect(() => {
    Promise.all([
      assetsApi.list(),
      dashboardApi.stats(),
      activityApi.list({ limit: 3 }),
    ]).then(([assetData, statsData, activityData]) => {
      setAssetList(assetData);
      setStats(statsData);
      setRecentActivity(activityData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const occupancyRate = stats
    ? Math.round(((stats.assets_by_status['Tenanted'] || 0) / Math.max(stats.total_assets, 1)) * 100)
    : 0;

  const kpis = [
    {
      label: 'Total Assets',
      value: stats ? String(stats.total_assets) : '—',
      icon: Home,
      trend: 'Portfolio Count'
    },
    {
      label: 'Portfolio Value (JMD)',
      value: stats ? (Number(stats.total_portfolio_value) / 1_000_000).toFixed(2) + 'M' : '—',
      icon: TrendingUp,
      trend: 'Total Acquisition'
    },
    {
      label: 'Monthly Revenue',
      value: stats ? (Number(stats.total_monthly_rental_income) / 1_000_000).toFixed(2) + 'M' : '—',
      icon: DollarSign,
      trend: 'Rental Income'
    },
    {
      label: 'Occupancy Rate',
      value: stats ? occupancyRate + '%' : '—',
      icon: Activity,
      trend: 'Tenancy Status'
    },
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    const newFiles = files.map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(2) + ' MB' }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</h3>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-brims-navy group-hover:text-white transition-colors">
                <kpi.icon size={20} className="text-slate-400 group-hover:text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Asset Table Section */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Asset Portfolio</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage and track your global assets and relationships</p>
            </div>
            <button
              onClick={() => navigate('/assets/new')}
              className="flex items-center gap-2 bg-brims-navy text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all shadow-lg shadow-brims-navy/20"
            >
              <Plus size={18} />
              <span>Add Asset</span>
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brims-navy" />
              </div>
            ) : assetList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                <div className="p-6 bg-slate-50 rounded-full text-slate-300">
                  <Building2 size={48} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900">No assets found</p>
                  <p className="text-xs text-slate-400 font-medium">Start by adding your first asset to the portfolio.</p>
                </div>
                <button
                  onClick={() => navigate('/assets/new')}
                  className="flex items-center gap-2 bg-brims-navy text-white px-6 py-2.5 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all"
                >
                  <Plus size={18} />
                  Add First Asset
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Asset Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Type</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Location</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Market Value</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assetList.map((asset, idx) => {
                    const Icon = typeIcons[asset.type] || Box;
                    return (
                      <motion.tr
                        key={asset.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        onClick={() => navigate(`/assets/${asset.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100 text-slate-400 group-hover:bg-brims-navy group-hover:text-white flex items-center justify-center transition-colors">
                              <Icon size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{asset.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asset.registryNumber || 'No Registry #'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-600">{asset.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <MapPin size={14} />
                            <span className="text-xs font-medium">{asset.parish}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                            statusColors[asset.status]
                          )}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-bold text-slate-900">
                            JMD {Number(asset.purchasePrice || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400">
                            <ArrowRight size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {assetList.length > 0 && (
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center mt-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {assetList.length} assets</p>
            </div>
          )}
        </div>

        {/* Right Panel - Document Upload & Recent Docs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Upload Documents</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Attach files to your portfolio</p>
            </div>
            <div className="p-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer text-center",
                  isDragging ? "border-brims-navy bg-brims-navy/5" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-400">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-bold text-slate-900">Drop files here</p>
                <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">or click to browse</p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recently Uploaded</p>
                  {uploadedFiles.map((file, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-brims-navy shadow-sm">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{file.size}</p>
                      </div>
                      <button
                        onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity</h2>
              <button onClick={() => navigate('/activity')} className="text-[10px] font-bold text-brims-navy uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="p-4 space-y-4">
              {recentActivity.length === 0 && !loading ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent activity.</p>
              ) : recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brims-navy transition-colors">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-brims-navy transition-colors">{item.action}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.target}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
