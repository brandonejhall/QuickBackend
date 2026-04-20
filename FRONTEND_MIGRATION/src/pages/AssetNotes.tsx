import React, { useState } from 'react';
import { 
  FileText, 
  Paperclip, 
  Plus, 
  Search, 
  Calendar, 
  Building2, 
  Upload, 
  X, 
  CheckCircle2,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Note {
  id: string;
  title: string;
  assetName: string;
  date: string;
  excerpt: string;
  hasAttachment: boolean;
}

const mockNotes: Note[] = [
  { id: '1', title: 'Q1 Maintenance Review', assetName: 'Ocean View Villa', date: '2026-03-15', excerpt: 'Reviewed all plumbing and electrical systems. Minor repairs needed in the guest wing.', hasAttachment: true },
  { id: '2', title: 'Tenant Renewal Discussion', assetName: 'Kingston Heights', date: '2026-03-12', excerpt: 'Met with the main commercial tenant. They are interested in a 5-year extension.', hasAttachment: false },
  { id: '3', title: 'Renovation Progress Update', assetName: 'Ocho Rios Plaza', date: '2026-03-10', excerpt: 'Phase 2 of the facade renovation is 80% complete. Expected completion by end of month.', hasAttachment: true },
  { id: '4', title: 'Tax Assessment Appeal', assetName: 'Montego Bay Apt', date: '2026-03-05', excerpt: 'Filed the appeal for the 2025 property tax assessment. Hearing scheduled for next month.', hasAttachment: true },
  { id: '5', title: 'Insurance Policy Review', assetName: 'Negril Beachfront', date: '2026-02-28', excerpt: 'Updated the policy to include flood coverage. Premium increased by 12%.', hasAttachment: false },
];

export default function AssetNotes() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(mockNotes[0].id);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="h-[calc(100vh-160px)] flex gap-8">
      {/* Left Side - Scrollable List */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search notes..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-brims-navy focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {mockNotes.map((note, idx) => (
            <motion.div 
              key={note.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedNoteId(note.id)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden",
                selectedNoteId === note.id 
                  ? "bg-white border-brims-navy shadow-md ring-1 ring-brims-navy" 
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
              )}
            >
              {selectedNoteId === note.id && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brims-navy" />
              )}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold text-slate-900 truncate pr-4">{note.title}</h3>
                {note.hasAttachment && <Paperclip size={14} className="text-slate-400 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-brims-navy uppercase tracking-widest mb-2">
                <Building2 size={12} />
                <span className="truncate">{note.assetName}</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{note.excerpt}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Calendar size={12} />
                {note.date}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Side - Create/Edit Form */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brims-navy text-white rounded-lg">
              <FileText size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {selectedNoteId ? 'Edit Asset Note' : 'Create New Asset Note'}
            </h2>
          </div>
          <button className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <X size={14} />
            Cancel
          </button>
        </div>

        <form className="flex-1 overflow-y-auto p-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Note Title</label>
              <input 
                type="text" 
                placeholder="e.g. Q1 Maintenance Review" 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-brims-navy focus:border-transparent outline-none transition-all"
                defaultValue={selectedNoteId ? mockNotes.find(n => n.id === selectedNoteId)?.title : ''}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Linked Asset</label>
              <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-brims-navy focus:border-transparent outline-none transition-all appearance-none">
                <option>Ocean View Villa</option>
                <option>Kingston Heights</option>
                <option>Montego Bay Apt</option>
                <option>Ocho Rios Plaza</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Note Content</label>
            <textarea 
              rows={6} 
              placeholder="Describe the details of this note..." 
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-brims-navy focus:border-transparent outline-none transition-all resize-none"
              defaultValue={selectedNoteId ? mockNotes.find(n => n.id === selectedNoteId)?.excerpt : ''}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Attachments</label>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
                isDragging ? "border-brims-navy bg-brims-navy/5" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className="p-4 bg-slate-100 rounded-full mb-4 text-slate-400 group-hover:bg-brims-navy group-hover:text-white transition-colors">
                <Upload size={32} />
              </div>
              <p className="text-sm font-bold text-slate-900">Click or drag file to upload</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">PDF, DOCX, JPG up to 10MB</p>
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full bg-brims-navy text-white py-4 rounded-md text-sm font-bold hover:bg-brims-navy-dark transition-all shadow-xl shadow-brims-navy/20 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} />
              <span>{selectedNoteId ? 'Update Asset Note' : 'Create Asset Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
