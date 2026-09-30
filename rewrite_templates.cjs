const fs = require('fs');

const content = `import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Download, X, Printer, Check } from "lucide-react";
import QRCode from "react-qr-code";
import { User } from "../types";
import { useCompanyStore } from "../store";
import * as htmlToImage from "html-to-image";

interface StaffIdCardModalProps {
  user: User;
  onClose: () => void;
}

export function StaffIdCardModal({ user, onClose }: StaffIdCardModalProps) {
  const { profile } = useCompanyStore();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'corporate' | 'modern' | 'creative' | 'minimal'>('corporate');
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  const companyName = profile?.name || "Company Name";
  const logoUrl = profile?.logoUrl || "";
  const companyPhone = profile?.phone || "";
  const officeAddress = profile?.address || "";

  const handleDownload = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;
    setIsExporting(true);
    try {
      const exportCard = async (ref, suffix) => {
        const dataUrl = await htmlToImage.toPng(ref, {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: 'transparent',
        });
        const link = document.createElement("a");
        link.download = \`ID_Card_\${user.name.replace(/\\s+/g, '_')}_\${suffix}.png\`;
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

  // Prevent scroll when modal is open
  const ScrollLock = () => {
    if (typeof window !== "undefined") {
      document.body.style.overflow = "hidden";
      return null;
    }
    return null;
  };

  const templates = [
    { id: 'corporate', name: 'Corporate' },
    { id: 'modern', name: 'Modern' },
    { id: 'creative', name: 'Creative' },
    { id: 'minimal', name: 'Minimal' }
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
          <div className="flex items-center justify-between md:hidden">
            <h3 className="font-bold text-slate-800 dark:text-white">Templates</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div className="hidden md:flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white">ID Card Design</h3>
          </div>

          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id as any)}
                className={\`flex items-center justify-between px-4 py-3 rounded-xl text-left whitespace-nowrap transition-all \${selectedTemplate === t.id ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-500/30' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50'}\`}
              >
                <span className="font-semibold text-sm">{t.name}</span>
                {selectedTemplate === t.id && <Check className="w-4 h-4" />}
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
              {isExporting ? "Saving..." : "Save Image"}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-10 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center print:p-0 print:bg-white overflow-y-auto">
          
          {/* Mobile Actions (Hidden on Desktop & Print) */}
          <div className="flex md:hidden gap-3 mb-6 w-full max-w-[340px] print:hidden">
            <button onClick={handlePrint} className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-semibold shadow-sm border border-slate-200 dark:border-slate-700">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleDownload} disabled={isExporting} className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-sm">
              <Download className="w-4 h-4" /> Save
            </button>
          </div>

          <style>
            {\`
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
            \`}
          </style>

          <div
            id="id-card-print-area"
            className="flex flex-col xl:flex-row gap-8 bg-transparent"
            style={{
              width: "max-content",
              padding: "20px",
              margin: "0 auto"
            }}
          >
            {selectedTemplate === 'corporate' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-white rounded-2xl shadow-xl overflow-hidden relative flex flex-col items-center isolate border border-slate-200">
                  <div className="absolute top-0 left-0 right-0 h-[140px] bg-[#3B5A9A] z-0 rounded-b-md" />
                  <div className="absolute bottom-0 left-0 right-0 h-[24px] bg-[#3B5A9A] z-0" />
                  
                  <div className="z-10 w-full flex flex-col items-center pt-8 px-6 h-[80px]">
                    {logoUrl ? (
                      <div className="h-10 flex items-center justify-center relative z-10 w-full">
                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain brightness-0 invert" />
                      </div>
                    ) : (
                      <div className="text-white font-black text-xl tracking-wide text-center relative z-10 uppercase">
                        {companyName}
                      </div>
                    )}
                  </div>
                  
                  <div className="z-10 mt-6 relative">
                    <div className="w-[140px] h-[160px] rounded-2xl bg-white relative z-10 shadow-sm border-4 border-[#1E3A70]">
                      <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 relative">
                        {user.avatar ? (
                          <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-5xl font-black uppercase tracking-tighter">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-start w-full px-8 mt-5 z-10 relative">
                    <h2 className="text-[26px] font-black text-[#1A2849] text-center tracking-tight leading-none mb-1">
                      {user.nameKh || user.name}
                    </h2>
                    {user.nameKh && (
                      <h3 className="text-sm font-bold text-[#1A2849] tracking-wide mt-0.5">
                        {user.name}
                      </h3>
                    )}
                    
                    <div className="px-4 py-1 bg-[#F4C543] mt-2 mb-6">
                      <div className="text-[#111111] font-bold text-sm tracking-wide text-center leading-snug uppercase">
                        {user.position || "Staff Member"}
                      </div>
                    </div>
                    
                    <div className="w-full flex flex-col gap-2">
                      {user.email && (
                        <div className="flex text-[14px]">
                          <div className="font-bold text-[#1A2849] w-[70px]">Email</div>
                          <div className="font-bold text-[#1A2849] mr-2">:</div>
                          <div className="text-[#1A2849] font-medium flex-1 truncate">{user.email}</div>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex text-[14px]">
                          <div className="font-bold text-[#1A2849] w-[70px]">Phone</div>
                          <div className="font-bold text-[#1A2849] mr-2">:</div>
                          <div className="text-[#1A2849] font-medium flex-1">{user.phone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-white rounded-2xl shadow-xl overflow-hidden relative flex flex-col items-center isolate border border-slate-200">
                  <div className="absolute top-0 left-0 right-0 h-[24px] bg-[#3B5A9A] z-0" />
                  <div className="absolute bottom-0 left-0 right-0 h-[24px] bg-[#3B5A9A] z-0" />
                  
                  <div className="w-full text-center mb-6 mt-12">
                    <h3 className="font-black text-[#1A2849] tracking-widest text-xs uppercase mb-1">Property Of</h3>
                    <p className="text-[#1A2849] font-bold text-lg">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                    <div className="bg-white p-4 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-slate-100 mb-6">
                      <QRCode value={\`\${window.location.origin}/e/\${user?.companyId}/\${user?.id}\`} size={150} level="H" />
                    </div>
                    <p className="text-[12px] text-slate-600 font-medium text-center max-w-[240px] leading-relaxed">
                      Scan this QR code using the company scanner for attendance verification.
                    </p>
                  </div>

                  <div className="w-full mt-auto space-y-4 pt-6 pb-12 relative px-8">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-slate-200" />
                    <p className="text-[10px] text-slate-500 text-center leading-relaxed font-semibold uppercase tracking-wide">
                      This card is non-transferable and must be returned upon termination of employment.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[11px] text-[#1A2849] font-bold text-center flex flex-col gap-1 mt-2">
                        {companyPhone && <div className="tracking-widest">{companyPhone}</div>}
                        {officeAddress && <div className="truncate text-slate-600 font-medium">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedTemplate === 'modern' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-slate-50 rounded-[1.5rem] shadow-xl overflow-hidden relative flex flex-col items-center border border-slate-200/60 isolate">
                  <div className="absolute top-0 left-0 right-0 h-[190px] bg-white border-b border-slate-200 flex flex-col items-center justify-start pt-6 z-0">
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]" />
                    <div className="z-10 w-full flex flex-col items-center px-6">
                      {logoUrl ? (
                        <div className="h-14 flex items-center justify-center relative z-10 w-full mb-2">
                          <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-sm" />
                        </div>
                      ) : (
                        <div className="text-slate-800 font-black text-xl tracking-wide mb-2 text-center relative z-10 uppercase">
                          {companyName}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="z-10 mt-[130px] relative">
                    <div className="w-32 h-32 rounded-full bg-slate-50 p-1.5 shadow-md relative z-10">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white border border-slate-200 relative shadow-inner">
                        {user.avatar ? (
                          <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-5xl font-black uppercase tracking-tighter">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-start w-full px-8 mt-5 z-10 relative">
                    <h2 className="text-[22px] font-black text-slate-800 text-center tracking-tight leading-tight" style={{ fontFamily: "'Khmer OS Battambang', sans-serif" }}>
                      {user.nameKh || user.name}
                    </h2>
                    {user.nameKh && (
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {user.name}
                      </h3>
                    )}
                    
                    <div className="w-12 h-[2px] bg-indigo-500 rounded-full mt-4 mb-4" />

                    <div className="text-indigo-600 font-black text-sm tracking-widest uppercase text-center leading-snug">
                      {user.position || "Staff Member"}
                    </div>

                    <div className="w-full flex flex-col gap-1.5 mt-5 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      {user.email && (
                        <div className="flex items-center text-[12px]">
                          <span className="text-slate-400 w-5">@</span>
                          <span className="text-slate-600 font-medium truncate flex-1">{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center text-[12px]">
                          <span className="text-slate-400 w-5">#</span>
                          <span className="text-slate-600 font-medium truncate flex-1">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-800 py-3 mt-auto flex justify-center items-center">
                    <span className="text-white/90 text-[10px] font-bold uppercase tracking-[0.3em]">
                      Official Identity Card
                    </span>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-slate-50 rounded-[1.5rem] shadow-xl overflow-hidden relative flex flex-col items-center border border-slate-200/60 p-8">
                  <div className="w-full text-center mb-6 mt-2">
                    <h3 className="font-black text-slate-400 tracking-[0.2em] text-xs uppercase mb-1">Property Of</h3>
                    <p className="text-slate-800 font-bold text-base">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-6 relative">
                      <QRCode value={\`\${window.location.origin}/e/\${user?.companyId}/\${user?.id}\`} size={150} level="H" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold text-center max-w-[240px] leading-relaxed">
                      Scan this QR code using the company scanner for attendance verification.
                    </p>
                  </div>

                  <div className="w-full mt-auto space-y-4 pt-6 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-slate-200" />
                    <p className="text-[9px] text-slate-400 text-center leading-relaxed font-semibold uppercase tracking-wide">
                      This card is non-transferable and must be returned upon termination of employment. 
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[10px] text-slate-700 font-bold text-center flex flex-col gap-1 mt-2">
                        {companyPhone && <div className="tracking-widest">{companyPhone}</div>}
                        {officeAddress && <div className="truncate text-slate-500 font-medium">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedTemplate === 'creative' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-white rounded-2xl shadow-xl overflow-hidden relative flex flex-col items-center isolate">
                  <div className="absolute top-0 left-0 right-0 bottom-1/2 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 z-0" />
                  
                  {/* Wave divider */}
                  <svg className="absolute top-1/2 left-0 w-full h-16 -translate-y-[98%] text-white" preserveAspectRatio="none" viewBox="0 0 1440 320" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,160L60,149.3C120,139,240,117,360,133.3C480,149,600,203,720,202.7C840,203,960,149,1080,128C1200,107,1320,117,1380,122.7L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
                  </svg>
                  
                  <div className="z-10 w-full flex flex-col items-center pt-8 px-6">
                    {logoUrl ? (
                      <div className="h-10 flex items-center justify-center relative z-10 w-full">
                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain brightness-0 invert" />
                      </div>
                    ) : (
                      <div className="text-white font-black text-xl tracking-wide text-center relative z-10 uppercase">
                        {companyName}
                      </div>
                    )}
                  </div>
                  
                  <div className="z-10 mt-8 relative">
                    <div className="w-[120px] h-[120px] rounded-full bg-white p-1.5 shadow-xl relative z-10">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 relative border-2 border-white">
                        {user.avatar ? (
                          <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-500 text-5xl font-black uppercase tracking-tighter">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-start w-full px-8 mt-4 z-10 relative bg-white">
                    <h2 className="text-[24px] font-black text-slate-800 text-center tracking-tight leading-none mb-1">
                      {user.nameKh || user.name}
                    </h2>
                    {user.nameKh && (
                      <h3 className="text-sm font-bold text-slate-400 tracking-wide mt-1">
                        {user.name}
                      </h3>
                    )}
                    
                    <div className="text-pink-500 font-bold text-sm tracking-widest uppercase text-center mt-3">
                      {user.position || "Staff Member"}
                    </div>
                    
                    <div className="w-full flex flex-col items-center gap-1.5 mt-6">
                      {user.email && (
                        <div className="text-slate-600 text-xs font-medium bg-slate-50 px-4 py-1.5 rounded-full w-full text-center truncate">
                          {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="text-slate-600 text-xs font-medium bg-slate-50 px-4 py-1.5 rounded-full w-full text-center">
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-white rounded-2xl shadow-xl overflow-hidden relative flex flex-col items-center isolate">
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400" />
                  
                  <div className="w-full text-center mb-6 mt-12">
                    <h3 className="font-black text-slate-400 tracking-[0.2em] text-xs uppercase mb-1">Property Of</h3>
                    <p className="text-slate-800 font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-orange-400">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                    <div className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-slate-100 mb-6">
                      <QRCode value={\`\${window.location.origin}/e/\${user?.companyId}/\${user?.id}\`} size={150} level="H" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium text-center max-w-[240px] leading-relaxed">
                      Scan this QR code using the company scanner for attendance verification.
                    </p>
                  </div>

                  <div className="w-full mt-auto space-y-4 pt-6 pb-12 relative px-8">
                    <p className="text-[9px] text-slate-400 text-center leading-relaxed font-semibold uppercase tracking-wide">
                      This card is non-transferable and must be returned upon termination of employment.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[10px] text-slate-700 font-bold text-center flex flex-col gap-1 mt-2">
                        {companyPhone && <div className="tracking-widest">{companyPhone}</div>}
                        {officeAddress && <div className="truncate text-slate-500 font-medium">{officeAddress}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedTemplate === 'minimal' && (
              <>
                <div ref={frontCardRef} className="w-[340px] h-[540px] bg-white rounded-md shadow-xl overflow-hidden relative flex flex-col items-center isolate border-2 border-black">
                  
                  <div className="z-10 w-full flex flex-col items-center pt-10 px-6 pb-6 border-b-2 border-black">
                    {logoUrl ? (
                      <div className="h-10 flex items-center justify-center relative z-10 w-full">
                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain grayscale" />
                      </div>
                    ) : (
                      <div className="text-black font-black text-xl tracking-widest text-center relative z-10 uppercase">
                        {companyName}
                      </div>
                    )}
                  </div>
                  
                  <div className="z-10 mt-8 relative w-full px-8 flex justify-center">
                    <div className="w-32 h-32 bg-white relative z-10 border-2 border-black p-1">
                      <div className="w-full h-full overflow-hidden bg-slate-100 relative">
                        {user.avatar ? (
                          <img src={user.avatar} alt="Profile" className="w-full h-full object-cover grayscale" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white text-black text-5xl font-black uppercase tracking-tighter">
                            {(user.nameKh || user.name).charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-start w-full px-8 mt-6 z-10 relative">
                    <h2 className="text-[24px] font-black text-black text-center tracking-tighter leading-none mb-1 uppercase">
                      {user.nameKh || user.name}
                    </h2>
                    {user.nameKh && (
                      <h3 className="text-xs font-bold text-black uppercase tracking-widest mt-1">
                        {user.name}
                      </h3>
                    )}
                    
                    <div className="text-black font-bold text-xs tracking-[0.2em] uppercase text-center mt-4 border-t-2 border-black pt-4 w-full">
                      {user.position || "Staff Member"}
                    </div>
                    
                    <div className="w-full flex flex-col gap-1.5 mt-auto mb-6 text-center">
                      {user.email && (
                        <div className="text-black text-[11px] font-bold uppercase tracking-widest truncate">
                          {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="text-black text-[11px] font-bold uppercase tracking-widest">
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div ref={backCardRef} className="w-[340px] h-[540px] bg-white rounded-md shadow-xl overflow-hidden relative flex flex-col items-center isolate border-2 border-black p-8">
                  <div className="w-full text-center mb-6 mt-4">
                    <h3 className="font-black text-black tracking-[0.2em] text-[10px] uppercase mb-2">Property Of</h3>
                    <p className="text-black font-black text-lg uppercase tracking-widest">{companyName}</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                    <div className="bg-white p-3 border-2 border-black mb-6 relative">
                      <QRCode value={\`\${window.location.origin}/e/\${user?.companyId}/\${user?.id}\`} size={140} level="H" />
                    </div>
                  </div>

                  <div className="w-full mt-auto space-y-4 pt-6 border-t-2 border-black relative">
                    <p className="text-[9px] text-black text-center leading-relaxed font-bold uppercase tracking-widest">
                      This card is non-transferable and must be returned upon termination of employment.
                    </p>
                    {(companyPhone || officeAddress) && (
                      <div className="text-[9px] text-black font-black text-center flex flex-col gap-1 mt-4 uppercase tracking-widest">
                        {companyPhone && <div>{companyPhone}</div>}
                        {officeAddress && <div className="truncate">{officeAddress}</div>}
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
`;

fs.writeFileSync('src/components/StaffIdCardModal.tsx', content);
