import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Hash,
  Maximize2,
  DollarSign,
  CreditCard,
  TrendingUp,
  Plus,
  FileText,
  Download,
  ChevronRight,
  Box,
  Truck,
  ArrowLeft,
  Edit3,
  X,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Camera,
  Clock,
  User as UserIcon,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Asset, ConditionEntry, Unit, Equipment, Document, CostEvent, Status, ConditionRating, AssetType } from '../types';
import { assets as assetsApi } from '../lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const JAMAICAN_PARISHES = [
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
  'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
  'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
];

const ASSET_TYPES: AssetType[] = ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed Use'];
const STATUSES: Status[] = ['Owned', 'Mortgaged', 'Tenanted', 'Vacant', 'Under Renovation', 'Listed for Sale', 'Disposed'];

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

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'units' | 'equipment' | 'documents' | 'costs'>('units');
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAsset(); }, [id]);

  const loadAsset = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await assetsApi.get(id);
      setAsset(data);
    } catch (err) {
      console.error(err);
      setAsset(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && asset) {
      try {
        await assetsApi.uploadPhoto(asset.id, file);
        await loadAsset();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brims-navy" />
    </div>
  );

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-6 bg-slate-50 rounded-full text-slate-400">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Asset Not Found</h2>
        <p className="text-slate-500 font-medium">The asset you are looking for does not exist or has been removed.</p>
        <Link to="/dashboard" className="bg-brims-navy text-white px-8 py-3 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all">
          Back to Portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="h-48 bg-slate-100 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {asset.photoUrl ? (
            <img src={asset.photoUrl} alt={asset.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <Camera size={48} />
              <p className="text-xs font-bold uppercase tracking-widest mt-2">Upload Property Photo</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 p-2 rounded-full text-brims-navy">
              <Camera size={24} />
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
        </div>

        <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{asset.name}</h1>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <MapPin size={16} />
              <span>{asset.parish}, Jamaica</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-widest shadow-sm",
              statusColors[asset.status]
            )}>
              {asset.status}
            </span>
            <button
              onClick={() => setIsEditDrawerOpen(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-2 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Edit3 size={18} />
              Edit Asset
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Property Type', value: asset.type, icon: Building2, color: 'text-blue-600' },
          { label: 'Lot Size', value: `${asset.lotSize} ${asset.lotSizeUnit}`, icon: Maximize2, color: 'text-emerald-600' },
          { label: 'Build Year', value: asset.buildYear || 'N/A', icon: Calendar, color: 'text-amber-600' },
          { label: 'Current Status', value: asset.status, icon: TrendingUp, color: 'text-indigo-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <stat.icon size={24} className={stat.color} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Property Record</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
              {[
                { label: 'Street', value: asset.street },
                { label: 'Parish', value: asset.parish },
                { label: 'Country', value: asset.country },
                { label: 'Registry #', value: asset.registryNumber || 'N/A' },
                { label: 'Ref ID', value: asset.externalRefId || 'N/A' },
                { label: 'Acquisition', value: asset.acquisitionDate || 'N/A' },
                { label: 'Owner', value: asset.ownerName || 'N/A' },
                { label: 'Purchase Price', value: asset.purchasePrice ? `JMD ${Number(asset.purchasePrice).toLocaleString()}` : 'N/A' },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comments</p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">{asset.comments || 'No additional comments.'}</p>
              </div>
            </div>
          </div>

          <ConditionLog assetId={asset.id} asset={asset} onRefresh={loadAsset} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-8">
          <OccupancyPanel assetId={asset.id} asset={asset} onRefresh={loadAsset} />
          <UnitsPanel assetId={asset.id} asset={asset} onRefresh={loadAsset} />
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/30">
          {[
            { id: 'units', label: 'Units', icon: Box },
            { id: 'equipment', label: 'Equipment', icon: Truck },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'costs', label: 'Cost Events', icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                activeTab === tab.id
                  ? "border-brims-amber text-brims-navy bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'units' && <UnitsTab assetId={asset.id} asset={asset} onRefresh={loadAsset} />}
          {activeTab === 'equipment' && <EquipmentTab assetId={asset.id} asset={asset} onRefresh={loadAsset} />}
          {activeTab === 'documents' && <DocumentsTab assetId={asset.id} asset={asset} onRefresh={loadAsset} />}
          {activeTab === 'costs' && <CostEventsTab assetId={asset.id} asset={asset} onRefresh={loadAsset} />}
        </div>
      </div>

      {/* Edit Drawer */}
      <EditAssetDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        assetId={asset.id}
        asset={asset}
        onRefresh={loadAsset}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SubProps {
  assetId: string;
  asset: Asset;
  onRefresh: () => Promise<void>;
}

function ConditionLog({ assetId, asset, onRefresh }: SubProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEntry, setNewEntry] = useState({ date: new Date().toISOString().split('T')[0], rating: 'Good', note: '' });

  const handleAdd = async () => {
    setSaving(true);
    try {
      await assetsApi.addConditionEntry(assetId, newEntry);
      await onRefresh();
      setIsAdding(false);
      setNewEntry({ date: new Date().toISOString().split('T')[0], rating: 'Good', note: '' });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await assetsApi.deleteConditionEntry(assetId, entryId);
      await onRefresh();
    } catch (err) { console.error(err); }
  };

  const ratingColors: Record<ConditionRating, string> = {
    Good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Fair: 'bg-blue-50 text-blue-700 border-blue-200',
    Poor: 'bg-amber-50 text-amber-700 border-amber-200',
    Critical: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Condition Log</h3>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 text-brims-navy text-xs font-bold hover:underline">
            <Plus size={14} /> Add Condition Entry
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</label>
                  <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={newEntry.rating} onChange={(e) => setNewEntry({ ...newEntry, rating: e.target.value })}>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Note</label>
                <textarea rows={3} className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy resize-none" value={newEntry.note} onChange={(e) => setNewEntry({ ...newEntry, note: e.target.value })} placeholder="Describe the condition..." />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="bg-brims-navy text-white px-6 py-2 rounded-md text-xs font-bold hover:bg-brims-navy-dark shadow-sm disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {asset.conditionLog.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm font-medium text-slate-400">No condition entries yet.</p>
          </div>
        ) : asset.conditionLog.map((entry) => (
          <div key={entry.id} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm flex justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-900">{entry.date}</span>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", ratingColors[entry.rating])}>
                  {entry.rating}
                </span>
              </div>
              <p className="text-sm text-slate-600 font-medium">{entry.note}</p>
            </div>
            <button onClick={() => handleDelete(entry.id)} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OccupancyPanel({ assetId, asset, onRefresh }: SubProps) {
  const [leaseDates, setLeaseDates] = useState({
    start: asset.rental?.leaseStart || '',
    end: asset.rental?.leaseEnd || ''
  });

  useEffect(() => {
    setLeaseDates({ start: asset.rental?.leaseStart || '', end: asset.rental?.leaseEnd || '' });
  }, [asset]);

  const handleBlur = async () => {
    if (asset.rental) {
      try {
        await assetsApi.update(assetId, {
          rental: { ...asset.rental, leaseStart: leaseDates.start, leaseEnd: leaseDates.end }
        });
        await onRefresh();
      } catch (err) { console.error(err); }
    }
  };

  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return null;
    const diffTime = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysSince = (dateStr: string) => {
    if (!dateStr) return null;
    const diffTime = Date.now() - new Date(dateStr).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysToExpiry = getDaysDiff(leaseDates.end);
  const daysVacant = getDaysSince(asset.acquisitionDate);
  const expiryColor = daysToExpiry === null ? 'text-slate-400' : daysToExpiry > 90 ? 'text-emerald-600' : daysToExpiry > 0 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Occupancy & Tenancy</h3>

      {asset.status === 'Tenanted' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tenant Name</p>
              <p className="text-sm font-bold text-slate-900">{asset.rental?.tenantName || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Rent</p>
              <p className="text-sm font-mono font-bold text-emerald-600">JMD {Number(asset.rental?.monthlyIncome || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lease Start</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={leaseDates.start} onChange={(e) => setLeaseDates({ ...leaseDates, start: e.target.value })} onBlur={handleBlur} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lease End</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={leaseDates.end} onChange={(e) => setLeaseDates({ ...leaseDates, end: e.target.value })} onBlur={handleBlur} />
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lease Expiry</span>
            </div>
            <div className={cn("text-lg font-bold tracking-tight", expiryColor)}>
              {daysToExpiry === null ? 'N/A' : `${daysToExpiry} Days`}
            </div>
          </div>
        </div>
      ) : asset.status === 'Vacant' ? (
        <div className="space-y-4">
          <div className="p-6 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-700 uppercase tracking-widest">Days Vacant</p>
              <p className="text-3xl font-bold text-red-600 tracking-tighter">{daysVacant || 0}</p>
            </div>
            <div className="p-3 bg-white rounded-full text-red-500 shadow-sm">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium text-center italic">Calculated from acquisition date.</p>
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm font-medium text-slate-400">Not applicable for current status.</p>
        </div>
      )}
    </div>
  );
}

function UnitsPanel({ assetId, asset, onRefresh }: SubProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [unitForm, setUnitForm] = useState<Partial<Unit>>({ name: '', status: 'Vacant', tenantName: '', monthlyRent: '' });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await assetsApi.updateUnit(assetId, editingId, unitForm);
      } else {
        await assetsApi.addUnit(assetId, unitForm);
      }
      await onRefresh();
      setIsAdding(false);
      setEditingId(null);
      setUnitForm({ name: '', status: 'Vacant', tenantName: '', monthlyRent: '' });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleEdit = (unit: Unit) => {
    setUnitForm(unit);
    setEditingId(unit.id);
    setIsAdding(true);
  };

  const handleDelete = async (unitId: string) => {
    try {
      await assetsApi.deleteUnit(assetId, unitId);
      await onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Units</h3>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 text-brims-navy text-xs font-bold hover:underline">
            <Plus size={14} /> Add Unit
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Name</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                  <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={unitForm.status} onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value as any })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {unitForm.status === 'Tenanted' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tenant Name</label>
                      <input type="text" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={unitForm.tenantName} onChange={(e) => setUnitForm({ ...unitForm, tenantName: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Rent</label>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={unitForm.monthlyRent} onChange={(e) => setUnitForm({ ...unitForm, monthlyRent: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="bg-brims-navy text-white px-6 py-2 rounded-md text-xs font-bold hover:bg-brims-navy-dark shadow-sm disabled:opacity-60">
                  {saving ? 'Saving...' : editingId ? 'Update Unit' : 'Save Unit'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        {asset.units.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm font-medium text-slate-400">No units added yet.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="pb-3">Name</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {asset.units.map((unit) => (
                <tr key={unit.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <p className="text-sm font-bold text-slate-900">{unit.name}</p>
                    {unit.tenantName && <p className="text-[10px] text-slate-400 font-bold uppercase">{unit.tenantName}</p>}
                  </td>
                  <td className="py-3">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", statusColors[unit.status])}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(unit)} className="p-1 text-slate-400 hover:text-brims-navy"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(unit.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function UnitsTab({ assetId, asset, onRefresh }: SubProps) {
  return <UnitsPanel assetId={assetId} asset={asset} onRefresh={onRefresh} />;
}

function EquipmentTab({ assetId, asset, onRefresh }: SubProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Equipment>>({ name: '', condition: 'Good', installDate: '', lastServiceDate: '', nextServiceDue: '' });

  const handleAdd = async () => {
    setSaving(true);
    try {
      await assetsApi.addEquipment(assetId, form);
      await onRefresh();
      setIsAdding(false);
      setForm({ name: '', condition: 'Good', installDate: '', lastServiceDate: '', nextServiceDue: '' });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (eqId: string) => {
    try {
      await assetsApi.deleteEquipment(assetId, eqId);
      await onRefresh();
    } catch (err) { console.error(err); }
  };

  const isOverdue = (dateStr: string) => !!dateStr && new Date(dateStr) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Asset Equipment</h3>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-brims-navy text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-brims-navy-dark transition-all">
            <Plus size={14} /> Add Equipment
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Name</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Condition</label>
                  <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as any })}>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Install Date</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={form.installDate} onChange={(e) => setForm({ ...form, installDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Service</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={form.lastServiceDate} onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Service Due</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={form.nextServiceDue} onChange={(e) => setForm({ ...form, nextServiceDue: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="bg-brims-navy text-white px-6 py-2 rounded-md text-xs font-bold hover:bg-brims-navy-dark shadow-sm disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Equipment'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="pb-3">Item Name</th>
              <th className="pb-3">Condition</th>
              <th className="pb-3">Install Date</th>
              <th className="pb-3">Last Service</th>
              <th className="pb-3">Next Due</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {asset.equipment.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">No equipment added yet.</td></tr>
            ) : asset.equipment.map((item) => (
              <tr key={item.id} className={cn("group hover:bg-slate-50 transition-colors", isOverdue(item.nextServiceDue) && "border-l-4 border-l-red-500")}>
                <td className="py-4 px-2 text-sm font-bold text-slate-900">{item.name}</td>
                <td className="py-4">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                    item.condition === 'Good' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    item.condition === 'Fair' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    item.condition === 'Poor' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                  )}>
                    {item.condition}
                  </span>
                </td>
                <td className="py-4 text-xs font-medium text-slate-600">{item.installDate || 'N/A'}</td>
                <td className="py-4 text-xs font-medium text-slate-600">{item.lastServiceDate || 'N/A'}</td>
                <td className={cn("py-4 text-xs font-bold", isOverdue(item.nextServiceDue) ? "text-red-600" : "text-slate-900")}>
                  {item.nextServiceDue || 'N/A'}
                </td>
                <td className="py-4 text-right">
                  <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsTab({ assetId, asset, onRefresh }: SubProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await assetsApi.uploadDocument(assetId, file);
      }
      await onRefresh();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const handleDelete = async (docId: string) => {
    try {
      await assetsApi.deleteDocument(assetId, docId);
      await onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
        onClick={() => document.getElementById('file-upload-tab')?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer text-center",
          isDragging ? "border-brims-navy bg-brims-navy/5" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        <div className="p-4 bg-slate-100 rounded-full mb-4 text-slate-400">
          <Plus size={32} />
        </div>
        <p className="text-sm font-bold text-slate-900">{uploading ? 'Uploading...' : 'Drop documents here'}</p>
        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">or click to browse from your computer</p>
        <input type="file" id="file-upload-tab" className="hidden" multiple onChange={(e) => handleUpload(e.target.files)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {asset.documents.map((doc) => (
          <div key={doc.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-4 group hover:border-brims-navy/30 transition-all">
            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-brims-navy">
              <FileText size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{doc.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{doc.size} • {doc.uploadDate}</p>
            </div>
            <div className="flex items-center gap-2">
              {doc.blobUrl && doc.blobUrl !== '#' && (
                <a href={doc.blobUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-300 hover:text-brims-navy transition-colors">
                  <Download size={18} />
                </a>
              )}
              <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {asset.documents.length === 0 && (
        <div className="text-center py-4 text-sm text-slate-400">No documents uploaded yet.</div>
      )}
    </div>
  );
}

function CostEventsTab({ assetId, asset, onRefresh }: SubProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'Other', description: '', amount: '0' });

  const handleAdd = async () => {
    setSaving(true);
    try {
      await assetsApi.addCostEvent(assetId, form);
      await onRefresh();
      setIsAdding(false);
      setForm({ date: new Date().toISOString().split('T')[0], category: 'Other', description: '', amount: '0' });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (costId: string) => {
    try {
      await assetsApi.deleteCostEvent(assetId, costId);
      await onRefresh();
    } catch (err) { console.error(err); }
  };

  const totalSpend = asset.costEvents.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Financial Cost Events</h3>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-brims-navy text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-brims-navy-dark transition-all">
            <Plus size={14} /> Add Cost Event
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                  <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                  <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="Property Tax">Property Tax</option>
                    <option value="Maintenance and Repair">Maintenance and Repair</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Insurance Premium">Insurance Premium</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (JMD)</label>
                  <input type="number" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-brims-navy" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brims-navy" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this expense for?" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="bg-brims-navy text-white px-6 py-2 rounded-md text-xs font-bold hover:bg-brims-navy-dark shadow-sm disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="pb-3">Date</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Description</th>
              <th className="pb-3 text-right">Amount</th>
              <th className="pb-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {asset.costEvents.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">No cost events recorded yet.</td></tr>
            ) : asset.costEvents.map((event) => (
              <tr key={event.id} className="group hover:bg-slate-50 transition-colors">
                <td className="py-4 text-xs font-bold text-slate-900 font-mono">{event.date}</td>
                <td className="py-4">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase">
                    {event.category}
                  </span>
                </td>
                <td className="py-4 text-sm font-medium text-slate-600">{event.description}</td>
                <td className="py-4 text-sm font-mono font-bold text-slate-900 text-right">JMD {Number(event.amount).toLocaleString()}</td>
                <td className="py-4 text-right">
                  <button onClick={() => handleDelete(event.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-6 border-t border-slate-100 flex justify-end">
        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Spend</p>
          <p className="text-2xl font-bold text-brims-navy tracking-tighter">JMD {totalSpend.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function EditAssetDrawer({ isOpen, onClose, assetId, asset, onRefresh }: { isOpen: boolean; onClose: () => void; assetId: string; asset: Asset; onRefresh: () => Promise<void> }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Asset>(asset);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setFormData(asset); }, [asset]);

  const updateField = (field: keyof Asset, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateNestedField = (parent: 'mortgage' | 'rental', field: string, value: any) => {
    setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await assetsApi.update(assetId, formData);
      await onRefresh();
      onClose();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this asset? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await assetsApi.delete(assetId);
      navigate('/dashboard');
    } catch (err) { console.error(err); setDeleting(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Edit Asset</h2>
                <p className="text-xs text-slate-500 font-medium">Update property information</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-brims-navy uppercase tracking-widest border-b border-slate-100 pb-2">Identity</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Name</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brims-navy" value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brims-navy" value={formData.type} onChange={(e) => updateField('type', e.target.value)}>
                      {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parish</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brims-navy" value={formData.parish} onChange={(e) => updateField('parish', e.target.value)}>
                      {JAMAICAN_PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lot Size</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brims-navy" value={formData.lotSize} onChange={(e) => updateField('lotSize', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Build Year</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brims-navy" value={formData.buildYear} onChange={(e) => updateField('buildYear', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-brims-navy uppercase tracking-widest border-b border-slate-100 pb-2">Status & Ownership</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brims-navy" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brims-navy" value={formData.ownerName} onChange={(e) => updateField('ownerName', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-red-100">
                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4">Danger Zone</h3>
                <button onClick={handleDelete} disabled={deleting} className="w-full px-6 py-3 border border-red-200 rounded-md text-sm font-bold text-red-600 hover:bg-red-50 transition-all disabled:opacity-60">
                  {deleting ? 'Deleting...' : 'Delete Asset Permanently'}
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-3">
              <button onClick={onClose} className="flex-1 px-6 py-3 border border-slate-200 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-brims-navy text-white px-8 py-3 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all shadow-lg shadow-brims-navy/20 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
