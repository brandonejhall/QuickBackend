import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Home,
  User,
  Info
} from 'lucide-react';
import { Asset, AssetType, Status } from '../types';
import { assets as assetsApi } from '../lib/api';

const JAMAICAN_PARISHES = [
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary',
  'St. Ann', 'Trelawny', 'St. James', 'Hanover', 'Westmoreland',
  'St. Elizabeth', 'Manchester', 'Clarendon', 'St. Catherine'
];

const ASSET_TYPES: AssetType[] = ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed Use'];
const STATUSES: Status[] = ['Owned', 'Mortgaged', 'Tenanted', 'Vacant', 'Under Renovation', 'Listed for Sale', 'Disposed'];

export default function AssetWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    type: 'Residential',
    street: '',
    parish: 'Kingston',
    country: 'Jamaica',
    registryNumber: '',
    lotSize: '',
    lotSizeUnit: 'sq ft',
    buildYear: '',
    externalRefId: '',
    comments: '',
    status: 'Owned',
    ownerName: '',
    acquisitionDate: '',
    purchasePrice: '',
    hasMortgage: false,
    mortgage: { lender: '', balance: '', monthlyPayment: '' },
    hasRental: false,
    rental: { monthlyIncome: '', tenantName: '' },
  });

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name) newErrors.name = 'Property Name is required';
      if (!formData.street) newErrors.street = 'Street is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const handlePrev = () => setStep(s => s - 1);

  const handleFinish = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const created = await assetsApi.create(formData);
      navigate(`/assets/${created.id}`);
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail || 'Failed to save asset. Please try again.');
      setSaving(false);
    }
  };

  const updateField = (field: keyof Asset, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateNestedField = (parent: 'mortgage' | 'rental', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const steps = [
    { id: 1, label: 'Identity' },
    { id: 2, label: 'Status & Ownership' },
    { id: 3, label: 'Review' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= s.id ? 'bg-brims-navy text-white shadow-lg shadow-brims-navy/20' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {step > s.id ? <CheckCircle2 size={20} /> : s.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                step >= s.id ? 'text-brims-navy' : 'text-slate-400'
              }`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-brims-navy/5 rounded-lg text-brims-navy">
                <Home size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Property Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  Property Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy transition-all`}
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Ocean View Villa"
                />
                {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Type</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value)}
                >
                  {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  Street <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full bg-slate-50 border ${errors.street ? 'border-red-500' : 'border-slate-200'} rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy`}
                  value={formData.street}
                  onChange={(e) => updateField('street', e.target.value)}
                  placeholder="Street address"
                />
                {errors.street && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10} /> {errors.street}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parish</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                  value={formData.parish}
                  onChange={(e) => updateField('parish', e.target.value)}
                >
                  {JAMAICAN_PARISHES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Land Registry Number</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                  value={formData.registryNumber}
                  onChange={(e) => updateField('registryNumber', e.target.value)}
                  placeholder="LR-0000-0000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lot Size</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                    value={formData.lotSize}
                    onChange={(e) => updateField('lotSize', e.target.value)}
                    placeholder="Size"
                  />
                  <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                    {(['sq ft', 'sq m'] as const).map(unit => (
                      <button
                        key={unit}
                        onClick={() => updateField('lotSizeUnit', unit)}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                          formData.lotSizeUnit === unit ? 'bg-white text-brims-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Build Year</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                  value={formData.buildYear}
                  onChange={(e) => updateField('buildYear', e.target.value)}
                  placeholder="YYYY"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">External Reference ID</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                  value={formData.externalRefId}
                  onChange={(e) => updateField('externalRefId', e.target.value)}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comments</label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy resize-none"
                  value={formData.comments}
                  onChange={(e) => updateField('comments', e.target.value)}
                  placeholder="Additional notes about the property..."
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-brims-navy/5 rounded-lg text-brims-navy">
                <User size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Status & Ownership</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                  value={formData.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acquisition Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                  value={formData.acquisitionDate}
                  onChange={(e) => updateField('acquisitionDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Purchase Price (JMD)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">JMD</div>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md pl-12 pr-4 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy"
                    value={formData.purchasePrice}
                    onChange={(e) => updateField('purchasePrice', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Mortgage Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.hasMortgage ? 'bg-brims-navy text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Mortgage Details</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Track outstanding balance and payments</p>
                  </div>
                </div>
                <button
                  onClick={() => updateField('hasMortgage', !formData.hasMortgage)}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.hasMortgage ? 'bg-brims-navy' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.hasMortgage ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <AnimatePresence>
                {formData.hasMortgage && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-white border border-slate-100 rounded-lg shadow-inner">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lender Name</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy" value={formData.mortgage?.lender} onChange={(e) => updateNestedField('mortgage', 'lender', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Balance</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy" value={formData.mortgage?.balance} onChange={(e) => updateNestedField('mortgage', 'balance', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Payment</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy" value={formData.mortgage?.monthlyPayment} onChange={(e) => updateNestedField('mortgage', 'monthlyPayment', e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rental Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.hasRental ? 'bg-brims-navy text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Rental Details</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Track monthly income and tenancy</p>
                  </div>
                </div>
                <button
                  onClick={() => updateField('hasRental', !formData.hasRental)}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.hasRental ? 'bg-brims-navy' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.hasRental ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <AnimatePresence>
                {formData.hasRental && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white border border-slate-100 rounded-lg shadow-inner">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Income</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy" value={formData.rental?.monthlyIncome} onChange={(e) => updateNestedField('rental', 'monthlyIncome', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tenant Name</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brims-navy" value={formData.rental?.tenantName} onChange={(e) => updateNestedField('rental', 'tenantName', e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-12"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-brims-navy/5 rounded-lg text-brims-navy">
                <Info size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Review & Finish</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Identity</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Property Name', value: formData.name },
                    { label: 'Type', value: formData.type },
                    { label: 'Address', value: `${formData.street}, ${formData.parish}, ${formData.country}` },
                    { label: 'Registry #', value: formData.registryNumber || 'N/A' },
                    { label: 'Lot Size', value: `${formData.lotSize} ${formData.lotSizeUnit}` },
                    { label: 'Build Year', value: formData.buildYear || 'N/A' },
                    { label: 'Ref ID', value: formData.externalRefId || 'N/A' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-start border-b border-slate-50 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Status & Ownership</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Status', value: formData.status },
                    { label: 'Owner', value: formData.ownerName || 'N/A' },
                    { label: 'Acquisition Date', value: formData.acquisitionDate || 'N/A' },
                    { label: 'Purchase Price', value: formData.purchasePrice ? `JMD ${Number(formData.purchasePrice).toLocaleString()}` : 'N/A' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-start border-b border-slate-50 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900 text-right">{item.value}</span>
                    </div>
                  ))}

                  {formData.hasMortgage && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg space-y-3">
                      <p className="text-[10px] font-bold text-brims-navy uppercase tracking-widest">Mortgage Details</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Lender</span>
                        <span className="font-bold text-slate-900">{formData.mortgage?.lender}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Balance</span>
                        <span className="font-bold text-slate-900">JMD {Number(formData.mortgage?.balance).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Monthly</span>
                        <span className="font-bold text-red-600">JMD {Number(formData.mortgage?.monthlyPayment).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {formData.hasRental && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
                      <p className="text-[10px] font-bold text-brims-navy uppercase tracking-widest">Rental Details</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Monthly Income</span>
                        <span className="font-bold text-emerald-600">JMD {Number(formData.rental?.monthlyIncome).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Tenant</span>
                        <span className="font-bold text-slate-900">{formData.rental?.tenantName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {saveError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-sm font-medium text-red-700">{saveError}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={step === 1 ? () => navigate('/dashboard') : handlePrev}
          className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          disabled={saving}
        >
          <ChevronLeft size={18} />
          {step === 1 ? 'Cancel' : 'Previous'}
        </button>

        <button
          onClick={step === 3 ? handleFinish : handleNext}
          disabled={saving}
          className="flex items-center gap-2 bg-brims-navy text-white px-8 py-2.5 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all shadow-lg shadow-brims-navy/20 disabled:opacity-60"
        >
          {saving ? 'Saving...' : step === 3 ? 'Finish & Save' : 'Next Step'}
          {step !== 3 && !saving && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}
