import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Camera, PlusSquare, ArrowRight, ArrowLeft, CheckCircle2, Bot, Sparkles, UserCircle, FileText, Smartphone, Calendar, Mail, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TelegramConnectWidget } from './TelegramConnectWidget';
import { compressImage } from '../utils/imageUtils';
import { cn } from '../lib/utils';

interface EmployeeProfileSetupWizardProps {
  user: any;
  onComplete: (data: any) => Promise<void>;
  onTelegramDetect: (chatId: string) => Promise<void>;
}

export default function EmployeeProfileSetupWizard({ user, onComplete, onTelegramDetect }: EmployeeProfileSetupWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    startingDate: user?.startingDate || "",
    address: user?.address || "",
    bankQrUrl: user?.bankQrUrl || "",
    avatar: user?.avatar || "",
    nationalIdCardUrl: user?.nationalIdCardUrl || ""
  });

  const steps = [
    { id: 1, title: 'Personal Info', icon: UserCircle },
    { id: 2, title: 'Profile Photo', icon: Camera },
    { id: 3, title: 'Documents', icon: FileText },
    { id: 4, title: 'Connect Alerts', icon: Bot }
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!profileForm.name || !profileForm.phone || !profileForm.startingDate) {
        alert("Please fill in all required personal information.");
        return;
      }
    } else if (step === 3) {
      if (!profileForm.bankQrUrl || !profileForm.nationalIdCardUrl) {
        alert("Please upload both your National ID and Bank QR.");
        return;
      }
    }
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Max size is 10MB.");
      return;
    }
    try {
      const compressedUrl = await compressImage(file);
      setProfileForm({ ...profileForm, [field]: compressedUrl });
    } catch (error) {
      console.error("Error compressing image", error);
      alert("Failed to process image.");
    }
  };

  const generateAvatar = () => {
    const seed = profileForm.name || "User";
    const url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=4f46e5`;
    setProfileForm({ ...profileForm, avatar: url });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onComplete(profileForm);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm w-full flex flex-col sm:items-center sm:justify-center overflow-y-auto">
      <div className="w-full sm:max-w-4xl flex flex-col min-h-screen sm:min-h-[85vh] sm:my-8 bg-white dark:bg-slate-900 sm:rounded-[2.5rem] sm:border border-slate-200 dark:border-slate-800 sm:shadow-2xl overflow-hidden relative">
        
        {/* Desktop Header */}
        <div className="hidden sm:block px-10 pt-10 pb-5 bg-white dark:bg-slate-900 relative z-10 shrink-0 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">Complete your profile</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">We need a few details to get your workspace ready.</p>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden sm:block relative max-w-3xl w-full mx-auto px-16 pb-12 pt-4 bg-white dark:bg-slate-900 shrink-0 border-b border-slate-100 dark:border-slate-800/60 z-10">
          <div className="absolute top-10 left-24 right-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <motion.div 
                className="h-full bg-indigo-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
             />
          </div>
          
          <div className="relative flex justify-between items-center z-10">
            {steps.map((s) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex flex-col items-center group">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.15 : 1,
                      backgroundColor: isCurrent ? '#4f46e5' : isCompleted ? '#10b981' : '#f8fafc',
                      borderColor: isCurrent ? '#c7d2fe' : isCompleted ? '#a7f3d0' : '#e2e8f0',
                    }}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors duration-300 border-4 shadow-sm relative z-10",
                      isCurrent || isCompleted ? "text-white" : "text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </motion.div>
                  <span className={cn(
                    "absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300",
                    isCurrent ? "text-indigo-600 dark:text-indigo-400" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                  )}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Timeline & Header */}
        <div className="sm:hidden px-6 pt-10 pb-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Step {step} of {steps.length}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{steps[step - 1].title}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800/30 text-sm">
              {Math.round((step / steps.length) * 100)}%
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <motion.div 
                className="h-full bg-indigo-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${(step / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
             />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-5 sm:p-8 relative flex flex-col justify-start sm:justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-2xl mx-auto space-y-5 sm:space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <UserCircle className="w-3.5 h-3.5 text-indigo-500" /> Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={profileForm.name} 
                      onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm shadow-sm" 
                      placeholder="Your full name" 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-500" /> {t("phoneNumber")} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      required 
                      value={profileForm.phone} 
                      onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm shadow-sm" 
                      placeholder="+855 12 345 678" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" /> {t("email")}
                    </label>
                    <input 
                      type="email" 
                      value={profileForm.email} 
                      onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm shadow-sm" 
                      placeholder="you@example.com" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {t("startingDate")} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={profileForm.startingDate} 
                      onChange={e => setProfileForm({...profileForm, startingDate: e.target.value})} 
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm shadow-sm" 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center space-y-10 max-w-xl mx-auto py-4"
              >
                <div className="text-center space-y-3 sm:hidden">
                  <p className="text-base text-slate-500 font-medium">Upload a professional photo or generate a unique avatar.</p>
                </div>
                
                <div className="relative group w-48 h-48 rounded-full overflow-hidden border-8 border-white dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-slate-100 dark:bg-slate-800">
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <User className="w-16 h-16 mb-2 opacity-50" />
                    </div>
                  )}
                  {profileForm.avatar && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer" onClick={() => document.getElementById('wizard-avatar-upload')?.click()}>
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-8">
                  <button 
                    onClick={() => document.getElementById('wizard-avatar-upload')?.click()}
                    className="flex-1 py-4 px-6 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-center gap-3 text-lg"
                  >
                    <Camera className="w-6 h-6" />
                    Upload Photo
                  </button>
                  <button 
                    onClick={generateAvatar}
                    className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 text-lg"
                  >
                    <Sparkles className="w-6 h-6" />
                    Auto Avatar
                  </button>
                </div>
                <input id="wizard-avatar-upload" type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8 max-w-2xl mx-auto w-full"
              >
                <div className="text-center space-y-2 mb-8 sm:hidden">
                  <p className="text-base text-slate-500 font-medium">Upload clear photos of your ID and banking QR.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500" /> {t("nationalIdCard")} <span className="text-rose-500">*</span></span>
                      {profileForm.nationalIdCardUrl && <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Done</span>}
                    </label>
                    {profileForm.nationalIdCardUrl ? (
                      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-white dark:bg-slate-800 shadow-sm group">
                        <img src={profileForm.nationalIdCardUrl} alt="National ID" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setProfileForm({...profileForm, nationalIdCardUrl: ""})} className="absolute top-3 right-3 bg-slate-900/60 hover:bg-rose-500 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-sm">×</button>
                      </div>
                    ) : (
                      <div 
                        className="w-full aspect-[4/3] border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 bg-white/50 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm hover:shadow-md"
                        onClick={() => document.getElementById('wizard-id-upload')?.click()}
                      >
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all">
                          <PlusSquare className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Upload ID Card</span>
                      </div>
                    )}
                    <input id="wizard-id-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'nationalIdCardUrl')} />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-indigo-500" /> {t("payrollBankQr")} <span className="text-rose-500">*</span></span>
                      {profileForm.bankQrUrl && <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Done</span>}
                    </label>
                    {profileForm.bankQrUrl ? (
                      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-white dark:bg-slate-800 shadow-sm group">
                        <img src={profileForm.bankQrUrl} alt="Bank QR" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setProfileForm({...profileForm, bankQrUrl: ""})} className="absolute top-3 right-3 bg-slate-900/60 hover:bg-rose-500 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-sm">×</button>
                      </div>
                    ) : (
                      <div 
                        className="w-full aspect-[4/3] border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 bg-white/50 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm hover:shadow-md"
                        onClick={() => document.getElementById('wizard-qr-upload')?.click()}
                      >
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all">
                          <PlusSquare className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Upload Bank QR</span>
                      </div>
                    )}
                    <input id="wizard-qr-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bankQrUrl')} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center space-y-8 max-w-xl mx-auto py-4"
              >
                <div className="text-center space-y-3 mb-2">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-500/20 shadow-sm relative">
                    <Bot className="w-8 h-8" />
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-[3px] border-white dark:border-slate-900"></div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Stay Connected</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">Link your Telegram to get instant notifications for payroll, leave approvals, and schedule changes.</p>
                </div>

                <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                  <TelegramConnectWidget
                    staffId={user.id}
                    passcode={user.passcode}
                    currentChatId={user.telegramChatId}
                    onChatIdDetected={onTelegramDetect}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 sm:px-10 sm:py-5 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-row justify-between items-center shrink-0 mt-auto sticky bottom-0 gap-4 z-20">
          <button
            onClick={handleBack}
            className={cn(
              "flex-1 sm:flex-none justify-center px-5 sm:px-6 py-3 sm:py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all",
              step > 1 
                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm' 
                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
            )}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex-1 sm:flex-none justify-center px-6 sm:px-8 py-3 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none justify-center px-6 sm:px-8 py-3 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-emerald-500/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Saving...</>
              ) : (
                <>Finish Setup <CheckCircle2 className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

