import React from 'react';
import { 
  Printer, 
  Download, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Home, 
  Building2, 
  MapPin, 
  PieChart,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PortfolioReport() {
  const generatedDate = new Date().toLocaleDateString('en-JM', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const summary = {
    totalAssets: 12,
    combinedMarketValue: 'JMD 1,240,000,000',
    combinedPurchasePrice: 'JMD 980,000,000',
    unrealizedGain: 'JMD 260,000,000 (26.5%)'
  };

  const assets = [
    { name: 'Ocean View Villa', type: 'Residential', value: 'JMD 125M', purchase: 'JMD 95M', gain: '+31%' },
    { name: 'Kingston Heights', type: 'Commercial', value: 'JMD 350M', purchase: 'JMD 280M', gain: '+25%' },
    { name: 'Montego Bay Apt', type: 'Residential', value: 'JMD 45M', purchase: 'JMD 38M', gain: '+18%' },
    { name: 'Ocho Rios Plaza', type: 'Commercial', value: 'JMD 210M', purchase: 'JMD 160M', gain: '+31%' },
    { name: 'Spanish Town Ind.', type: 'Industrial', value: 'JMD 180M', purchase: 'JMD 150M', gain: '+20%' },
  ];

  const mortgages = [
    { asset: 'Ocean View Villa', lender: 'NCB', balance: 'JMD 45M', rate: '7.5%', payment: 'JMD 380K' },
    { asset: 'Kingston Heights', lender: 'Scotiabank', balance: 'JMD 180M', rate: '8.2%', payment: 'JMD 1.2M' },
    { asset: 'Ocho Rios Plaza', lender: 'Sagicor', balance: 'JMD 95M', rate: '7.9%', payment: 'JMD 750K' },
  ];

  const rentalIncome = [
    { asset: 'Ocean View Villa', monthly: 'JMD 450K', annual: 'JMD 5.4M', yield: '4.3%' },
    { asset: 'Kingston Heights', monthly: 'JMD 1.8M', annual: 'JMD 21.6M', yield: '6.2%' },
    { asset: 'Montego Bay Apt', monthly: 'JMD 180K', annual: 'JMD 2.1M', yield: '4.8%' },
  ];

  const costCategories = [
    { name: 'Maintenance & Repair', amount: 'JMD 2.4M', percentage: 45 },
    { name: 'Property Tax', amount: 'JMD 1.2M', percentage: 22 },
    { name: 'Insurance Premium', amount: 'JMD 0.8M', percentage: 15 },
    { name: 'Renovation', amount: 'JMD 0.6M', percentage: 11 },
    { name: 'Other', amount: 'JMD 0.4M', percentage: 7 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 print:p-0 print:space-y-8">
      {/* Print Controls */}
      <div className="flex justify-end gap-3 print:hidden">
        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
          <Download size={18} />
          Export PDF
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-brims-navy text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all shadow-lg shadow-brims-navy/20"
        >
          <Printer size={18} />
          Print Report
        </button>
      </div>

      {/* Report Header */}
      <div className="flex justify-between items-start border-b-4 border-brims-navy pb-8 print:pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brims-amber rounded-sm flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-brims-navy" />
              <span className="text-white font-bold text-xl z-10">B</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-brims-navy">BRIMS</h1>
          </div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Portfolio Performance Report</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Confidential Financial Statement</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated On</p>
          <p className="text-sm font-bold text-slate-900">{generatedDate}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Report Period</p>
          <p className="text-sm font-bold text-slate-900">FY 2025 - 2026 YTD</p>
        </div>
      </div>

      {/* Portfolio Summary */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Portfolio Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
            <p className="text-xl font-bold text-slate-900">{summary.totalAssets}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Combined Market Value</p>
            <p className="text-xl font-bold text-emerald-600">{summary.combinedMarketValue}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Combined Purchase Price</p>
            <p className="text-xl font-bold text-slate-900">{summary.combinedPurchasePrice}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unrealized Gain</p>
            <p className="text-xl font-bold text-emerald-600">{summary.unrealizedGain}</p>
          </div>
        </div>
      </section>

      {/* Asset Register */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Asset Register</h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Asset Name</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Type</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Market Value</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Purchase Price</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Gain/Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((asset, i) => (
                <tr key={i} className="text-sm">
                  <td className="px-6 py-3 font-bold text-slate-900">{asset.name}</td>
                  <td className="px-6 py-3 text-slate-600">{asset.type}</td>
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">{asset.value}</td>
                  <td className="px-6 py-3 font-mono text-slate-600">{asset.purchase}</td>
                  <td className="px-6 py-3 font-bold text-emerald-600">{asset.gain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mortgage Summary */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Mortgage Summary</h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Asset</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Lender</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Balance</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Rate</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Monthly Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mortgages.map((m, i) => (
                <tr key={i} className="text-sm">
                  <td className="px-6 py-3 font-bold text-slate-900">{m.asset}</td>
                  <td className="px-6 py-3 text-slate-600">{m.lender}</td>
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">{m.balance}</td>
                  <td className="px-6 py-3 font-mono text-slate-600">{m.rate}</td>
                  <td className="px-6 py-3 font-mono font-bold text-red-600">{m.payment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 print:gap-8">
        {/* Rental Income Summary */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Rental Income Summary</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Asset</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Monthly</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rentalIncome.map((r, i) => (
                  <tr key={i} className="text-sm">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.asset}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{r.monthly}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{r.yield}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cost Events Breakdown */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-l-4 border-brims-amber pl-3">Cost Events YTD</h3>
          <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
            {costCategories.map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-600">{cat.name}</span>
                  <span className="text-slate-900">{cat.amount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brims-navy rounded-full" 
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="pt-12 border-t border-slate-200 flex justify-between items-center print:pt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          &copy; 2026 Bold Realty Investment and Management Services. All Rights Reserved.
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Page 1 of 1
        </p>
      </footer>

      {/* Print CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          aside, header, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .max-w-5xl {
            max-width: 100% !important;
          }
          section {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
