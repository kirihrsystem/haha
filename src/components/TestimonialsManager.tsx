import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Testimonial } from '../types';
import { DEFAULT_TESTIMONIALS } from './TestimonialsSection';
import { Plus, Edit, Trash2, X, Save, Sparkles, RefreshCw, Languages, CheckCircle2, MessageSquareQuote } from 'lucide-react';

interface Props {
  testimonials: Testimonial[];
  onUpdate: () => void;
}

export default function TestimonialsManager({ testimonials, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<'both' | 'en' | 'km'>('both');
  const [filterRow, setFilterRow] = useState<number | 'all'>('all');

  const [formData, setFormData] = useState<Partial<Testimonial>>({
    name: '',
    nameKh: '',
    title: '',
    titleKh: '',
    initial: '',
    quote: '',
    quoteKh: '',
    color: 'bg-[#EEF2FF] text-[#4F46E5]',
    row: 1
  });

  const colors = [
    'bg-[#EEF2FF] text-[#4F46E5]',
    'bg-[#ECFDF5] text-[#059669]',
    'bg-[#EFF6FF] text-[#2563EB]',
    'bg-[#FFF1F2] text-[#E11D48]',
    'bg-[#FFFBEB] text-[#D97706]',
    'bg-[#FAF5FF] text-[#9333EA]',
    'bg-[#F0FDFA] text-[#0D9488]',
    'bg-[#F0F9FF] text-[#0284C7]',
    'bg-[#FDF2F8] text-[#DB2777]',
    'bg-[#FFF7ED] text-[#EA580C]'
  ];

  const handleSeedDefaults = async () => {
    if (testimonials.length > 0) {
      const confirm = window.confirm(
        `You currently have ${testimonials.length} testimonial(s). Would you like to import all 10 curated English & Khmer default testimonials into the database?`
      );
      if (!confirm) return;
    }

    try {
      setIsSeeding(true);
      const batch = writeBatch(db);
      const colRef = collection(db, 'testimonials');

      for (const item of DEFAULT_TESTIMONIALS) {
        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          name: item.name,
          nameKh: item.nameKh || '',
          title: item.title,
          titleKh: item.titleKh || '',
          initial: item.initial || item.name.charAt(0).toUpperCase(),
          quote: item.quote,
          quoteKh: item.quoteKh || '',
          color: item.color,
          row: item.row,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      setSeedSuccessMessage("Successfully imported 10 bilingual English & Khmer testimonials to database!");
      setTimeout(() => setSeedSuccessMessage(null), 5000);
      onUpdate();
    } catch (error) {
      console.error("Error seeding default testimonials:", error);
      alert("Failed to seed default testimonials. Check permissions.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.quote?.trim()) {
      alert("Please provide at least a name and quote.");
      return;
    }

    try {
      const cleanData = {
        name: formData.name.trim(),
        nameKh: formData.nameKh?.trim() || '',
        title: formData.title?.trim() || '',
        titleKh: formData.titleKh?.trim() || '',
        initial: formData.initial?.trim() || formData.name.trim().charAt(0).toUpperCase(),
        quote: formData.quote.trim(),
        quoteKh: formData.quoteKh?.trim() || '',
        color: formData.color || colors[0],
        row: formData.row || 1,
        updatedAt: new Date().toISOString()
      };

      if (isEditing) {
        await updateDoc(doc(db, 'testimonials', isEditing), cleanData);
      } else {
        await addDoc(collection(db, 'testimonials'), {
          ...cleanData,
          createdAt: new Date().toISOString()
        });
      }

      setIsEditing(null);
      setIsAdding(false);
      setFormData({
        name: '',
        nameKh: '',
        title: '',
        titleKh: '',
        initial: '',
        quote: '',
        quoteKh: '',
        color: colors[0],
        row: 1
      });
      onUpdate();
    } catch (error) {
      console.error("Error saving testimonial:", error);
      alert("Failed to save testimonial.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the testimonial for "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
      onUpdate();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      alert("Failed to delete testimonial.");
    }
  };

  const filteredTestimonials = testimonials.filter(t => {
    if (filterRow === 'all') return true;
    return t.row === filterRow;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customer Testimonials & Reviews</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage English & Khmer client reviews displayed in the marquee on the landing page ({testimonials.length} total).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors text-xs font-semibold disabled:opacity-50"
            title="Import all 10 curated English & Khmer reviews into Firestore"
          >
            {isSeeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
            <span>{isSeeding ? 'Importing...' : 'Seed Default Reviews (EN + KH)'}</span>
          </button>

          <button
            onClick={() => {
              setIsAdding(true);
              setIsEditing(null);
              setFormData({
                name: '',
                nameKh: '',
                title: '',
                titleKh: '',
                initial: '',
                quote: '',
                quoteKh: '',
                color: colors[0],
                row: 1
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {seedSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{seedSuccessMessage}</span>
        </div>
      )}

      {/* Filter / View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Filter Row:</span>
          <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFilterRow('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                filterRow === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              All ({testimonials.length})
            </button>
            <button
              onClick={() => setFilterRow(1)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                filterRow === 1
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Row 1 ({testimonials.filter(t => t.row === 1).length})
            </button>
            <button
              onClick={() => setFilterRow(2)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                filterRow === 2
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Row 2 ({testimonials.filter(t => t.row === 2).length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Display Preview:</span>
          <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPreviewLang('both')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                previewLang === 'both'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Dual (EN + KH)
            </button>
            <button
              onClick={() => setPreviewLang('en')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                previewLang === 'en'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPreviewLang('km')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                previewLang === 'km'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              ភាសាខ្មែរ (Khmer)
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Modal/Card */}
      {(isAdding || isEditing) && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-900/50 shadow-md space-y-6 animate-fade-in">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {isEditing ? 'Edit Testimonial' : 'Create New Testimonial'}
              </h3>
            </div>
            <button 
              type="button" 
              onClick={() => { setIsAdding(false); setIsEditing(null); }} 
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* English Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Full Name (English) *
              </label>
              <input 
                required
                value={formData.name || ''}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({
                    ...formData, 
                    name: val, 
                    initial: val.trim() ? val.trim().charAt(0).toUpperCase() : ''
                  });
                }}
                className="w-full px-3.5 py-2.5 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                placeholder="e.g. Sokha Chen"
              />
            </div>

            {/* Khmer Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                ឈ្មោះពេញ (ភាសាខ្មែរ / Khmer)
              </label>
              <input 
                value={formData.nameKh || ''}
                onChange={e => setFormData({...formData, nameKh: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-['Kantumruy_Pro',sans-serif]" 
                placeholder="ឧ. ចិន សុខា"
              />
            </div>

            {/* English Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Job Title / Company (English)
              </label>
              <input 
                value={formData.title || ''}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                placeholder="e.g. HR Director at Acleda Tech"
              />
            </div>

            {/* Khmer Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                តួនាទី / ក្រុមហ៊ុន (ភាសាខ្មែរ / Khmer)
              </label>
              <input 
                value={formData.titleKh || ''}
                onChange={e => setFormData({...formData, titleKh: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-['Kantumruy_Pro',sans-serif]" 
                placeholder="ឧ. ប្រធានផ្នែកធនធានមនុស្ស"
              />
            </div>

            {/* English Quote */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Review Quote (English) *
              </label>
              <textarea 
                required
                value={formData.quote || ''}
                onChange={e => setFormData({...formData, quote: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none min-h-[90px]" 
                placeholder="Write the client's endorsement in English..."
              />
            </div>

            {/* Khmer Quote */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                មតិយោបល់ / ការវាយតម្លៃ (ភាសាខ្មែរ / Khmer)
              </label>
              <textarea 
                value={formData.quoteKh || ''}
                onChange={e => setFormData({...formData, quoteKh: e.target.value})}
                className="w-full px-3.5 py-2.5 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none min-h-[90px] font-['Kantumruy_Pro',sans-serif]" 
                placeholder="សរសេរបទពិសោធន៍ ឬការវាយតម្លៃជាភាសាខ្មែរ..."
              />
            </div>

            {/* Row Placement */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Marquee Row Placement
              </label>
              <select 
                value={formData.row || 1}
                onChange={e => setFormData({...formData, row: parseInt(e.target.value)})}
                className="w-full px-3.5 py-2.5 text-sm border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value={1}>Row 1 (Top Scroll - Left)</option>
                <option value={2}>Row 2 (Bottom Scroll - Right)</option>
              </select>
            </div>

            {/* Avatar Color Theme */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Avatar Initial & Color Style
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {colors.map((color, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${color} ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {formData.initial || 'A'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setIsEditing(null); }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-xs font-semibold shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Review' : 'Save Review'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid of Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTestimonials.map(t => {
          const hasKhmer = Boolean(t.nameKh || t.quoteKh);

          return (
            <div 
              key={t.id} 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header with Initial & Meta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${t.color || 'bg-indigo-50 text-indigo-600'}`}>
                      {previewLang === 'km' && t.nameKh ? t.nameKh.charAt(0) : (t.initial || t.name.charAt(0))}
                    </div>
                    <div>
                      {/* Name display based on preview */}
                      {(previewLang === 'both' || previewLang === 'en') && (
                        <div className="font-semibold text-sm leading-tight text-slate-900 dark:text-white">
                          {t.name}
                        </div>
                      )}
                      {(previewLang === 'both' || previewLang === 'km') && t.nameKh && (
                        <div className="font-medium text-xs leading-tight text-indigo-600 dark:text-indigo-400 font-['Kantumruy_Pro',sans-serif] mt-0.5">
                          {t.nameKh}
                        </div>
                      )}
                      <div className="text-slate-500 text-[11px] mt-1">
                        {t.title || 'Client'} {t.titleKh ? `• ${t.titleKh}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Row {t.row}
                    </span>
                    {hasKhmer ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        EN + KH
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400">
                        EN only
                      </span>
                    )}
                  </div>
                </div>

                {/* Quotes */}
                <div className="space-y-2.5 pt-1">
                  {(previewLang === 'both' || previewLang === 'en') && (
                    <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed italic bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl">
                      "{t.quote}"
                    </div>
                  )}

                  {(previewLang === 'both' || previewLang === 'km') && (
                    <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed italic bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-xl font-['Kantumruy_Pro',sans-serif]">
                      "{t.quoteKh || t.quote}"
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400">
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Curated'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setFormData(t);
                      setIsEditing(t.id!);
                      setIsAdding(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
                    title="Edit review"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(t.id!, t.name)}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
                    title="Delete review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTestimonials.length === 0 && !isAdding && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <MessageSquareQuote className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No testimonials found in database</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Click below to instantly populate your Super Admin dashboard and landing page with the 10 curated English and Khmer testimonials.
              </p>
            </div>
            <button
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-xs font-semibold transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Import Default Reviews Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
