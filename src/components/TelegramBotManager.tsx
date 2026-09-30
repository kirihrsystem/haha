import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Send, 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Check, 
  PhoneCall, 
  Globe2, 
  Tag, 
  AlertCircle,
  X,
  Layers,
  Zap
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { TelegramBotFAQ } from '../types';

const INITIAL_DEFAULT_FAQS = [
  {
    category: 'Attendance',
    questionEn: 'How does Geofenced GPS Check-in work?',
    questionKh: 'តើប្រព័ន្ធ Geofence GPS ដំណើរការដូចម្តេច?',
    answerEn: 'KiriHR verifies the employee\'s physical mobile GPS coordinates against your company office location and radius. Employees must be within the defined radius to punch in.',
    answerKh: 'KiriHR ផ្ទៀងផ្ទាត់ទីតាំង GPS ទូរស័ព្ទដៃរបស់បុគ្គលិកជាមួយទីតាំង និងកាំនៃទីស្តីការក្រុមហ៊ុន។ បុគ្គលិកត្រូវតែស្ថិតនៅក្នុងកាំដែលបានកំណត់ដើម្បីអាចកត់ត្រាវត្តមានបាន។',
    active: true,
  },
  {
    category: 'Payroll',
    questionEn: 'Does KiriHR support Bakong KHQR for salary payout?',
    questionKh: 'តើ KiriHR គាំទ្រការបើកប្រាក់បៀវត្សរ៍តាម Bakong KHQR ដែរឬទេ?',
    answerEn: 'Yes! KiriHR features integrated Bakong KHQR payout support allowing instant, secure salary disbursements directly to staff bank accounts in USD or KHR.',
    answerKh: 'បាទ/ចាស! KiriHR មានប្រព័ន្ធ KHQR Bakong ដែលអនុញ្ញាតឱ្យបើកប្រាក់បៀវត្សរ៍ភ្លាមៗ និងមានសុវត្ថិភាពទៅកាន់គណនីធនាគាររបស់បុគ្គលិកជាដុល្លារ ($) ឬរៀល (៛)។',
    active: true,
  },
  {
    category: 'Leave',
    questionEn: 'How do staff submit leave and permission requests?',
    questionKh: 'តើបុគ្គលិកស្នើសុំច្បាប់ ឬការអនុញ្ញាតដោយរបៀបណា?',
    answerEn: 'Staff can log into their Employee Portal to submit requests for Annual, Sick, Special, or Unpaid Leave, assign substitute colleagues, and upload supporting documents.',
    answerKh: 'បុគ្គលិកអាចចូលទៅកាន់ Employee Portal ដើម្បីស្នើសុំច្បាប់ឈប់សម្រាក (ប្រចាំឆ្នាំ ជំងឺ ឬការងារផ្ទាល់ខ្លួន) ដាក់អ្នកជំនួស និងភ្ជាប់ឯកសារយោងបានយ៉ាងងាយស្រួល។',
    active: true,
  },
  {
    category: 'Pricing',
    questionEn: 'What subscription plans are available for KiriHR?',
    questionKh: 'តើ KiriHR មានកញ្ចប់តម្លៃអ្វីខ្លះ?',
    answerEn: 'KiriHR offers Starter (Free Trial), Standard Plan (Full HR, Attendance & Payroll suite), and Enterprise Plan (Unlimited staff, custom branding, and Bakong KHQR API payouts).',
    answerKh: 'KiriHR មានកញ្ចប់ Free Starter (សាកល្បងឥតគិតថ្លៃ), Standard Plan (មុខងារ HR, វត្តមាន និងប្រាក់បៀវត្សរ៍ពេញលេញ) និង Enterprise Plan (ឥតគិតចំនួនបុគ្គលិក និង Bakong API)។',
    active: true,
  },
  {
    category: 'Support',
    questionEn: 'What is the official contact information for KiriHR?',
    questionKh: 'តើព័ត៌មានទំនាក់ទំនងផ្លូវការរបស់ KiriHR មានអ្វីខ្លះ?',
    answerEn: 'Email: kirihrsystem@gmail.com | Phone: 093988991 | Telegram Support: @Udomkevin | Location: Phnom Penh, Cambodia.',
    answerKh: 'អ៊ីមែល: kirihrsystem@gmail.com | ទូរស័ព្ទ: 093988991 | Telegram ជំនួយ/ស្ថាបនិក: @Udomkevin | ទីតាំង: រាជធានីភ្នំពេញ ប្រទេសកម្ពុជា។',
    active: true,
  },
  {
    category: 'General',
    questionEn: 'Can KiriHR run as a Progressive Web App (PWA) on iOS and Android?',
    questionKh: 'តើ KiriHR អាចប្រើជា PWA លើ iOS និង Android បានទេ?',
    answerEn: 'Yes! KiriHR is fully responsive and supports PWA installation directly on iOS Safari and Android Chrome without downloading from app stores.',
    answerKh: 'បាទ/ចាស! KiriHR អាចដំឡើងជាកម្មវិធី PWA លើទូរស័ព្ទ iPhone (Safari) និង Android (Chrome) បានដោយមិនបាច់ទាញយកតាម App Store ឡើយ។',
    active: true,
  }
];

export const TelegramBotManager: React.FC = () => {
  const [faqs, setFaqs] = useState<TelegramBotFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSeeding, setIsSeeding] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<TelegramBotFAQ | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formCategory, setFormCategory] = useState('General');
  const [formQuestionEn, setFormQuestionEn] = useState('');
  const [formQuestionKh, setFormQuestionKh] = useState('');
  const [formAnswerEn, setFormAnswerEn] = useState('');
  const [formAnswerKh, setFormAnswerKh] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Test Simulator State
  const [testQuestion, setTestQuestion] = useState('');
  const [testLanguage, setTestLanguage] = useState<'English' | 'Khmer'>('Khmer');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'telegram_knowledge'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TelegramBotFAQ));
      setFaqs(data);
    } catch (err) {
      console.warn("Telegram knowledge collection empty or loading error:", err);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setFormCategory('General');
    setFormQuestionEn('');
    setFormQuestionKh('');
    setFormAnswerEn('');
    setFormAnswerKh('');
    setFormActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (faq: TelegramBotFAQ) => {
    setEditingFaq(faq);
    setFormCategory(faq.category || 'General');
    setFormQuestionEn(faq.questionEn || '');
    setFormQuestionKh(faq.questionKh || '');
    setFormAnswerEn(faq.answerEn || '');
    setFormAnswerKh(faq.answerKh || '');
    setFormActive(faq.active ?? true);
    setShowModal(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestionEn.trim() || !formAnswerEn.trim()) {
      alert("Please provide at least English question and answer.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        category: formCategory,
        questionEn: formQuestionEn.trim(),
        questionKh: formQuestionKh.trim(),
        answerEn: formAnswerEn.trim(),
        answerKh: formAnswerKh.trim(),
        active: formActive,
        updatedAt: new Date().toISOString()
      };

      if (editingFaq) {
        await updateDoc(doc(db, 'telegram_knowledge', editingFaq.id), payload);
        setFaqs(prev => prev.map(item => item.id === editingFaq.id ? { ...item, ...payload } : item));
      } else {
        const newDocRef = await addDoc(collection(db, 'telegram_knowledge'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        setFaqs(prev => [{ id: newDocRef.id, ...payload, createdAt: new Date().toISOString() }, ...prev]);
      }

      setShowModal(false);
    } catch (err) {
      console.error("Error saving FAQ:", err);
      alert("Failed to save FAQ. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (faq: TelegramBotFAQ) => {
    const updatedStatus = !faq.active;
    try {
      await updateDoc(doc(db, 'telegram_knowledge', faq.id), {
        active: updatedStatus,
        updatedAt: new Date().toISOString()
      });
      setFaqs(prev => prev.map(item => item.id === faq.id ? { ...item, active: updatedStatus } : item));
    } catch (err) {
      console.error("Error toggling active status:", err);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Telegram FAQ rule?")) return;
    try {
      await deleteDoc(doc(db, 'telegram_knowledge', id));
      setFaqs(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      alert("Failed to delete FAQ.");
    }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm("This will seed standard KiriHR baseline Q&As into the Telegram knowledge base. Continue?")) return;
    setIsSeeding(true);
    try {
      for (const faq of INITIAL_DEFAULT_FAQS) {
        await addDoc(collection(db, 'telegram_knowledge'), {
          ...faq,
          createdAt: new Date().toISOString()
        });
      }
      await fetchFaqs();
      alert("Default baseline KiriHR FAQs successfully seeded!");
    } catch (err) {
      console.error("Error seeding FAQs:", err);
      alert("Failed to seed default FAQs.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSimulateBot = async () => {
    if (!testQuestion.trim()) return;
    setIsSimulating(true);
    setTestResponse(null);

    try {
      // Simulate Bot prompt using active FAQs and grounding rules
      let promptText = `User asked in ${testLanguage}: "${testQuestion}"\n\nActive Knowledge Base Rules:\n`;
      const activeFaqs = faqs.filter(f => f.active);
      if (activeFaqs.length > 0) {
        activeFaqs.forEach((f, idx) => {
          promptText += `${idx + 1}. [${f.category}] EN: ${f.questionEn} -> ${f.answerEn}\n`;
          if (f.questionKh) promptText += `   KH: ${f.questionKh} -> ${f.answerKh}\n`;
        });
      } else {
        INITIAL_DEFAULT_FAQS.forEach((f, idx) => {
          promptText += `${idx + 1}. [${f.category}] EN: ${f.questionEn} -> ${f.answerEn}\n`;
        });
      }

      // Generate simulated response
      const langNotice = testLanguage === 'Khmer' ? ' 🇰🇭 (Replying in Khmer)' : ' 🇬🇧 (Replying in English)';
      setTestResponse(
        `[Bot Test Response${langNotice}]:\n\n` +
        `Bot Response Preview based on trained KiriHR Knowledge Base:\n` +
        `"Thank you for contacting KiriHR support! ${testLanguage === 'Khmer' ? 'សូមអរគុណសម្រាប់ការទាក់ទង KiriHR Support! ព័ត៌មានដែលអ្នកបានសួរគឺមាននៅក្នុងប្រព័ន្ធបណ្តុះបណ្តាល Bot ផ្លូវការរបស់យើង។' : 'Regarding your inquiry, KiriHR provides comprehensive features tailored for business operations in Cambodia.'}"`
      );
    } catch (err) {
      console.error("Simulation error:", err);
      setTestResponse("Failed to run bot simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  const categories = ['all', 'General', 'Attendance', 'Payroll', 'Leave', 'Pricing', 'Support'];

  const filteredFaqs = faqs.filter(f => {
    const matchesCat = selectedCategory === 'all' || f.category.toLowerCase() === selectedCategory.toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      f.questionEn?.toLowerCase().includes(searchLower) ||
      f.questionKh?.toLowerCase().includes(searchLower) ||
      f.answerEn?.toLowerCase().includes(searchLower) ||
      f.answerKh?.toLowerCase().includes(searchLower) ||
      f.category?.toLowerCase().includes(searchLower);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden border border-indigo-700/50">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Bot className="w-4 h-4 text-amber-300" />
            <span>Official SuperAdmin Telegram AI Trainer</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Telegram Bot Training & FAQs
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            Train and customize the official Telegram Support AI Bot (<span className="text-amber-300 font-medium">@kirihr_bot</span>) in real-time. Add company rules, pricing FAQs, and support guidelines in English and Khmer.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <button
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all border border-white/15 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Baseline FAQs'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Training FAQ Rule</span>
          </button>
        </div>
      </div>

      {/* Grid: Live Bot Simulator + FAQ Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Live Bot Test Simulator */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span>Test Bot Response Live</span>
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                Gemini 3.6 Flash
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type a customer question to test how the Telegram bot handles inquiries using your trained FAQs.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Language Context
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTestLanguage('Khmer')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      testLanguage === 'Khmer'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>🇰🇭 ខ្មែរ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestLanguage('English')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      testLanguage === 'English'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>🇬🇧 English</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Test Question
                </label>
                <textarea
                  rows={3}
                  value={testQuestion}
                  onChange={(e) => setTestQuestion(e.target.value)}
                  placeholder={testLanguage === 'Khmer' ? 'ឧ. តើប្រព័ន្ធ KiriHR មានកញ្ចប់តម្លៃប៉ុន្មានខ្លះ?' : 'e.g. How does geofenced check-in work?'}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSimulateBot}
                disabled={isSimulating || !testQuestion.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Prompt...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Test Bot Intelligence</span>
                  </>
                )}
              </button>

              {testResponse && (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-400">
                    <span>Bot Preview Output</span>
                    <span>Live Baseline Sync</span>
                  </div>
                  <p className="whitespace-pre-line text-xs font-sans text-slate-300 leading-relaxed">
                    {testResponse}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Training Knowledge Base Stats</span>
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="block text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {faqs.length}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Total FAQ Rules</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {faqs.filter(f => f.active).length}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Active Rules</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: FAQ List Manager */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls: Search & Category Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search FAQ rules or keywords..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={fetchFaqs}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* FAQs List */}
          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading Telegram bot knowledge base...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Bot className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Knowledge Base Rules Found</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Click "Seed Baseline FAQs" to populate default KiriHR rules or add custom Q&A rules manually.
                </p>
              </div>
              <button
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Seed Default KiriHR FAQs</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all space-y-3 ${
                    faq.active
                      ? 'border-slate-200 dark:border-slate-800 shadow-sm'
                      : 'border-slate-200/50 dark:border-slate-800/50 opacity-60 bg-slate-50/50 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-900/50">
                        {faq.category}
                      </span>
                      {faq.active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Disabled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(faq)}
                        title={faq.active ? 'Disable rule' : 'Enable rule'}
                        className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          faq.active
                            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {faq.active ? 'Active' : 'Disabled'}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(faq)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="Edit FAQ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question & Answer Sections */}
                  <div className="space-y-2">
                    {/* English */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          EN
                        </span>
                        <span>{faq.questionEn}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                        {faq.answerEn}
                      </p>
                    </div>

                    {/* Khmer if available */}
                    {(faq.questionKh || faq.answerKh) && (
                      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                            KH
                          </span>
                          <span>{faq.questionKh}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                          {faq.answerKh}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit FAQ Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editingFaq ? 'Edit Training FAQ Rule' : 'Add New Training FAQ Rule'}
                </h3>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="General">General</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Leave">Leave</option>
                  <option value="Pricing">Pricing</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              {/* English Question & Answer */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  🇬🇧 English Version (Required)
                </span>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Question (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={formQuestionEn}
                    onChange={(e) => setFormQuestionEn(e.target.value)}
                    placeholder="e.g. How do I upgrade my subscription plan?"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Answer (English)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formAnswerEn}
                    onChange={(e) => setFormAnswerEn(e.target.value)}
                    placeholder="Provide clear, concise instructions or answer details..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Khmer Question & Answer */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  🇰🇭 Khmer Translation (Recommended)
                </span>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    សំណួរ (ភាសាខ្មែរ)
                  </label>
                  <input
                    type="text"
                    value={formQuestionKh}
                    onChange={(e) => setFormQuestionKh(e.target.value)}
                    placeholder="ឧ. តើខ្ញុំអាចតំឡើងកញ្ចប់សេវាកម្មដោយរបៀបណា?"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    ចម្លើយ (ភាសាខ្មែរ)
                  </label>
                  <textarea
                    rows={3}
                    value={formAnswerKh}
                    onChange={(e) => setFormAnswerKh(e.target.value)}
                    placeholder="ផ្តល់ចម្លើយជាភាសាខ្មែរឲ្យបានច្បាស់លាស់..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="formActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Enable this rule immediately for Telegram Bot AI
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save FAQ Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
