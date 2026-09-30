import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  FileText, 
  ShieldCheck, 
  Globe, 
  ArrowLeft, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Lock, 
  Printer, 
  Mail, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';

export default function Terms() {
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
              to="/privacy" 
              className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              {isKm ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy'}
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
            <FileText size={14} />
            <span>{isKm ? 'កិច្ចព្រមព្រៀងសេវាកម្ម' : 'Terms of Service Agreement'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight mb-4">
            {isKm ? 'លក្ខខណ្ឌនៃការប្រើប្រាស់' : 'Terms of Service'}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {isKm 
              ? 'កិច្ចព្រមព្រៀងគ្រប់គ្រងការប្រើប្រាស់ប្រព័ន្ធគ្រប់គ្រងកន្លែងធ្វើការ Kiri HR ឧបករណ៍ Geofenced និងសេវាកម្មពាក់ព័ន្ធទាំងអស់។'
              : 'The legal agreement governing your access to and use of the Kiri HR workspace management platform, geofencing features, and services.'}
          </p>
          <div className="mt-4 text-xs font-mono text-slate-500">
            {isKm ? 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ ខែសីហា ឆ្នាំ២០២៦' : 'Last Updated: August 2026'}
          </div>
        </div>

        {/* Quick Tabs to toggle between Privacy and Terms */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 rounded-full bg-slate-900 border border-slate-800">
            <Link 
              to="/privacy"
              className="px-5 py-2 rounded-full text-slate-400 hover:text-white text-xs font-bold transition-colors"
            >
              {isKm ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy'}
            </Link>
            <span className="px-5 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-sm">
              {isKm ? 'លក្ខខណ្ឌនៃការប្រើប្រាស់' : 'Terms of Service'}
            </span>
          </div>
        </div>

        {/* Summary Feature Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Building2 size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isKm ? 'ការទទួលខុសត្រូវលើគណនី' : 'Workspace Account Terms'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isKm
                ? 'អ្នកគ្រប់គ្រងមានកាតព្វកិច្ចរក្សាសុវត្ថិភាពលេខកូដកន្លែងធ្វើការ និងការអនុញ្ញាតចូលប្រើប្រាស់របស់បុគ្គលិក។'
                : 'Administrators are responsible for maintaining workspace access credentials and passcode distribution.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <CreditCard size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isKm ? 'ការទូទាត់សេវា & KHQR' : 'Subscription & Payments'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isKm
                ? 'គម្រោងប្រើប្រាស់អាចបង់ប្រចាំខែ ឬឆ្នាំតាមរយៈ KHQR Bakong ឬប្រូម៉ូកូដដោយគ្មានកិច្ចសន្យាបង្ខំឡើយ។'
                : 'Flexible monthly or annual plans paid via KHQR Bakong or promo vouchers with transparent, no-lock-in terms.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isKm ? 'ការប្រើប្រាស់ត្រឹមត្រូវ' : 'Acceptable Use Policy'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isKm
                ? 'ហាមឃាត់ការបន្លំ GPS ឬការប្រើប្រាស់គណនីក្លែងបន្លំក្នុងការចុះវត្តមាន និងការកែប្រែទិន្នន័យដោយគ្មានសិទ្ធិ។'
                : 'Strict prohibition against GPS spoofing, fraudulent clock-ins, or unauthorized data tampering.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {isKm ? 'ច្បាប់គ្រប់គ្រងកម្ពុជា' : 'Governing Law'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isKm
                ? 'លក្ខខណ្ឌទាំងអស់ត្រូវបានគ្រប់គ្រង និងបកស្រាយស្របតាមច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។'
                : 'Governed and construed in accordance with the laws of the Kingdom of Cambodia.'}
            </p>
          </div>
        </div>

        {/* Detailed Terms Sections */}
        <div className="space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 sm:p-10">
          
          {/* Section 1 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">1</span>
              {isKm ? 'ការទទួលស្គាល់ និងការយល់ព្រមលើលក្ខខណ្ឌ' : '1. Acceptance of Terms'}
            </h2>
            <p className="mb-3">
              {isKm
                ? 'ដោយការបង្កើតគណនីកន្លែងធ្វើការ ការចូលប្រើប្រាស់ ឬការប្រើប្រាស់ប្រព័ន្ធ Kiri HR អ្នកពិតជាបានអាន យល់ និងយល់ព្រមតាមលក្ខខណ្ឌនៃការប្រើប្រាស់ទាំងអស់នេះ។'
                : 'By registering a workspace, logging in, or utilizing any feature of Kiri HR, you agree to be bound by these Terms of Service and our Privacy Policy.'}
            </p>
            <p>
              {isKm
                ? 'ប្រសិនបើអ្នកមិនយល់ព្រមតាមលក្ខខណ្ឌទាំងនេះទេ សូមមេត្តាកុំប្រើប្រាស់ប្រព័ន្ធ ឬសេវាកម្មរបស់យើងឡើយ។'
                : 'If you do not agree to these terms, you must refrain from accessing or using the Kiri HR platform.'}
            </p>
          </section>

          {/* Section 2 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">2</span>
              {isKm ? 'ការពិពណ៌នាអំពីសេវាកម្ម' : '2. Description of Platform Services'}
            </h2>
            <p className="mb-3">
              {isKm
                ? 'Kiri HR ជាប្រព័ន្ធគ្រប់គ្រងធនធានមនុស្ស និងកន្លែងធ្វើការ (SaaS) ដែលផ្តល់នូវមុខងារដូចជា៖'
                : 'Kiri HR is a cloud-based Software-as-a-Service (SaaS) platform designed to streamline workspace management, including:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
              <li>{isKm ? 'ការចុះវត្តមានបុគ្គលិកតាម Geofencing GPS និងការផ្ទៀងផ្ទាត់រូបថត' : 'Geofenced GPS clock-in verification and optional selfie photo captures.'}</li>
              <li>{isKm ? 'ការរៀបចំកាលវិភាគវេនធ្វើការប្រចាំសប្តាហ៍ និងការគ្រប់គ្រងសំណើសុំសម្រាក' : 'Weekly shift schedule planner and automated leave approval workflows.'}</li>
              <li>{isKm ? 'ការគណនាប្រាក់បៀវត្សរ៍ ម៉ោងបន្ថែម (OT) ការកាត់ប្រាក់យឺត និងការទូទាត់តាម KHQR' : 'Payroll calculation, overtime tracking, late deductions, and KHQR payout statements.'}</li>
              <li>{isKm ? 'ការជូនដំណឹងផ្ទាល់តាមរយៈ Telegram Bot សម្រាប់អ្នកគ្រប់គ្រង និងក្រុម' : 'Real-time Telegram Bot notifications for attendance logs and admin requests.'}</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">3</span>
              {isKm ? 'ការបង្កើតកន្លែងធ្វើការ និងសុវត្ថិភាពគណនី' : '3. Workspace Registration & Account Security'}
            </h2>
            <p className="mb-3">
              {isKm
                ? 'អ្នកគ្រប់គ្រងត្រូវផ្តល់ព័ត៌មានក្រុមហ៊ុនដែលត្រឹមត្រូវ និងទទួលខុសត្រូវក្នុងការរក្សាសុវត្ថិភាពនៃលេខកូដសម្ងាត់អ្នកគ្រប់គ្រង និងលេខកូដកន្លែងធ្វើការ (Workspace Code)។'
                : 'Workspace Administrators must provide accurate organization details and maintain strict confidentiality over administrator credentials and employee passcodes.'}
            </p>
            <p>
              {isKm
                ? 'អ្នកគ្រប់គ្រងទទួលខុសត្រូវទាំងស្រុងចំពោះសកម្មភាពទាំងអស់ដែលកើតឡើងនៅក្រោមគណនីកន្លែងធ្វើការរបស់ខ្លួន។'
                : 'The organization assumes full liability for all actions performed under its registered workspace accounts.'}
            </p>
          </section>

          {/* Section 4 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">4</span>
              {isKm ? 'ការប្រើប្រាស់ដែលបានអនុញ្ញាត និងការហាមឃាត់' : '4. Permitted Use & Conduct Restrictions'}
            </h2>
            <p className="mb-3">
              {isKm ? 'អ្នកប្រើប្រាស់ទាំងអស់ត្រូវប្តេជ្ញាមិនធ្វើសកម្មភាពដូចខាងក្រោម៖' : 'Users are strictly prohibited from engaging in the following actions:'}
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
              <li>{isKm ? 'ការប្រើប្រាស់កម្មវិធីបន្លំទីតាំង GPS (GPS Spoofing) ឬឧបករណ៍ក្លែងបន្លំក្នុងការចុះវត្តមាន' : 'Utilizing location spoofing software, mock location tools, or proxies to falsify attendance.'}</li>
              <li>{isKm ? 'ការកែប្រែទិន្នន័យប្រាក់បៀវត្សរ៍ ឬកំណត់ត្រាវត្តមានដោយគ្មានការអនុញ្ញាតពីអ្នកគ្រប់គ្រង' : 'Unauthorized tampering with payroll records, timestamps, or system parameters.'}</li>
              <li>{isKm ? 'ការព្យាយាមចូលប្រព័ន្ធដោយខុសច្បាប់ ឬធ្វើឱ្យប៉ះពាល់ដល់ស្ថិរភាពនៃសេវាកម្ម' : 'Attempting to breach, reverse engineer, or overload the platform infrastructure.'}</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">5</span>
              {isKm ? 'ថ្លៃសេវាជាវ និងការទូទាត់' : '5. Subscriptions, Pricing & Payments'}
            </h2>
            <p className="mb-3">
              {isKm
                ? 'Kiri HR ផ្តល់ជូននូវកញ្ចប់សេវាជាវបត់បែន (ប្រចាំខែ ឬប្រចាំឆ្នាំ)។ ការទូទាត់អាចធ្វើឡើងតាមរយៈ KHQR ឬកូដប្រូម៉ូសិនដែលបានបញ្ជាក់។'
                : 'Kiri HR offers tiered subscription options (Monthly / Annual). Payments are processed securely via KHQR transfers or authorized promotional vouchers.'}
            </p>
            <p>
              {isKm
                ? 'ការជាវនឹងត្រូវបានបន្ត ឬពន្យារពេលដោយយោងតាមការបញ្ជាក់ទូទាត់របស់អ្នកគ្រប់គ្រង។ មិនមានការបង់ប្រាក់ពិន័យចំពោះការឈប់ប្រើប្រាស់ឡើយ។'
                : 'Subscriptions do not carry hidden cancellation penalties. Services remain active for the duration of the paid or promotional period.'}
            </p>
          </section>

          {/* Section 6 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">6</span>
              {isKm ? 'កម្រិតនៃការទទួលខុសត្រូវ' : '6. Limitation of Liability'}
            </h2>
            <p className="mb-3">
              {isKm
                ? 'Kiri HR ខិតខំប្រឹងប្រែងដើម្បីធានាថាប្រព័ន្ធមានដំណើរការ 99.9% និងគ្មានកំហុស។ ទោះជាយ៉ាងណាក៏ដោយ យើងមិនទទួលខុសត្រូវចំពោះការរំខានសេវាបណ្តោះអាសន្នដែលបណ្តាលមកពីការដាច់អ៊ីនធឺណិតក្នុងស្រុក ឬបញ្ហាបណ្តាញទូរស័ព្ទឡើយ។'
                : 'While Kiri HR strives for 99.9% high availability, we shall not be liable for temporary disruptions caused by local internet outages, device GPS hardware variances, or telecommunication carriers.'}
            </p>
          </section>

          {/* Section 7 */}
          <section className="border-b border-slate-800/80 pb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">7</span>
              {isKm ? 'ច្បាប់គ្រប់គ្រង និងការដោះស្រាយវិវាទ' : '7. Governing Law & Jurisdiction'}
            </h2>
            <p className="mb-3">
              {isKm
                ? 'លក្ខខណ្ឌនៃការប្រើប្រាស់ទាំងនេះត្រូវបានគ្រប់គ្រង និងបកស្រាយស្របតាមច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។ វិវាទទាំងឡាយដែលកើតមានឡើងនឹងត្រូវដោះស្រាយដោយសន្តិវិធី ឬតាមរយៈតុលាការមានសមត្ថកិច្ចក្នុងប្រទេសកម្ពុជា។'
                : 'These Terms shall be governed by and construed in accordance with the laws of the Kingdom of Cambodia. Any legal disputes shall be subject to the competent courts of Cambodia.'}
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">8</span>
              {isKm ? 'ទំនាក់ទំនងបន្ថែម' : '8. Contact Information'}
            </h2>
            <p className="mb-4">
              {isKm
                ? 'ប្រសិនបើអ្នកមានសំណួរពាក់ព័ន្ធនឹងលក្ខខណ្ឌនៃការប្រើប្រាស់នេះ សូមទាក់ទងមកកាន់យើងខ្ញុំ៖'
                : 'For any questions regarding these Terms of Service, please contact our legal and support team:'}
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
            {isKm ? 'ចង់ស្វែងយល់បន្ថែមអំពីការការពារទិន្នន័យមែនទេ?' : 'Want to know more about Data Protection?'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-4 max-w-xl mx-auto">
            {isKm 
              ? 'អានគោលការណ៍ឯកជនភាពរបស់យើងដើម្បីដឹងពីរបៀបដែលយើងរក្សាទុក និងការពារទិន្នន័យ GPS និងប្រាក់បៀវត្សរ៍។'
              : 'Read our Privacy Policy to learn how we encrypt and protect employee GPS logs and financial information.'}
          </p>
          <Link
            to="/privacy"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-indigo-500/25"
          >
            <span>{isKm ? 'មើលគោលការណ៍ឯកជនភាព' : 'View Privacy Policy'}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
