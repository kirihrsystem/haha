import React, { useState, useMemo, useRef } from 'react';
import ScrollLock from './ScrollLock';
import { createPortal } from "react-dom";
import { useAuthStore, useSettingsStore } from "../store";
import { Camera, Check, PlusSquare, CreditCard, Mail, Phone, MapPin, AlertCircle, Shield, Award, UserCircle, QrCode, Building, PenLine, X, Maximize2, Compass, IdCard } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useTranslation } from "react-i18next";
import { compressImage } from "../utils/imageUtils";
import QRCode from "react-qr-code";
import { TelegramConnectWidget } from "./TelegramConnectWidget";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { StaffIdCardModal } from "./StaffIdCardModal";

export default function EmployeeProfile() {
  const { user, setUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const { t } = useTranslation();
  
  const officeLat = settings?.officeLat ?? 11.567048;
  const officeLng = settings?.officeLng ?? 104.893430;
  const branchName = user?.branch || settings?.companyName || "Main Office / HQ";
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFullQR, setShowFullQR] = useState(false);
  const [showFullID, setShowFullID] = useState(false);
  const [showAttendanceQR, setShowAttendanceQR] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  
  
  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
    avatar: user?.avatar || "",
    bankQrUrl: user?.bankQrUrl || "",
    nationalIdCardUrl: user?.nationalIdCardUrl || ""
  });

  const completionPercentage = useMemo(() => {
    let completed = 0;
    const totalFields = 6;
    if (formData.phone) completed++;
    if (formData.email) completed++;
    if (formData.address) completed++;
    if (formData.avatar) completed++;
    if (formData.bankQrUrl) completed++;
    if (formData.nationalIdCardUrl) completed++;
    return Math.round((completed / totalFields) * 100);
  }, [formData]);

  if (!user) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Max size is 10MB.");
      return;
    }
    try {
      const compressedUrl = await compressImage(file);
      setFormData({ ...formData, avatar: compressedUrl });
      if (!isEditing) {
        setIsSaving(true);
        await updateDoc(doc(db, "staff", user.id), { avatar: compressedUrl });
        setUser({ ...user, avatar: compressedUrl });
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error compressing avatar", error);
      alert("Failed to process profile image.");
      setIsSaving(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedUrl = await compressImage(file);
      setFormData({ ...formData, bankQrUrl: compressedUrl });
    } catch (error) {
      console.error("Error compressing QR code", error);
      alert("Failed to process QR code image.");
    }
  };

  const handleNationalIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedUrl = await compressImage(file);
      setFormData({ ...formData, nationalIdCardUrl: compressedUrl });
    } catch (error) {
      console.error("Error compressing National ID card image", error);
      alert("Failed to process National ID card image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "staff", user.id), {
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        avatar: formData.avatar,
        bankQrUrl: formData.bankQrUrl,
        nationalIdCardUrl: formData.nationalIdCardUrl
      });
      setUser({
        ...user,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        avatar: formData.avatar,
        bankQrUrl: formData.bankQrUrl,
        nationalIdCardUrl: formData.nationalIdCardUrl
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile", error);
      alert("Failed to save profile updates.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTelegramConnected = async (chatId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "staff", user.id), { telegramChatId: chatId });
      setUser({ ...user, telegramChatId: chatId });
    } catch (err) {
      console.error("Error updating telegram chat id:", err);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto w-full pb-20 space-y-6 lg:space-y-8">
      
      {/* Header section with cover & avatar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        <div className="h-40 sm:h-60 md:h-64 bg-slate-950 relative border-b border-slate-800 overflow-hidden isolate select-none">
           {/* Abstract Premium Card Blue Gradient Background */}
           <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950" />
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/40 via-cyan-500/20 to-transparent" />
           
           {/* Abstract Glowing Light Orbs & Spheres */}
           <div className="absolute -top-24 -left-20 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />
           <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
           <div className="absolute -bottom-24 right-0 w-80 h-80 bg-indigo-600/35 rounded-full blur-3xl pointer-events-none" />
           
           {/* Decorative Holographic Wave Curves & Light Rays */}
           <div className="absolute -top-12 right-10 w-96 h-32 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent rounded-full blur-xl transform -rotate-12 pointer-events-none" />
           <div className="absolute bottom-4 left-1/4 w-80 h-24 bg-gradient-to-r from-blue-600/20 via-indigo-400/20 to-transparent rounded-full blur-lg transform rotate-6 pointer-events-none" />
           
           {/* Decorative Geometric Grid & Glass Reflection Streak */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f615_1px,transparent_1px),linear-gradient(to_bottom,#3b82f615_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] opacity-80" />
           <div className="absolute -top-10 -left-10 w-[140%] h-24 bg-gradient-to-b from-white/10 via-white/5 to-transparent transform -rotate-6 pointer-events-none" />
           <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-blue-400 opacity-80" />

           {/* Company Logo & Fancy Company Name (NO frame, NO shape around logo) */}
           <div className="absolute top-3.5 sm:top-8 md:top-10 left-3.5 sm:left-8 md:left-10 z-20 flex flex-row items-center gap-2.5 sm:gap-6 max-w-[65%] sm:max-w-[75%]">
             {settings?.logoUrl ? (
               /* Directly render logo image with NO background box, NO frame, NO border */
               <img 
                 src={settings.logoUrl} 
                 alt="Company Logo" 
                 className="h-9 sm:h-16 md:h-20 max-w-[100px] sm:max-w-[180px] md:max-w-[240px] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.75)] shrink-0" 
               />
             ) : (
               <div className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-cyan-400 tracking-wider drop-shadow-lg shrink-0">
                 {(settings?.companyName || branchName).charAt(0)}
               </div>
             )}

             <div className="flex flex-col drop-shadow-xl">
               <span className="text-[8px] sm:text-[11px] font-mono tracking-[0.2em] sm:tracking-[0.25em] text-cyan-300/90 uppercase font-semibold">
                 {branchName ? `${branchName} • VIRTUAL PASS` : 'CORPORATE PASS'}
               </span>
               {/* Fancy Professional Font styling using serif & metallic gradient */}
               <h1 className="text-xs sm:text-2xl md:text-3xl lg:text-4xl font-serif font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-100 leading-tight line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                 {settings?.companyName || branchName}
               </h1>
             </div>
           </div>

           {/* Quick Action Buttons */}
           <div className="absolute top-3.5 right-3.5 sm:top-8 sm:right-8 md:top-10 md:right-10 z-20 flex flex-row items-center gap-1.5 sm:gap-2.5 shrink-0">
             <button
               onClick={() => setShowIdCard(true)}
               title="ID Card"
               aria-label="ID Card"
               className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl transition-all flex items-center justify-center border border-white/20 active:scale-95 group hover:-translate-y-0.5"
             >
               <IdCard className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
             </button>
             <button
               onClick={() => setShowAttendanceQR(true)}
               title="My QR"
               aria-label="My QR"
               className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl transition-all flex items-center justify-center border border-cyan-400/30 active:scale-95 group hover:-translate-y-0.5"
             >
               <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
             </button>
           </div>
        </div>
        
        <div className="px-6 sm:px-8 lg:px-10 pb-8 flex flex-col sm:flex-row gap-5 sm:gap-8 relative z-10">
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-md border border-slate-200 dark:border-slate-700 -mt-12 sm:-mt-16 md:-mt-20 shrink-0 relative group">
            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-indigo-400 font-bold text-3xl sm:text-4xl md:text-5xl uppercase">
                  {(user.nameKh || user.name).charAt(0)}
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-200 backdrop-blur-sm">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] sm:text-xs font-semibold">Change</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            {isSaving && (
              <div className="absolute -top-2 -right-2 bg-indigo-500 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-end pt-2 sm:pt-4">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                 <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white leading-tight flex items-baseline gap-2 flex-wrap">
                   {user.nameKh ? (
                     <>
                       <span>{user.nameKh}</span>
                       <span className="text-lg sm:text-xl font-medium text-slate-500 dark:text-slate-400">({user.name})</span>
                     </>
                   ) : (
                     <span>{user.name}</span>
                   )}
                 </h2>
                 
                 {/* Metadata badges for PC & mobile */}
                 <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                     <Shield className="w-3.5 h-3.5 text-indigo-500" />
                     {user.position || "Staff Member"}
                   </span>

                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                     <Award className="w-3.5 h-3.5 text-amber-500" />
                     ID: {user.passcode}
                   </span>

                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                     <Building className="w-3.5 h-3.5 text-emerald-500" />
                     {branchName}
                   </span>
                 </div>
               </div>
               
               {!isEditing ? (
                 <button
                   onClick={() => setIsEditing(true)}
                   className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all text-sm border border-slate-200/80 dark:border-slate-700/80 shadow-sm"
                 >
                   <PenLine className="w-4 h-4" /> Edit Profile
                 </button>
               ) : (
                 <button
                   onClick={handleSubmit}
                   disabled={isSaving}
                   className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-md shadow-indigo-500/20 text-sm"
                 >
                   {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                   Save Changes
                 </button>
               )}
             </div>
          </div>
        </div>
        
        {/* Profile Completion Bar */}
        {completionPercentage < 100 && !isEditing && (
          <div className="px-6 sm:px-8 lg:px-10 pb-6">
            <div className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">Profile Completion</span>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">{completionPercentage}%</span>
                </div>
                <div className="h-2.5 w-full bg-amber-200/60 dark:bg-amber-800/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="shrink-0 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors text-center"
              >
                Complete Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid gap-6 lg:gap-8 grid-cols-1">
        
        {/* Left Column: Employment Info & Telegram Widget (Only shown when not editing) */}
        {!isEditing && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-slate-800/60 space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Building className="w-4 h-4 text-indigo-500" />
                Employment & Location
              </h3>
              
              <div className="space-y-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Employee PIN / Passcode</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tracking-wide">{user.passcode}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Position / Role</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{user.position || "Staff Member"}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Branch / Office Location</span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${officeLat},${officeLng}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-800/40"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Open Maps
                    </a>
                  </div>
                  
                  <div className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    {branchName}
                  </div>

                  {/* Google Map Embedded Preview */}
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 relative group shadow-sm">
                    <iframe
                      title="Branch Office Location Map"
                      src={`https://www.google.com/maps?q=${officeLat},${officeLng}&hl=en&z=15&output=embed`}
                      className="w-full h-48 sm:h-56 lg:h-60 border-0 block"
                      loading="lazy"
                    />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${officeLat},${officeLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg border border-white/20"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      Full Screen Map
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Telegram Connect Widget */}
            {user && (
              <TelegramConnectWidget
                staffId={user.id}
                passcode={user.passcode}
                currentChatId={user.telegramChatId}
                onChatIdDetected={handleTelegramConnected}
              />
            )}
          </div>
        )}

        {/* Right Column: Detailed Info (Contact & Documents) */}
        <div className="space-y-6 lg:space-y-8">
          
          {/* Contact Details Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-slate-800/60">
             <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
               <UserCircle className="w-4 h-4 text-purple-500" />
               Contact & Personal Information
             </h3>
             
             {isEditing ? (
               <div className="space-y-5">
                 <div className="grid grid-cols-1 gap-5">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                     <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm" placeholder="+855..." />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                     <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm" placeholder="email@example.com" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Address</label>
                   <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl min-h-[90px] outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm resize-y" placeholder="Full residential address..." />
                 </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-6">
                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                   <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                     <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                   </div>
                   <div className="min-w-0">
                     <div className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phone Number</div>
                     {user.phone ? (
                       <a href={`tel:${user.phone}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block mt-0.5 truncate">
                         {user.phone}
                       </a>
                     ) : (
                       <span className="text-sm text-slate-400 italic font-normal block mt-0.5">Not provided</span>
                     )}
                   </div>
                 </div>
                 
                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                   <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                     <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                   </div>
                   <div className="min-w-0">
                     <div className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</div>
                     {user.email ? (
                       <a href={`mailto:${user.email}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block mt-0.5 truncate">
                         {user.email}
                       </a>
                     ) : (
                       <span className="text-sm text-slate-400 italic font-normal block mt-0.5">Not provided</span>
                     )}
                   </div>
                 </div>
                 
                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                   <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                     <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                   </div>
                   <div className="min-w-0 flex-1">
                     <div className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Residential Address</div>
                     <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 leading-relaxed">
                       {user.address || <span className="text-slate-400 italic font-normal">Not provided</span>}
                     </div>
                   </div>
                 </div>
               </div>
             )}
          </div>

          {/* Important Documents Section */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-slate-800/60">
             <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
               <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                 <CreditCard className="w-4 h-4 text-emerald-500" />
                 Important Documents
               </h3>
               <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
                 Identity & Verification
               </span>
             </div>
             
             <div className="grid grid-cols-1 gap-6">
               
               {/* Bank QR Box */}
               <div className="bg-slate-50/80 dark:bg-slate-800/20 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm">
                 <div className="px-5 py-3.5 bg-white dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                       <QrCode className="w-4 h-4" />
                     </div>
                     <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                       Bank QR Code
                     </h4>
                   </div>

                   {user.bankQrUrl ? (
                     <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
                       <Check className="w-3 h-3" /> Attached
                     </span>
                   ) : (
                     <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/50">
                       <AlertCircle className="w-3 h-3" /> Missing
                     </span>
                   )}
                 </div>
                 
                 <div className="flex-1 flex flex-col">
                   {(isEditing || (!user.bankQrUrl && isEditing)) ? (
                     formData.bankQrUrl ? (
                       <div className="relative w-full overflow-hidden bg-slate-950/5 dark:bg-slate-950 group">
                         <img src={formData.bankQrUrl} alt="Bank QR" className="w-full h-auto block mx-auto" />
                         <button 
                           type="button" 
                           onClick={() => setFormData({...formData, bankQrUrl: ""})} 
                           className="absolute top-3 right-3 bg-slate-900/70 hover:bg-red-500 text-white w-9 h-9 flex items-center justify-center rounded-full transition-colors backdrop-blur-sm shadow-md"
                         >
                           <X className="w-4.5 h-4.5" />
                         </button>
                       </div>
                     ) : (
                       <div className="p-4 flex-1 flex flex-col">
                         <label className="border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-all w-full h-56 sm:h-64 rounded-2xl flex flex-col items-center justify-center cursor-pointer group p-6 text-center flex-1">
                           <PlusSquare className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Upload Bank QR Image</span>
                           <span className="text-[10px] text-slate-400 mt-1">PNG, JPG or WEBP image</span>
                           <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                         </label>
                       </div>
                     )
                   ) : (
                     user.bankQrUrl ? (
                       <div 
                         className="relative w-full overflow-hidden bg-slate-950/5 dark:bg-slate-950 group cursor-pointer transition-all duration-200"
                         onClick={() => setShowFullQR(true)}
                       >
                         <img 
                           src={user.bankQrUrl} 
                           alt="Bank QR" 
                           className="w-full h-auto block mx-auto transition-transform duration-300 group-hover:scale-[1.02]" 
                         />
                         <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold backdrop-blur-[2px] gap-2">
                           <Maximize2 className="w-4 h-4" />
                           <span>Click to View Full Document</span>
                         </div>
                       </div>
                     ) : (
                       <div className="p-4 flex-1 flex flex-col">
                         <div className="w-full h-56 sm:h-64 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col items-center justify-center p-6 text-center flex-1">
                            <AlertCircle className="w-7 h-7 text-amber-500 mb-2" />
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">Bank QR Not Uploaded</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Click Edit Profile above to attach your bank QR</span>
                         </div>
                       </div>
                     )
                   )}
                 </div>
               </div>

               {/* National ID Box */}
               <div className="bg-slate-50/80 dark:bg-slate-800/20 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm">
                 <div className="px-5 py-3.5 bg-white dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                       <CreditCard className="w-4 h-4" />
                     </div>
                     <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                       National ID Card
                     </h4>
                   </div>

                   {user.nationalIdCardUrl ? (
                     <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
                       <Check className="w-3 h-3" /> Attached
                     </span>
                   ) : (
                     <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 dark:bg-red-950/60 dark:text-red-400 px-2.5 py-1 rounded-full border border-red-200/60 dark:border-red-800/50">
                       <AlertCircle className="w-3 h-3" /> Required
                     </span>
                   )}
                 </div>
                 
                 <div className="flex-1 flex flex-col">
                   {(isEditing || (!user.nationalIdCardUrl && isEditing)) ? (
                     formData.nationalIdCardUrl ? (
                       <div className="relative w-full overflow-hidden bg-slate-950/5 dark:bg-slate-950 group">
                         <img src={formData.nationalIdCardUrl} alt="National ID" className="w-full h-auto block mx-auto" />
                         <button 
                           type="button" 
                           onClick={() => setFormData({...formData, nationalIdCardUrl: ""})} 
                           className="absolute top-3 right-3 bg-slate-900/70 hover:bg-red-500 text-white w-9 h-9 flex items-center justify-center rounded-full transition-colors backdrop-blur-sm shadow-md"
                         >
                           <X className="w-4.5 h-4.5" />
                         </button>
                       </div>
                     ) : (
                       <div className="p-4 flex-1 flex flex-col">
                         <label className="border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-all w-full h-56 sm:h-64 rounded-2xl flex flex-col items-center justify-center cursor-pointer group p-6 text-center flex-1">
                           <PlusSquare className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                           <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Upload National ID Card</span>
                           <span className="text-[10px] text-slate-400 mt-1">Front or back scan photo</span>
                           <input type="file" accept="image/*" className="hidden" onChange={handleNationalIdUpload} />
                         </label>
                       </div>
                     )
                   ) : (
                     user.nationalIdCardUrl ? (
                       <div 
                         className="relative w-full overflow-hidden bg-slate-950/5 dark:bg-slate-950 group cursor-pointer transition-all duration-200"
                         onClick={() => setShowFullID(true)}
                       >
                         <img 
                           src={user.nationalIdCardUrl} 
                           alt="National ID" 
                           className="w-full h-auto block mx-auto transition-transform duration-300 group-hover:scale-[1.02]" 
                         />
                         <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold backdrop-blur-[2px] gap-2">
                           <Maximize2 className="w-4 h-4" />
                           <span>Click to View Full Document</span>
                         </div>
                       </div>
                     ) : (
                       <div className="p-4 flex-1 flex flex-col">
                         <div className="w-full h-56 sm:h-64 rounded-2xl border border-red-200/60 dark:border-red-800/40 bg-red-50/40 dark:bg-red-950/20 flex flex-col items-center justify-center p-6 text-center flex-1">
                            <AlertCircle className="w-7 h-7 text-red-500 mb-2" />
                            <span className="text-xs font-semibold text-red-800 dark:text-red-400">National ID Missing</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Click Edit Profile above to attach your ID card</span>
                         </div>
                       </div>
                     )
                   )}
                 </div>
               </div>
               
             </div>
          </div>
          
          {/* Action Buttons for Editing */}
          {isEditing && (
            <div className="flex gap-4">
              <button
                 type="button"
                 onClick={() => {
                   setFormData({
                     phone: user?.phone || "",
                     email: user?.email || "",
                     address: user?.address || "",
                     avatar: user?.avatar || "",
                     bankQrUrl: user?.bankQrUrl || "",
                     nationalIdCardUrl: user?.nationalIdCardUrl || ""
                   });
                   setIsEditing(false);
                 }}
                 className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors text-slate-700 dark:text-slate-300 text-sm"
              >
                 Cancel
              </button>
              <button
                 type="button"
                 onClick={handleSubmit}
                 disabled={isSaving}
                 className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold transition-all text-white shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save Profile Updates
                  </>
                )}
              </button>
            </div>
          )}
          
        </div>
      </div>

      {/* Modals for QR / ID */}
      {createPortal(
        <AnimatePresence>
          {showFullQR && user.bankQrUrl && (
            <motion.div 
              key="full-bank-qr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/95 backdrop-blur-md" 
              onClick={() => setShowFullQR(false)}
            >
              <button 
                onClick={() => setShowFullQR(false)}
                className="absolute top-4 right-4 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <motion.img 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                src={user.bankQrUrl} 
                alt="Full Bank QR" 
                className="w-full h-full object-contain" 
                
              />
            </motion.div>
          )}

          {showFullID && user.nationalIdCardUrl && (
            <motion.div 
              key="full-national-id"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/95 backdrop-blur-md" 
              onClick={() => setShowFullID(false)}
            >
              <button 
                onClick={() => setShowFullID(false)}
                className="absolute top-4 right-4 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <motion.img 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                src={user.nationalIdCardUrl} 
                alt="Full National ID" 
                className="w-full h-full object-contain" 
                
              />
            </motion.div>
          )}

          {showAttendanceQR && (
            <motion.div 
              key="attendance-qr-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md" 
              onClick={() => setShowAttendanceQR(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="relative max-w-sm w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center" 
                
              >
                <button 
                  onClick={() => setShowAttendanceQR(false)}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-4">
                  <QrCode className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2 text-center text-slate-900 dark:text-white">My Attendance QR</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-8">Scan this QR code with the admin device to log your attendance.</p>
                
                <div className="bg-white p-5 rounded-[1.5rem] shadow-inner border border-slate-200">
                  <QRCode value={`${window.location.origin}/${settings?.slug || user?.companyId}/e/${user?.id}`} size={220} />
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {showIdCard && (
            <StaffIdCardModal key="staff-id-card-modal" user={user} onClose={() => setShowIdCard(false)} />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
