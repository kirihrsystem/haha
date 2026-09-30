import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Globe, 
  ArrowLeft, 
  MapPin, 
  Database, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  FileText, 
  Mail, 
  MessageSquare,
  Sparkles,
  Printer
} from 'lucide-react';

export default function Privacy() {
  const [lang, setLang] = useState<'en' | 'km'>(() => {
    return (localStorage.getItem('lang') as 'en' | 'km') || 'en';
  });

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'km' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const isKm = lang === 'km';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Radial Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.12),transparent_50%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="Kiri HR Logo" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="font-display text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">Kiri HR</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link 
              to="/terms" 
              className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              {isKm ? 'លក្ខខណ្ឌនៃការប្រើប្រាស់' : 'Terms of Service'}
            </Link>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold hover:border-indigo-500/80 transition-all cursor-pointer"
            >
              <Globe size={14} className="text-indigo-400" />
              <span>{isKm ? 'ខ្មែរ' : 'EN'}</span>
            </button>

            <button 
              onClick={() => window.print()} 
              className="p-2 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer hidden sm:flex"
              title={isKm ? 'បោះពុម្ព' : 'Print'}
            >
              <Printer size={16} />
            </button>

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/20"
            >
              <ArrowLeft size={14} />
              <span>{isKm ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to Home'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Page Badge & Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
            <ShieldCheck size={14} />
            <span>{isKm ? 'គោលការណ៍ឯកជនភាព និងសុវត្ថិភាព' : 'Privacy & Security Policy'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight mb-4">
            {isKm ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy'}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {isKm 
              ? 'របៀបដែល Kiri HR ប្រមូល ប្រើប្រាស់ ការពារ និងគ្រប់គ្រងទិន្នន័យបុគ្គលិក វត្តមាន GPS និងប្រាក់បៀវត្សរ៍នៅក្នុងប្រព័ន្ធរបស់យើង។'
              : 'How Kiri HR collects, uses, protects, and manages your workforce, attendance GPS telemetry, and payroll data.'}
          </p>
          <div className="mt-4 text-xs font-mono text-slate-500">
            {isKm ? 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ ខែសីហា ឆ្នាំ២០២៦' : 'Last Updated: August 2026'}
          </div>
        </div>

        {/* Quick Tabs to toggle between Privacy and Terms */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 rounded-full bg-slate-900 border border-slate-800">
            <span className="px-5 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-sm">
              {isKm ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy'}
            </span>
            <Link 
              to="/terms"
              className="px-5 py-2 rounded-full text-slate-400 hover:text-white text-xs font-bold transition-colors"
            >
              {isKm ? 'លក្ខខណ្ឌនៃការប្រើប្រាស់' : 'Terms of Service'}
            </Link>
          </div>
        </div>

        {/* Summary Feature Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Lock size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isKm ? 'ការកូដនីយកម្មកម្រិតធនាគារ' : 'Bank-Grade Encryption'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isKm
                ? 'ទិន្នន័យទាំងអស់ត្រូវបានការពារដោយ TLS 1.3 ក្នុងពេលធ្វើដំណើរ និងការកូដនីយកម្ម AES-256 ពេលរក្សាទុកក្នុង Cloud។'
                : 'All workforce data is secured with TLS 1.3 transit encryption and AES-256 cloud storage encryption.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <MapPin size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isKm ? 'ការគ្រប់គ្រង GPS មានកម្រិត' : 'Geofencing Telemetry'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isKm
                ? 'កូអរដោនេ GPS ត្រូវបានប្រើប្រាស់តែមួយភ្លែតក្នុងពេលចុះវត្តមាន។ យើងមិនតាមដានទីតាំងបុគ្គលិកជាប់ជាប្រចាំឡើយ។'
                : 'GPS coordinates are verified strictly at the moment of clock-in. We never perform continuous background tracking.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <Database size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isKm ? 'ការបំបែកទិន្នន័យដោយឡែក' : 'Workspace Data Isolation'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isKm
                ? 'ក្រុមហ៊ុននីមួយៗមានទិន្នន័យដាច់ដោយឡែកពីគ្នា មិនមានការចែករំលែក ឬលក់ទិន្នន័យទៅឱ្យភាគីខាងក្រៅឡើយ។'
                : 'Every workspace database is structurally isolated. We strictly do not sell or share employee datasets.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <CreditCard size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isKm ? 'សុវត្ថិភាព KHQR & Telegram' : 'KHQR & Telegram Security'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isKm
                ? 'រូបភាព KHQR សម្រាប់ការបើកប្រាក់ខែ និងការប្រកាស Telegram Bot ត្រូវបានដំណើរការដោយសុវត្ថិភាពខ្ពស់បំផុត។'
                : 'Payroll KHQR codes and Telegram alert bots process strictly authorization-gated notifications.'}
            </p>
          </div>
        </div>

        {/* Policy Detail Sections */}
        <div className="space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 sm:p-10">
          
          {/* Section 1 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">1</span>
              {isKm ? 'ការណែនាំ និងវិសាលភាព' : '1. Introduction & Overview'}
            </h2>
            <p className="mb-3">
              {isKm
                ? 'Kiri HR ("យើងខ្ញុំ", "ប្រព័ន្ធរបស់យើង") ត្រូវបានប្តេជ្ញាចិត្តក្នុងការពារឯកជនភាព និងសុវត្ថិភាពនៃព័ត៌មានផ្ទាល់ខ្លួន និងទិន្នន័យការងាររបស់ក្រុមហ៊ុន បុគ្គលិក និងអ្នកគ្រប់គ្រងទាំងអស់ដែលប្រើប្រាស់ប្រព័ន្ធគ្រប់គ្រងកន្លែងធ្វើការរបស់យើង។'
                : 'Kiri HR ("we", "our", "us") is dedicated to safeguarding the privacy, confidentiality, and security of all enterprise, administrator, and employee data processed through our workspace management platform.'}
            </p>
            <p>
              {isKm
                ? 'គោលការណ៍ឯកជនភាពនេះពន្យល់អំពីប្រភេទទិន្នន័យដែលយើងប្រមូល របៀបដែលយើងប្រើប្រាស់ទិន្នន័យទាំងនោះ និងវិធានការសុវត្ថិភាពដែលយើងអនុវត្តដើម្បីធានាថាទិន្នន័យរបស់អ្នកទទួលបានការការពារកម្រិតខ្ពស់បំផុត។'
                : 'This Privacy Policy details how we collect, handle, store, and protect your information when you register a workspace, clock in/out, process payroll, or use our mobile and web applications.'}
            </p>
          </section>

          {/* Section 2 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">2</span>
              {isKm ? 'ទិន្នន័យដែលយើងប្រមូល' : '2. Information We Collect'}
            </h2>
            <p className="mb-3">
              {isKm ? 'ដើម្បីផ្តល់ជូននូវសេវាកម្មគ្រប់គ្រងវត្តមាន និងប្រាក់បៀវត្សរ៍ដ៏ត្រឹមត្រូវ យើងប្រមូលទិន្នន័យដូចខាងក្រោម៖' : 'To operate our workforce, attendance, and payroll services effectively, we collect the following categories of information:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
              <li>
                <strong className="text-white">{isKm ? 'ព័ត៌មានក្រុមហ៊ុន និងអ្នកគ្រប់គ្រង' : 'Company & Admin Profile:'}</strong>{' '}
                {isKm ? 'ឈ្មោះក្រុមហ៊ុន អ៊ីមែលអ្នកគ្រប់គ្រង ឡូហ្កូក្រុមហ៊ុន និងការកំណត់រចនាសម្ព័ន្ធកន្លែងធ្វើការ។' : 'Workspace name, admin email, custom company logo, exchange rates, and system settings.'}
              </li>
              <li>
                <strong className="text-white">{isKm ? 'ព័ត៌មានបុគ្គលិក' : 'Employee Details:'}</strong>{' '}
                {isKm ? 'ឈ្មោះបុគ្គលិក (ជាភាសាអង់គ្លេស និងខ្មែរ) លេខទូរស័ព្ទ អាសយដ្ឋាន រូបថតគណនី និងរូបថតអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ (សម្រាប់ការផ្ទៀងផ្ទាត់)។' : 'Full name, phone number, address, profile avatar, and ID card photo (for identity verification).'}
              </li>
              <li>
                <strong className="text-white">{isKm ? 'ទិន្នន័យវត្តមាន និងទីតាំង GPS (Geofencing)' : 'Attendance & Geofencing GPS Telemetry:'}</strong>{' '}
                {isKm ? 'ម៉ោងចុះវត្តមានចូល/ចេញ និងកូអរដោនេ GPS ក្នុងខណៈពេលដែលចុះវត្តមាន ដើម្បីផ្ទៀងផ្ទាត់ថាតើបុគ្គលិកស្ថិតនៅក្នុងកាំការិយាល័យដែលបានកំណត់ឬទេ' : 'Clock-in/out timestamps, break durations, and real-time GPS coordinates captured strictly at the instant of check-in.'}
              </li>
              <li>
                <strong className="text-white">{isKm ? 'ព័ត៌មានប្រាក់បៀវត្សរ៍ និង KHQR' : 'Payroll & KHQR Payment QR:'}</strong>{' '}
                {isKm ? 'ប្រាក់ខែមូលដ្ឋាន ប្រាក់បន្ថែមម៉ោង ការកាត់ប្រាក់ រូបភាព KHQR ធនាគារសម្រាប់ការវេរប្រាក់ខែ និងកំណត់ត្រាប្រាក់បៀវត្សរ៍។' : 'Base salary, overtime hours, deductions, bonuses, and uploaded bank KHQR images for direct payroll deposits.'}
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">3</span>
              {isKm ? 'របៀបដែលយើងប្រើប្រាស់ទិន្នន័យរបស់អ្នក' : '3. How We Use Your Information'}
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 mt-1 shrink-0" />
                <p>{isKm ? 'ផ្ទៀងផ្ទាត់វត្តមានធ្វើការរបស់បុគ្គលិកតាមរយៈប្រព័ន្ធ Geofencing ឱ្យបានត្រឹមត្រូវ និងមានតម្លាភាព។' : 'Verify employee presence within designated office coordinates via Geofencing telemetry.'}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 mt-1 shrink-0" />
                <p>{isKm ? 'គណនាម៉ោងធ្វើការ ម៉ោងបន្ថែម (OT) និងការកាត់ប្រាក់យឺតដោយស្វ័យប្រវត្តិសម្រាប់ការទូទាត់ប្រាក់បៀវត្សរ៍។' : 'Automatically calculate working hours, overtime, and late deductions for error-free payroll reports.'}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 mt-1 shrink-0" />
                <p>{isKm ? 'ផ្ញើការជូនដំណឹងភ្លាមៗទៅកាន់ក្រុម Telegram របស់អ្នកគ្រប់គ្រងសម្រាប់ការចុះវត្តមាន និងការស្នើសុំច្បាប់។' : 'Dispatch instant status alerts to workspace Telegram channels upon attendance events or leave requests.'}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 mt-1 shrink-0" />
                <p>{isKm ? 'ធានាសុវត្ថិភាពប្រព័ន្ធ បង្ការការក្លែងបន្លំ និងកែលម្អបទពិសោធន៍ប្រើប្រាស់ឲ្យកាន់តែរលូន។' : 'Protect system integrity, prevent attendance fraud, and deliver seamless workspace customization.'}</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">4</span>
              {isKm ? 'គោលការណ៍ទីតាំង GPS (Geofencing Privacy)' : '4. Geofencing GPS & Location Privacy'}
            </h2>
            <p className="mb-3">
              {isKm
                ? 'យើងខ្ញុំយល់ច្បាស់អំពីសារៈសំខាន់នៃឯកជនភាពទីតាំងរបស់បុគ្គលិក។ Kiri HR មិនធ្វើការតាមដានទីតាំង GPS របស់បុគ្គលិកជាប់ជាប្រចាំ ឬនៅក្រៅម៉ោងធ្វើការឡើយ។'
                : 'We deeply respect location privacy. Kiri HR does NOT track or monitor employee coordinates continuously or outside of active check-in events.'}
            </p>
            <p>
              {isKm
                ? 'ទីតាំង GPS ត្រូវបានស្នើសុំតែក្នុងខណៈពេលដែលបុគ្គលិកចុចប៊ូតុង "ចុះវត្តមានចូល" ឬ "ចេញ" ប៉ុណ្ណោះ ដើម្បីផ្ទៀងផ្ទាត់ថាបុគ្គលិកស្ថិតនៅក្នុងកាំទីតាំងដែលអ្នកគ្រប់គ្រងបានកំណត់ (ឧទាហរណ៍ 100 ម៉ែត្រជុំវិញការិយាល័យ)។'
                : 'Geolocation is queried purely on-demand when an employee initiates a check-in or check-out action to evaluate distance against the workspace’s allowed radius.'}
            </p>
          </section>

          {/* Section 5 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">5</span>
              {isKm ? 'ការការពារ និងរក្សាទុកទិន្នន័យ' : '5. Data Security & Storage Isolation'}
            </h2>
            <p className="mb-3">
              {isKm
                ? 'ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុកនៅលើហេដ្ឋារចនាសម្ព័ន្ធ Cloud ប្រកបដោយសុវត្ថិភាពខ្ពស់ ដែលមានការបំបែកទិន្នន័យដាច់ដោយឡែករវាងក្រុមហ៊ុននីមួយៗ (Structural Database Isolation)។'
                : 'All database entries are securely hosted on Google Cloud Firebase infrastructure with strict rules-based authorization and structural multi-tenant isolation.'}
            </p>
            <p>
              {isKm
                ? 'យើងខ្ញុំមិនដែលលក់ ជួល ឬចែករំលែកទិន្នន័យបុគ្គលិក ឬក្រុមហ៊ុនរបស់អ្នកទៅឱ្យភាគីទីបីក្នុងគោលបំណងពាណិជ្ជកម្ម ឬផ្សព្វផ្សាយពាណិជ្ជកម្មឡើយ។'
                : 'We strictly never sell, rent, or monetize your company or employee records with external advertisers or third-party data brokers.'}
            </p>
          </section>

          {/* Section 6 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">6</span>
              {isKm ? 'សិទ្ធិរបស់អ្នក និងការគ្រប់គ្រងទិន្នន័យ' : '6. Your Rights & Data Retention'}
            </h2>
            <p className="mb-3">
              {isKm ? 'ក្នុងនាមជាម្ចាស់ក្រុមហ៊ុន ឬអ្នកប្រើប្រាស់ អ្នកមានសិទ្ធិដូចខាងក្រោម៖' : 'As a workspace administrator or employee user, you retain clear rights regarding your data:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
              <li>{isKm ? 'ពិនិត្យ កែប្រែ ឬបច្ចុប្បន្នភាពព័ត៌មានគណនី និងប្រវត្តិរូបរូបថតបានគ្រប់ពេលវេលា។' : 'Access, edit, or update profile information and employee details at any time.'}</li>
              <li>{isKm ? 'ស្នើសុំទាញយករបាយការណ៍វត្តមាន និងប្រាក់បៀវត្សរ៍ជាទម្រង់ PDF/Excel។' : 'Export attendance and payroll historical statements in standardized formats.'}</li>
              <li>{isKm ? 'ស្នើសុំលុបទិន្នន័យគណនី ឬលុបកន្លែងធ្វើការទាំងមូល (Factory Reset) ដោយអ្នកគ្រប់គ្រង។' : 'Request complete deletion of individual accounts or perform workspace factory data wipes.'}</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">7</span>
              {isKm ? 'ទំនាក់ទំនងផ្នែកឯកជនភាព' : '7. Contact Us Regarding Privacy'}
            </h2>
            <p className="mb-4">
              {isKm
                ? 'ប្រសិនបើអ្នកមានសំណួរ ការបារម្ភ ឬសំណើផ្សេងៗពាក់ព័ន្ធនឹងគោលការណ៍ឯកជនភាពនេះ សូមទាក់ទងមកកាន់ក្រុមការងារ Kiri HR ដោយផ្ទាល់៖'
                : 'If you have questions, concerns, or requests concerning this Privacy Policy, please reach out to the Kiri HR privacy team:'}
            </p>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Mail size={16} className="text-indigo-400" />
                <span>kirihrsystem@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MessageSquare size={16} className="text-indigo-400" />
                <span>Telegram: @Udomkevin</span>
              </div>
            </div>
          </section>

        </div>

        {/* Bottom Banner */}
        <div className="mt-12 text-center p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/20 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-2">
            {isKm ? 'មានសំណួរពាក់ព័ន្ធនឹងលក្ខខណ្ឌនៃការប្រើប្រាស់មែនទេ?' : 'Looking for Terms of Service?'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-4 max-w-xl mx-auto">
            {isKm 
              ? 'អានលក្ខខណ្ឌនៃការប្រើប្រាស់ដើម្បីយល់ដឹងពីកិច្ចព្រមព្រៀង សិទ្ធិប្រើប្រាស់ និងកាតព្វកិច្ចកន្លែងធ្វើការ។'
              : 'Review our Terms of Service to understand the agreement governing workspace accounts and subscriptions.'}
          </p>
          <Link
            to="/terms"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-indigo-500/25"
          >
            <span>{isKm ? 'មើលលក្ខខណ្ឌនៃការប្រើប្រាស់' : 'View Terms of Service'}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
