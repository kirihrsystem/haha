import { useState, useRef } from "react";
import { Download, X, Printer, Check, Loader2 } from "lucide-react";
import QRCode from "react-qr-code";
import { Staff } from "../types";
import { useSettingsStore } from "../store";
import * as htmlToImage from "html-to-image";
import ScrollLock from "./ScrollLock";

interface StaffIdCardModalProps {
  user: Staff;
  onClose: () => void;
  key?: string | number;
}

export function StaffIdCardModal({ user, onClose }: StaffIdCardModalProps) {
  const { settings } = useSettingsStore();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    'premium' | 'corporate' | 'modern' | 'creative' | 'minimal' | 'tech' | 'executive'
  >('premium');
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  const companyName = settings?.companyName || "Company Name";
  const logoUrl = settings?.logoUrl || "";
  const companyPhone = settings?.companyPhone || "";
  const officeAddress = settings?.officeAddress || "";

  const handleDownload = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;
    setIsExporting(true);
    try {
      const exportCard = async (ref: HTMLDivElement, suffix: string) => {
        const dataUrl = await htmlToImage.toPng(ref, {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: 'transparent',
        });
        const link = document.createElement("a");
        link.download = `ID_Card_${user.name.replace(/\s+/g, '_')}_${suffix}.png`;
        link.href = dataUrl;
        link.click();
      };
      await exportCard(frontCardRef.current, "Front");
      await new Promise(r => setTimeout(r, 300));
      await exportCard(backCardRef.current, "Back");
    } catch (err) {
      console.error("Failed to export:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const templates = [
    { id: 'premium', name: 'Premium Platinum' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'modern', name: 'Modern Dark' },
    { id: 'creative', name: 'Creative Mesh' },
    { id: 'minimal', name: 'Swiss Minimal' },
    { id: 'tech', name: 'Tech Sleek' },
    { id: 'executive', name: 'Executive Gold' }
  ];

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <ScrollLock />
      
      <div 
        className="w-full max-w-5xl bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl my-auto print:bg-white print:shadow-none print:w-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar Template Selector (Hidden in Print) */}
        <div className="w-full md:w-64 bg-white dark:bg-slate-800 p-6 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 print:hidden shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white">ID Card Design</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {templates.map((t, idx) => (
              <button
                key={`${t.id}-${idx}`}
                onClick={() => setSelectedTemplate(t.id as any)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-left whitespace-nowrap transition-all ${
                  selectedTemplate === t.id 
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-500/30 font-bold' 
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="font-semibold text-sm">{t.name}</span>
                {selectedTemplate === t.id && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </button>
            ))}
          </div>
          
          <div className="mt-auto hidden md:flex flex-col gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-colors disabled:opacity-70"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PNG
            </button>
          </div>
        </div>

        {/* Card Display Container */}
        <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/50 overflow-y-auto">
          {/* Mobile Print / Download Controls */}
          <div className="flex md:hidden gap-3 w-full mb-6 print:hidden">
            <button 
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold border border-slate-200 dark:border-slate-700"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Save
            </button>
          </div>

          <style>
            {`
              @media print {
                body * {
                  visibility: hidden;
                }
                #id-card-print-area, #id-card-print-area * {
                  visibility: visible;
                }
                #id-card-print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  transform: scale(1) !important;
                }
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .hide-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              }
            `}
          </style>

          <div
            id="id-card-print-area"
            className="flex flex-col xl:flex-row gap-8 bg-transparent"
            style={{ width: "max-content", padding: "20px", margin: "0 auto" }}
          >
            {/* --- 1. PREMIUM PLATINUM TEMPLATE --- */}
            {selectedTemplate === 'premium' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-[#f8fafc] rounded-3xl shadow-2xl overflow-hidden relative flex flex-col isolate border border-slate-200">
                  <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
                  <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -z-10" />
                  
                  {/* Geometric Glass Header */}
                  <div className="w-full h-[180px] bg-gradient-to-br from-indigo-600 to-violet-700 relative rounded-b-[40px] shadow-lg flex flex-col items-center justify-start pt-8 px-6">
                    <div className="absolute inset-0 bg-[url('/images/cubes.png')] opacity-10 rounded-b-[40px]" />
                    <div className="relative z-10 w-full flex flex-col items-center">
                      <div className="mb-2"><img loading="lazy" decoding="async" src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[160px] h-12 object-contain drop-shadow-md" /></div>
                      <div className="text-white font-black text-[12px] tracking-[0.2em] uppercase text-center drop-shadow-md">
                        {companyName}
                      </div>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="w-full flex justify-center -mt-16 z-20 relative">
                    <div className="w-[140px] h-[140px] rounded-full p-1.5 bg-white shadow-xl relative z-10">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 relative border border-slate-100">
                        {user.avatar ? (
                          <img loading="lazy" decoding="async" src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-300 text-5xl font-black uppercase tracking-tighter">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col items-center justify-center w-full px-8 pb-4 z-10 text-center">
                    <h2 className="text-[26px] font-black text-slate-800 tracking-tight leading-none mb-1">
                      {user.nameKh || user.name}
                    </h2>
                    {user.nameKh && (
                      <h3 className="text-[12px] font-bold text-slate-400 tracking-[0.1em] mt-1 uppercase">
                        {user.name}
                      </h3>
                    )}
                    
                    <div className="mt-4 px-6 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 shadow-sm">
                      <div className="text-indigo-700 font-bold text-[11px] tracking-widest uppercase">
                        {user.position || "Staff Member"}
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-[#f8fafc] rounded-3xl shadow-2xl overflow-hidden relative flex flex-col items-center isolate border border-slate-200 p-8">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -z-10 translate-x-1/3 -translate-y-1/3 opacity-70" />
                  <div className="absolute bottom-0 left-0 w-full h-[60px] bg-gradient-to-r from-indigo-600 to-violet-700 -z-10" />
                  
                  <div className="w-full text-center mb-8 mt-4 relative z-10">
                    <h3 className="font-bold text-indigo-500 tracking-[0.25em] text-[9px] uppercase mb-2">OFFICIAL IDENTITY</h3>
                    <p className="text-slate-800 font-black text-base uppercase tracking-wider">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                    <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 mb-6">
                      <QRCode value={`${window.location.origin}/${settings?.slug || user?.companyId}/e/${user?.id}`} size={130} level="H" fgColor="#4f46e5" />
                    </div>
                  </div>

                  <div className="w-full mt-auto space-y-4 pt-6 relative text-center z-10">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.1em] leading-relaxed mb-6">
                      This card is non-transferable and remains the property of {companyName}.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[9px] text-white font-semibold flex flex-col gap-1 tracking-wider absolute bottom-2 left-0 w-full">
                        {companyPhone && <div>{companyPhone}</div>}
                        {officeAddress && <div className="truncate opacity-80 px-4">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* --- 2. CORPORATE TEMPLATE --- */}
            {selectedTemplate === 'corporate' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-white rounded-xl shadow-xl overflow-hidden relative flex flex-col isolate border border-slate-300">
                  {/* Strict Corporate Angles */}
                  <div className="absolute top-0 right-0 w-[200px] h-[100%] bg-slate-50 -z-10" />
                  <div className="absolute top-0 left-0 w-full h-[180px] bg-[#0A2540] z-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)' }} />
                  <div className="absolute top-[175px] left-0 w-full h-[10px] bg-[#00D4FF] z-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }} />
                  
                  {/* Logo Area */}
                  <div className="z-10 pt-8 px-6 pb-4 flex flex-col items-start justify-center">
                    <div className="h-[45px] flex items-center justify-start mb-2"><img loading="lazy" decoding="async" src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[180px] max-h-full object-contain drop-shadow-md" /></div>
                    <div className="text-white font-black text-[10px] tracking-[0.2em] uppercase">
                      {companyName}
                    </div>
                  </div>
                  
                  {/* Avatar - Sharp Corners */}
                  <div className="w-full px-6 mt-2 z-10 relative flex justify-end">
                    <div className="w-[130px] h-[150px] bg-white p-1 shadow-xl relative z-10 border border-slate-100">
                      <div className="w-full h-full overflow-hidden bg-slate-200 relative">
                        {user.avatar ? (
                          <img loading="lazy" decoding="async" src={user.avatar} alt="Profile" className="w-full h-full object-cover filter contrast-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-5xl font-black uppercase tracking-tighter">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col items-start justify-start w-full px-8 mt-8 z-10 text-left">
                    <h2 className="text-[26px] font-black text-[#0A2540] tracking-tight leading-none mb-1 uppercase">
                      {user.nameKh || user.name}
                    </h2>
                    
                    <div className="mt-3 px-3 py-1 bg-[#0A2540] inline-block border-l-4 border-[#00D4FF]">
                      <div className="text-white font-bold text-[10px] tracking-widest uppercase">
                        {user.position || "Staff Member"}
                      </div>
                    </div>
                    
                    <div className="w-full mt-auto mb-6 pt-4 border-t border-slate-200">
                      <div className="flex flex-col gap-1.5 text-[10px] text-slate-600">
                        {user.id && <div className="font-mono">ID: {user.id.substring(0,8).toUpperCase()}</div>}
                        {user.email && <div className="truncate">{user.email}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-white rounded-xl shadow-xl overflow-hidden relative flex flex-col items-center isolate border border-slate-300 p-8">
                  <div className="absolute top-0 right-0 w-[100px] h-full bg-[#0A2540] opacity-5 -z-10" />
                  <div className="absolute bottom-0 left-0 w-full h-[8px] bg-[#00D4FF] z-0" />
                  <div className="absolute bottom-[8px] left-0 w-full h-[24px] bg-[#0A2540] z-0" />
                  
                  <div className="w-full text-left mb-6 mt-4 relative z-10 border-b-2 border-slate-100 pb-4">
                    <h3 className="font-black text-[#00D4FF] tracking-[0.2em] text-[10px] uppercase mb-1">PROPERTY OF</h3>
                    <p className="text-[#0A2540] font-black text-lg uppercase tracking-wider">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                    <div className="bg-white p-3 shadow-lg border border-slate-200 mb-6">
                      <QRCode value={`${window.location.origin}/${settings?.slug || user?.companyId}/e/${user?.id}`} size={130} level="H" fgColor="#0A2540" />
                    </div>
                  </div>

                  <div className="w-full mt-auto space-y-4 pb-8 relative z-10 text-left">
                    <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider leading-relaxed">
                      This ID card is for official use only. Must be surrendered upon termination.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[9px] text-[#0A2540] font-bold flex flex-col gap-1 tracking-wider mt-4">
                        {companyPhone && <div>TEL: {companyPhone}</div>}
                        {officeAddress && <div className="truncate text-slate-500">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* --- 3. MODERN DARK TEMPLATE --- */}
            {selectedTemplate === 'modern' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-[#0f1115] rounded-3xl shadow-xl overflow-hidden relative flex flex-col items-center isolate border border-slate-800">
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10 opacity-50 z-0" />
                  <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-600/40 rounded-full blur-3xl -z-10" />
                  <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-pink-600/30 rounded-full blur-3xl -z-10" />
                  
                  {/* Top Company Logo */}
                  <div className="z-10 pt-8 px-6 w-full flex flex-row items-center justify-between">
                    <div className="h-12 flex items-center justify-start"><img loading="lazy" decoding="async" src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[140px] max-h-full object-contain drop-shadow-md" /></div>
                    <div className="text-white/80 font-mono text-[9px] tracking-[0.2em] uppercase text-right w-1/2 leading-tight">
                      {companyName}
                    </div>
                  </div>

                  {/* Avatar - Large Centered */}
                  <div className="w-full px-8 mt-10 z-10 relative flex justify-center">
                    <div className="w-[180px] h-[180px] rounded-3xl p-1 bg-gradient-to-br from-indigo-500 to-pink-500 shadow-2xl relative z-10">
                      <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900 relative">
                        {user.avatar ? (
                          <img loading="lazy" decoding="async" src={user.avatar} alt="Profile" className="w-full h-full object-cover opacity-90 grayscale contrast-125 hover:grayscale-0 transition-all" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-6xl font-black uppercase tracking-tighter">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col items-center justify-end w-full px-8 pb-10 z-10 text-center">
                    <h2 className="text-[28px] font-black text-white tracking-tight leading-none mb-1">
                      {user.nameKh || user.name}
                    </h2>
                    
                    <div className="mt-3 px-4 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                      <div className="text-pink-300 font-semibold text-[11px] tracking-widest uppercase">
                        {user.position || "Staff Member"}
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-[#0f1115] rounded-3xl shadow-xl overflow-hidden relative flex flex-col items-center isolate border border-slate-800 p-8">
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10 opacity-50 z-0" />
                  
                  <div className="w-full text-center mb-8 mt-4 relative z-10">
                    <h3 className="font-mono text-pink-400 tracking-[0.2em] text-[9px] uppercase mb-2">WORKSPACE ID</h3>
                    <p className="text-white font-black text-base uppercase tracking-wider">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                    <div className="bg-white/95 p-3 rounded-2xl shadow-2xl mb-6">
                      <QRCode value={`${window.location.origin}/${settings?.slug || user?.companyId}/e/${user?.id}`} size={130} level="H" fgColor="#0f1115" />
                    </div>
                  </div>

                  <div className="w-full mt-auto space-y-4 pt-6 relative text-center z-10 text-slate-400">
                    <div className="h-px w-1/2 mx-auto bg-white/10 mb-4" />
                    <p className="text-[9px] font-medium uppercase tracking-widest leading-relaxed">
                      Return to administration upon departure.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[10px] font-mono flex flex-col gap-1 tracking-wider text-white/80">
                        {companyPhone && <div>{companyPhone}</div>}
                        {officeAddress && <div className="truncate text-slate-500">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* --- 4. CREATIVE MESH TEMPLATE --- */}
            {selectedTemplate === 'creative' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-white rounded-[2rem] shadow-xl overflow-hidden relative flex flex-col items-center isolate border-0">
                  <div className="absolute inset-0 bg-[#FAFAFA] z-0" />
                  
                  {/* Organic Mesh Gradient Background */}
                  <div className="absolute top-0 left-0 w-full h-[65%] overflow-hidden z-0 rounded-b-[40px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-rose-500 to-fuchsia-600" />
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-yellow-400/40 blur-[50px] mix-blend-overlay rounded-full" />
                    <div className="absolute bottom-0 right-0 w-[150%] h-[150%] bg-blue-500/30 blur-[60px] mix-blend-overlay rounded-full" />
                    <div className="absolute inset-0 bg-[url('/images/stardust.png')] opacity-20" />
                  </div>
                  
                  {/* Company Logo */}
                  <div className="z-10 pt-8 px-6 pb-2 w-full flex flex-col items-center justify-center min-h-[90px]">
                    <div className="mb-2"><img loading="lazy" decoding="async" src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[160px] h-12 object-contain drop-shadow-md" /></div>
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-full flex justify-center mt-2 z-10 relative">
                    <div className="w-[160px] h-[160px] rounded-[40px] p-2 bg-white/20 backdrop-blur-md relative z-10 shadow-2xl border border-white/50 rotate-3 hover:rotate-0 transition-transform">
                      <div className="w-full h-full rounded-[32px] overflow-hidden bg-slate-100 relative -rotate-3 hover:rotate-0 transition-transform">
                        {user.avatar ? (
                          <img loading="lazy" decoding="async" src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-400 text-6xl font-black uppercase">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col items-center justify-center w-full px-8 mt-4 z-10 text-center">
                    <h2 className="text-[28px] font-black text-slate-800 tracking-tight leading-none mb-2">
                      {user.nameKh || user.name}
                    </h2>
                    
                    <div className="mt-1 px-5 py-2 rounded-[16px] bg-white border-2 border-rose-100 shadow-[0_4px_20px_rgba(244,63,94,0.1)]">
                      <div className="text-rose-500 font-bold text-[12px] tracking-widest uppercase">
                        {user.position || "Staff Member"}
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-[#FAFAFA] rounded-[2rem] shadow-xl overflow-hidden relative flex flex-col items-center isolate border-0 p-8">
                  <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-br from-orange-400 via-rose-500 to-fuchsia-600 rounded-b-[40px] opacity-10" />
                  
                  <div className="w-full text-center mb-8 mt-6 relative z-10">
                    <h3 className="font-bold text-rose-500 tracking-[0.2em] text-[10px] uppercase mb-1">TEAM MEMBER</h3>
                    <p className="text-slate-800 font-black text-lg uppercase tracking-wider">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                    <div className="bg-white p-4 rounded-[32px] shadow-[0_20px_40px_rgba(244,63,94,0.15)] mb-6 border border-rose-50 rotate-3">
                      <QRCode value={`${window.location.origin}/${settings?.slug || user?.companyId}/e/${user?.id}`} size={130} level="H" fgColor="#e11d48" />
                    </div>
                  </div>

                  <div className="w-full mt-auto space-y-4 pt-6 relative text-center z-10">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed">
                      This ID is the property of the company.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[10px] text-slate-700 font-bold flex flex-col gap-1 tracking-wider bg-white p-3 rounded-[16px] shadow-sm border border-slate-100">
                        {companyPhone && <div>{companyPhone}</div>}
                        {officeAddress && <div className="truncate text-slate-500 font-medium">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* --- 5. SWISS MINIMAL TEMPLATE --- */}
            {selectedTemplate === 'minimal' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-white rounded-none shadow-xl overflow-hidden relative flex flex-col isolate border-[12px] border-[#111]">
                  {/* Top Company Logo */}
                  <div className="z-10 pt-10 px-8 pb-4 w-full flex flex-col items-start justify-center border-b-[4px] border-[#111]">
                    <div className="h-12 flex items-center justify-start mb-4"><img loading="lazy" decoding="async" src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[160px] max-h-full object-contain brightness-0 invert drop-shadow-sm" /></div>
                    <div className="text-[#111] font-black text-[10px] tracking-[0.3em] uppercase">
                      {companyName}
                    </div>
                  </div>

                  {/* Avatar & Info Grid */}
                  <div className="w-full flex-1 relative flex flex-col">
                    <div className="w-full aspect-square bg-[#f0f0f0] relative z-10 overflow-hidden filter grayscale border-b-[4px] border-[#111]">
                      {user.avatar ? (
                        <img loading="lazy" decoding="async" src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-6xl font-black uppercase tracking-tighter">
                          {(user.nameKh || user.name).charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col items-start justify-center w-full px-8 py-4 z-10 text-left bg-white">
                      <h2 className="text-[24px] font-black text-[#111] tracking-tighter leading-none mb-1 uppercase">
                        {user.nameKh || user.name}
                      </h2>
                      <div className="text-[#666] font-bold text-[10px] tracking-[0.2em] uppercase mt-2">
                        {user.position || "Staff Member"}
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-[#111] rounded-none shadow-xl overflow-hidden relative flex flex-col items-start isolate border-[12px] border-[#111] p-8 text-white">
                  <div className="w-full text-left mb-8 mt-4 relative z-10 border-b-[4px] border-white/20 pb-4">
                    <h3 className="font-bold text-white/50 tracking-[0.2em] text-[9px] uppercase mb-2">AUTHORIZATION ID</h3>
                    <p className="font-black text-xl uppercase tracking-widest">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-start justify-center w-full relative z-10">
                    <div className="bg-white p-3 mb-6">
                      <QRCode value={`${window.location.origin}/${settings?.slug || user?.companyId}/e/${user?.id}`} size={140} level="H" fgColor="#111" />
                    </div>
                  </div>

                  <div className="w-full mt-auto pt-6 relative text-left z-10">
                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest leading-relaxed mb-4">
                      NON-TRANSFERABLE. PROPERTY OF ORGANIZATION. RETURN ON REQUEST.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[10px] font-bold flex flex-col gap-2 tracking-widest bg-white/10 p-4">
                        {companyPhone && <div>TEL: {companyPhone}</div>}
                        {officeAddress && <div className="truncate text-white/70">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* --- 6. TECH SLEEK TEMPLATE --- */}
            {selectedTemplate === 'tech' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-[#09090b] rounded-xl shadow-2xl overflow-hidden relative flex flex-col items-center isolate border-2 border-cyan-500/40">
                  {/* Cyber Grid */}
                  <div className="absolute inset-0 bg-[url('/images/black-scales.png')] opacity-30 z-0" />
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                  
                  {/* Tech Details */}
                  <div className="absolute top-4 right-4 text-[8px] font-mono text-cyan-500/50">SYS.ON // SECURE</div>
                  <div className="absolute bottom-4 left-4 text-[8px] font-mono text-cyan-500/50">UID: {user.id?.substring(0,6).toUpperCase()}</div>

                  {/* Top Company Logo */}
                  <div className="z-10 pt-10 px-6 pb-4 w-full flex flex-col items-center justify-center">
                    <div className="h-12 flex items-center justify-center mb-2"><img loading="lazy" decoding="async" src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[150px] max-h-full object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" /></div>
                    <div className="text-cyan-300/80 font-mono text-[10px] tracking-[0.25em] uppercase">
                      {companyName}
                    </div>
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-full flex justify-center mt-6 z-10 relative px-8">
                    <div className="absolute inset-0 bg-cyan-500/10 blur-xl h-40" />
                    <div className="w-full aspect-[4/5] p-1 bg-gradient-to-b from-cyan-400 via-cyan-900 to-transparent relative z-10 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                      <div className="w-full h-full overflow-hidden bg-slate-900 relative">
                        {user.avatar ? (
                          <img loading="lazy" decoding="async" src={user.avatar} alt="Profile" className="w-full h-full object-cover opacity-80 filter contrast-125 saturate-50 sepia-[.2] hue-rotate-[180deg]" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-cyan-900 text-6xl font-black uppercase">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                        {/* Scanline overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col items-center justify-start w-full px-8 mt-6 z-10 text-center">
                    <h2 className="text-[20px] font-black text-white tracking-widest leading-none mb-2 uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                      {user.nameKh || user.name}
                    </h2>
                    
                    <div className="mt-2 w-full flex justify-center">
                      <div className="px-6 py-1 border border-cyan-400/50 bg-cyan-950/40 text-cyan-300 font-mono text-[11px] tracking-[0.2em] uppercase shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                        {user.position || "Operator"}
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-[#09090b] rounded-xl shadow-2xl overflow-hidden relative flex flex-col items-center isolate border-2 border-cyan-500/40 p-8">
                  <div className="absolute inset-0 bg-[url('/images/black-scales.png')] opacity-30 z-0" />
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                  
                  <div className="w-full text-center mb-8 mt-4 relative z-10">
                    <h3 className="font-mono text-cyan-600 tracking-[0.3em] text-[9px] uppercase mb-2">ACCESS TERMINAL</h3>
                    <p className="text-cyan-300 font-black text-sm uppercase tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                    <div className="bg-white p-3 mb-6 shadow-[0_0_20px_rgba(34,211,238,0.3)] border-2 border-cyan-400">
                      <QRCode value={`${window.location.origin}/${settings?.slug || user?.companyId}/e/${user?.id}`} size={130} level="H" fgColor="#000" />
                    </div>
                  </div>

                  <div className="w-full mt-auto space-y-4 pt-6 border-t border-cyan-900/80 relative text-center z-10 bg-cyan-950/20 p-4">
                    <p className="text-[8px] font-mono text-cyan-500 uppercase tracking-widest leading-relaxed">
                      {">>"} SECURE CREDENTIAL. LOGGING ACTIVE.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[9px] text-cyan-300 font-mono flex flex-col gap-1 tracking-wider mt-2">
                        {companyPhone && <div>TEL: {companyPhone}</div>}
                        {officeAddress && <div className="truncate text-cyan-600">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* --- 7. EXECUTIVE GOLD TEMPLATE --- */}
            {selectedTemplate === 'executive' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-[#1a1c23] rounded-sm shadow-2xl overflow-hidden relative flex flex-col items-center isolate border border-[#2a2c35]">
                  <div className="absolute inset-0 bg-[url('/images/diagmonds-light.png')] opacity-5 z-0" />
                  
                  {/* Gold Foil Accents */}
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#d4af37]/60" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#d4af37]/60" />

                  {/* Top Company Logo */}
                  <div className="z-10 pt-12 px-8 pb-4 w-full flex flex-col items-center justify-center min-h-[100px]">
                    <div className="h-12 flex items-center justify-center mb-3"><img loading="lazy" decoding="async" src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[180px] max-h-full object-contain filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.2)] sepia-[.3] hue-rotate-[340deg]" /></div>
                    <div className="text-[#a89045] font-serif font-bold text-[11px] tracking-[0.25em] uppercase text-center">
                      {companyName}
                    </div>
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-full flex justify-center mt-6 z-10 relative">
                    <div className="w-[150px] h-[190px] p-[2px] bg-gradient-to-br from-[#d4af37] via-[#f3e5ab] to-[#aa771c] relative z-10 shadow-2xl">
                      <div className="w-full h-full overflow-hidden bg-slate-900 relative">
                        {user.avatar ? (
                          <img loading="lazy" decoding="async" src={user.avatar} alt="Profile" className="w-full h-full object-cover filter contrast-125 saturate-50" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#d4af37]/40 text-5xl font-serif">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col items-center justify-end w-full px-8 pb-12 z-10 text-center">
                    <h2 className="text-[24px] font-serif font-medium text-white tracking-widest leading-none mb-3 uppercase">
                      {user.nameKh || user.name}
                    </h2>
                    
                    <div className="w-8 h-[1px] bg-[#d4af37]/60 my-3" />
                    
                    <div className="text-[#d4af37] font-sans font-bold text-[10px] tracking-[0.2em] uppercase">
                      {user.position || "Executive"}
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-[#1a1c23] rounded-sm shadow-2xl overflow-hidden relative flex flex-col items-center isolate border border-[#2a2c35] p-8">
                  <div className="absolute inset-0 bg-[url('/images/diagmonds-light.png')] opacity-5 z-0" />
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#d4af37]/60" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#d4af37]/60" />
                  
                  <div className="w-full text-center mb-10 mt-8 relative z-10">
                    <h3 className="font-serif text-[#d4af37]/70 tracking-[0.3em] text-[9px] uppercase mb-2">PRIVILEGE ACCESS</h3>
                    <p className="text-[#d4af37] font-serif font-medium text-sm uppercase tracking-widest">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                    <div className="bg-white p-3 shadow-2xl mb-6 border-[3px] border-[#d4af37]">
                      <QRCode value={`${window.location.origin}/${settings?.slug || user?.companyId}/e/${user?.id}`} size={130} level="H" fgColor="#1a1c23" />
                    </div>
                  </div>

                  <div className="w-full mt-auto space-y-5 pt-8 relative text-center z-10">
                    <div className="absolute top-0 left-1/3 right-1/3 h-[1px] bg-[#d4af37]/40" />
                    <p className="text-[8px] text-slate-400 font-sans uppercase tracking-[0.2em] leading-relaxed">
                      Strictly confidential. If found, return immediately.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[9px] text-[#d4af37] font-serif flex flex-col gap-2 tracking-widest mt-4">
                        {companyPhone && <div>{companyPhone}</div>}
                        {officeAddress && <div className="truncate text-slate-500">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
