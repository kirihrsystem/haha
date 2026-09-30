import React, { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Download, Printer, CheckCircle2 } from "lucide-react";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

interface QRPrintCardProps {
  companyCode: string;
  loginUrl: string;
  companyLogoUrl?: string;
  companyName?: string;
}

type CardStyle = 'premium' | 'clean' | 'professional' | 'viral';

const STYLE_OPTIONS: { value: CardStyle; label: string }[] = [
  { value: 'premium', label: 'Premium Platinum' },
  { value: 'clean', label: 'Clean (Minimalist)' },
  { value: 'professional', label: 'Professional (Corporate)' },
  { value: 'viral', label: 'Viral (Bold & Trendy)' }
];

export default function QRPrintCard({ companyCode, loginUrl, companyLogoUrl, companyName }: QRPrintCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [cardStyle, setCardStyle] = useState<CardStyle>('premium');
  const { t } = useTranslation();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const filter = (node: HTMLElement) => {
        return !node.classList?.contains('no-print');
      };
      
      // Wait a tiny bit for any layout shifts
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1, 
        pixelRatio: 3, 
        filter,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `workspace-qr-${companyCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert(t("failedToDownload") || "Failed to download QR card. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const fullUrl = loginUrl;

  const renderPremium = () => (
    <div className="flex flex-col h-full bg-slate-50 font-sans print:h-screen relative overflow-hidden isolate border-[8px] border-white text-slate-800">
      {/* Premium Background Effects */}
      <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[60%] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[60%] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <div className="px-10 py-12 print:py-16 shrink-0 relative flex flex-col items-center">
        <img src={companyLogoUrl || "/logo.png"} alt="Logo" className="h-20 print:h-28 object-contain mb-8 print:mb-12 drop-shadow-md" />
        {!companyLogoUrl && (<div className="flex flex-col items-center text-center">
              <h2 className="font-black text-3xl print:text-5xl text-slate-800 tracking-tight leading-none uppercase">
                {companyName ? companyName.split(' ')[0] : "Organization"}
              </h2>
              <div className="text-indigo-600 text-[11px] print:text-sm tracking-[0.3em] uppercase font-bold mt-2">
                {(companyName && companyName.split(' ').slice(1).join(' ')) || 'WORKSPACE PORTAL'}
              </div>
            </div>
        )}
      </div>

      <div className="px-10 flex-grow flex flex-col items-center justify-center relative print:px-16 print:py-6 z-10 w-full">
        {/* Hover card for QR */}
        <div className="p-2 print:p-3 rounded-[2.5rem] print:rounded-[3.5rem] bg-gradient-to-tr from-indigo-200 via-blue-100 to-emerald-100 mb-8 print:mb-12 shadow-2xl">
          <div className="p-5 print:p-10 rounded-[2rem] print:rounded-[3rem] bg-white border border-white">
             <div className="print:hidden"><QRCode value={loginUrl} size={180} level="Q" fgColor="#1e1b4b" bgColor="transparent" /></div>
             <div className="hidden print:block"><QRCode value={loginUrl} size={300} level="Q" fgColor="#1e1b4b" bgColor="transparent" /></div>
          </div>
        </div>
        
        <div className="w-full max-w-sm print:max-w-xl mx-auto space-y-4 print:space-y-6">
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 print:p-8 border border-white text-center shadow-lg">
            <p className="text-slate-400 font-bold tracking-[0.2em] uppercase text-[10px] print:text-sm mb-2">Workspace Access Code</p>
            <p className="text-slate-800 font-black text-6xl print:text-8xl tracking-tight drop-shadow-sm">{companyCode}</p>
          </div>
          
          <div className="bg-slate-100/80 backdrop-blur-md rounded-[1.75rem] p-4 print:p-6 border border-slate-200/50 text-center shadow-md">
             <p className="text-slate-400 font-bold tracking-[0.2em] uppercase text-[9px] print:text-xs mb-2">Direct Portal Link</p>
             <p className="text-indigo-600 font-bold text-xs print:text-base break-all px-2 tracking-wide">{fullUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClean = () => (
    <div className="flex flex-col h-full bg-white font-sans print:h-screen text-slate-900">
      <div className="px-10 py-12 print:py-20 flex-grow flex flex-col items-center justify-center relative text-center">
        <img src={companyLogoUrl || "/logo.png"} alt="Logo" className="h-16 print:h-24 object-contain mb-8 print:mb-12 grayscale opacity-90" />
        {!companyLogoUrl && (
          <h2 className="font-semibold text-3xl print:text-5xl text-black mb-8 print:mb-12 tracking-tight">{companyName || "Organization"}</h2>
        )}
        
        <div className="p-4 print:p-8 bg-white border border-slate-200 rounded-[2rem] print:rounded-[3rem] shadow-lg shadow-black/5 mb-10 print:mb-16">
          <div className="print:hidden"><QRCode value={loginUrl} size={180} level="M" fgColor="#000000" /></div>
          <div className="hidden print:block"><QRCode value={loginUrl} size={300} level="M" fgColor="#000000" /></div>
        </div>
        
        <div className="space-y-6 print:space-y-10 w-full max-w-sm print:max-w-xl mx-auto">
          <div>
            <p className="text-slate-400 font-medium tracking-widest uppercase text-[10px] print:text-xs mb-1">Workspace Code</p>
            <p className="text-black font-semibold text-5xl print:text-7xl tracking-widest">{companyCode}</p>
          </div>
          <div className="border-t border-slate-100 pt-6 print:pt-10">
             <p className="text-slate-400 font-medium tracking-widest uppercase text-[9px] print:text-xs mb-2">Gateway Link</p>
             <p className="text-slate-600 font-medium text-xs print:text-base break-all px-4">{fullUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfessional = () => (
    <div className="flex flex-col h-full bg-slate-50 font-sans print:h-screen">
      <div className="bg-[#0b2c5e] text-white px-8 py-10 print:py-16 shrink-0 relative flex flex-col items-center text-center">
        <div className="h-16 print:h-24 shrink-0 shadow-xl shadow-black/5 mb-4 print:mb-6">
            <img src={companyLogoUrl || "/logo.png"} alt="Logo" className="h-full object-contain" />
          </div>
        <h3 className="font-bold text-2xl print:text-4xl tracking-tight leading-tight">{companyName || "Organization"}</h3>
        <p className="text-blue-200/80 font-semibold tracking-widest uppercase text-xs print:text-sm mt-2">Employee Authenticator</p>
      </div>
      
      <div className="px-8 flex-grow flex flex-col items-center justify-center relative print:px-16 print:py-10 z-10 -mt-6 print:-mt-10">
        <div className="p-4 print:p-8 rounded-3xl bg-white shadow-xl border border-slate-100 mb-6 print:mb-10">
           <div className="print:hidden"><QRCode value={loginUrl} size={180} level="H" fgColor="#0b2c5e" bgColor="transparent" /></div>
           <div className="hidden print:block"><QRCode value={loginUrl} size={300} level="H" fgColor="#0b2c5e" bgColor="transparent" /></div>
        </div>
        
        <div className="w-full max-w-sm print:max-w-xl mx-auto space-y-4 print:space-y-6">
          <div className="bg-white rounded-[1.75rem] p-5 print:p-8 border border-slate-200 text-center shadow-lg shadow-black/5">
            <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px] print:text-sm mb-1">Access Code</p>
            <p className="text-[#0b2c5e] font-mono font-bold text-4xl print:text-6xl tracking-widest">{companyCode}</p>
          </div>
          
          <div className="bg-white rounded-[1.75rem] p-4 print:p-6 border border-slate-200 text-center shadow-lg shadow-black/5">
             <p className="text-slate-400 font-bold tracking-widest uppercase text-[9px] print:text-xs mb-1">Direct Link</p>
             <p className="text-blue-700 font-medium text-xs print:text-base break-all px-2">{fullUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderViral = () => (
    <div className="flex flex-col h-full bg-[#050505] font-sans print:h-screen relative overflow-hidden text-white">
      {/* High impact glow blobs */}
      <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-fuchsia-600/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/30 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="px-8 py-10 print:py-16 shrink-0 relative z-10 flex flex-col items-center">
        <img src={companyLogoUrl || "/logo.png"} alt="Logo" className="h-16 print:h-24 object-contain mb-6 print:mb-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
        {!companyLogoUrl && (
          <h2 className="font-extrabold text-3xl print:text-5xl text-white mb-6 print:mb-10 tracking-tight drop-shadow-xl shadow-black/5">{companyName || "Organization"}</h2>
        )}
      </div>

      <div className="px-8 flex-grow flex flex-col items-center justify-center relative print:px-16 print:py-10 z-10 w-full">
        {/* Hover card for QR */}
        <div className="p-2 print:p-3 rounded-[2rem] print:rounded-[3rem] bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-emerald-400 mb-8 print:mb-12 hover:scale-105 transition-transform duration-500 shadow-[0_0_40px_rgba(217,70,239,0.3)]">
          <div className="p-4 print:p-8 rounded-[1.6rem] print:rounded-[2.6rem] bg-white">
             <div className="print:hidden"><QRCode value={loginUrl} size={180} level="Q" fgColor="#000000" bgColor="transparent" /></div>
             <div className="hidden print:block"><QRCode value={loginUrl} size={300} level="Q" fgColor="#000000" bgColor="transparent" /></div>
          </div>
        </div>
        
        <div className="w-full max-w-sm print:max-w-xl mx-auto space-y-4 print:space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 print:p-8 border border-white/20 text-center relative overflow-hidden shadow-2xl">
            <p className="text-white/60 font-bold tracking-[0.2em] uppercase text-[10px] print:text-sm mb-2">Access Code</p>
            <p className="text-white font-black text-6xl print:text-8xl tracking-tight drop-shadow-lg">{companyCode}</p>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md rounded-[1.75rem] p-4 print:p-6 border border-white/10 text-center shadow-xl">
             <p className="text-white/40 font-bold tracking-[0.2em] uppercase text-[9px] print:text-xs mb-2">Gateway Link</p>
             <p className="text-white font-bold text-xs print:text-base break-all px-2">{fullUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="flex flex-col w-full no-print">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-1">Card Design Style</label>
        <div className="relative">
          <select 
            value={cardStyle}
            onChange={(e) => setCardStyle(e.target.value as CardStyle)}
            className="w-full appearance-none bg-white border border-slate-200 text-slate-700 font-medium py-3 px-4 pr-10 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg shadow-black/5 hover:bg-slate-50 transition-colors"
          >
            {STYLE_OPTIONS.map((option, idx) => (
              <option key={`${option.value}-${idx}`} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <motion.div 
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div 
          ref={cardRef} 
          className="w-full bg-white flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative print:w-full print:h-full print:max-w-none print:shadow-none print:border-none print:rounded-none print:m-0"
        >
          {cardStyle === 'premium' && renderPremium()}
          {cardStyle === 'clean' && renderClean()}
          {cardStyle === 'professional' && renderProfessional()}
          {cardStyle === 'viral' && renderViral()}
        </div>
      </motion.div>
      
      {/* Action Buttons BELOW the card */}
      <div className="flex flex-col gap-3 w-full max-w-[420px] no-print mt-2">
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-[1.5rem] bg-[#0A0F1C] hover:bg-black text-white font-mono font-medium text-sm print:hidden transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer border border-[#1e293b]"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{downloading ? (t("generating") || "SYSTEM WORKING..." ) : (t("downloadQR") || "DOWNLOAD HI-RES CARD")}</span>
        </button>
        <button 
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-4 rounded-[1.5rem] bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-mono font-medium text-sm transition-all shadow-lg shadow-black/5 active:scale-[0.98] cursor-pointer print:hidden"
        >
          <Printer className="w-4 h-4 shrink-0" />
          <span>{t("printCard") || "PRINT A4 POSTER"}</span>
        </button>
      </div>
    </div>
  );
}
