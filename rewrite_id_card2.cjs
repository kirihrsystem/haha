const fs = require('fs');

let content = fs.readFileSync('src/components/StaffIdCardModal.tsx', 'utf8');

// Add state for template selection
content = content.replace(
  /const \[isExporting, setIsExporting\] = useState\(false\);/,
  `const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'corporate'>('corporate');`
);

// Add template selector buttons
content = content.replace(
  /<div className="flex flex-wrap gap-3 mb-6 w-full max-w-\[700px\] justify-center sm:justify-end print:hidden">/,
  `<div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 w-full max-w-[750px] print:hidden">
            <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
              <button
                onClick={() => setSelectedTemplate('corporate')}
                className={\`px-4 py-2 rounded-lg text-sm font-bold transition-all \${selectedTemplate === 'corporate' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white hover:bg-white/10'}\`}
              >
                Corporate
              </button>
              <button
                onClick={() => setSelectedTemplate('modern')}
                className={\`px-4 py-2 rounded-lg text-sm font-bold transition-all \${selectedTemplate === 'modern' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white hover:bg-white/10'}\`}
              >
                Modern
              </button>
            </div>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-end">`
);

content = content.replace(
  /<\/button>\s*<\/div>\s*<style>/,
  `</button>\n            </div>\n          </div>\n          <style>`
);

const renderCorporate = `
{selectedTemplate === 'corporate' && (
          <div
            id="id-card-print-area"
            className="flex flex-col sm:flex-row gap-6 bg-transparent"
            style={{
              width: "max-content",
              padding: "20px",
              margin: "0 auto"
            }}
          >
            {/* Front Side */}
            <div ref={frontCardRef} className="w-[340px] h-[540px] bg-white rounded-2xl shadow-2xl overflow-hidden relative flex flex-col items-center isolate border border-slate-200">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 h-[140px] bg-[#3B5A9A] z-0 rounded-b-md" />
              <div className="absolute bottom-0 left-0 right-0 h-[24px] bg-[#3B5A9A] z-0" />
              
              {/* Logo Section */}
              <div className="z-10 w-full flex flex-col items-center pt-6 px-6 h-[100px]">
                {logoUrl ? (
                  <div className="h-12 flex items-center justify-center relative z-10">
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-sm brightness-0 invert" />
                  </div>
                ) : (
                  <div className="text-white font-black text-xl tracking-wide text-center relative z-10 uppercase">
                    {companyName}
                  </div>
                )}
              </div>
              
              {/* Profile Photo */}
              <div className="z-10 mt-2 relative">
                <div className="w-[140px] h-[160px] rounded-[1.5rem] bg-white p-1 relative z-10 shadow-sm border-4 border-[#1E3A70]">
                  <div className="w-full h-full rounded-[1.1rem] overflow-hidden bg-slate-100 relative">
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

              {/* Employee Details */}
              <div className="flex-1 flex flex-col items-center justify-start w-full px-6 mt-4 z-10 relative">
                <h2 className="text-[26px] font-black text-[#1A2849] text-center tracking-tight leading-tight">
                  {user.nameKh || user.name}
                </h2>
                {user.nameKh && (
                  <h3 className="text-sm font-bold text-[#1A2849] tracking-wide mt-0.5">
                    {user.name}
                  </h3>
                )}
                
                <div className="px-4 py-1.5 bg-[#F4C543] mt-2 mb-5 inline-block">
                  <div className="text-[#111111] font-bold text-sm tracking-wide uppercase text-center leading-snug">
                    {user.position || "Staff Member"}
                  </div>
                </div>
                
                <div className="w-full px-4 flex flex-col gap-2 mt-2">
                  <div className="flex text-[13px]">
                    <div className="font-bold text-[#1A2849] w-[65px]">Branch</div>
                    <div className="font-bold text-[#1A2849] mr-2">:</div>
                    <div className="text-slate-700 font-medium truncate flex-1">{user.branch || "Head Office"}</div>
                  </div>
                  {user.email && (
                    <div className="flex text-[13px]">
                      <div className="font-bold text-[#1A2849] w-[65px]">Email</div>
                      <div className="font-bold text-[#1A2849] mr-2">:</div>
                      <div className="text-slate-700 font-medium truncate flex-1">{user.email}</div>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex text-[13px]">
                      <div className="font-bold text-[#1A2849] w-[65px]">Phone</div>
                      <div className="font-bold text-[#1A2849] mr-2">:</div>
                      <div className="text-slate-700 font-medium truncate flex-1">{user.phone}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer Barcode replacement (Using a generic visual since Pincode is hidden) */}
              <div className="w-[180px] h-[36px] mt-auto mb-10 flex gap-0.5 justify-center">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="bg-slate-800 h-full" style={{ width: Math.random() > 0.5 ? '2px' : '4px', opacity: Math.random() > 0.3 ? 1 : 0 }} />
                ))}
              </div>
            </div>

            {/* Back Side */}
            <div ref={backCardRef} className="w-[340px] h-[540px] bg-white rounded-2xl shadow-2xl overflow-hidden relative flex flex-col items-center isolate border border-slate-200">
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
          </div>
)}
`;

const renderModern = `
{selectedTemplate === 'modern' && (
  <div
            id="id-card-print-area"
            className="flex flex-col sm:flex-row gap-6 bg-transparent"
            style={{
              width: "max-content",
              padding: "20px",
              margin: "0 auto"
            }}
          >
            {/* Front Side */}
            <div ref={frontCardRef} className="w-[340px] h-[540px] bg-slate-50 rounded-[1.5rem] shadow-2xl overflow-hidden relative flex flex-col items-center border border-slate-200/60 isolate">
              {/* Top Banner */}
              <div className="absolute top-0 left-0 right-0 h-[190px] bg-white border-b border-slate-200 flex flex-col items-center justify-start pt-6 z-0">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]" />
                
                {/* Logo Section without frame/shape */}
                <div className="z-10 w-full flex flex-col items-center px-6">
                  {logoUrl ? (
                    <div className="h-16 flex items-center justify-center relative z-10 mb-2">
                      <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-sm" />
                    </div>
                  ) : (
                    <div className="text-slate-800 font-black text-xl tracking-wide mb-2 text-center relative z-10 uppercase">
                      {companyName}
                    </div>
                  )}
                  {logoUrl && (
                    <div className="text-slate-600 font-bold text-xs tracking-widest text-center uppercase relative z-10">
                      {companyName}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile Photo - Overlapping the banner and body */}
              <div className="z-10 mt-[120px] relative">
                <div className="w-36 h-36 rounded-full bg-slate-50 p-1.5 shadow-md relative z-10">
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

              {/* Employee Details */}
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
                {user.branch && (
                  <div className="text-slate-500 font-semibold text-xs tracking-wider uppercase text-center mt-1.5">
                    {user.branch}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="w-full bg-slate-800 py-3 mt-auto flex justify-center items-center">
                <span className="text-white/90 text-[10px] font-bold uppercase tracking-[0.3em]">
                  Official Identity Card
                </span>
              </div>
            </div>

            {/* Back Side */}
            <div ref={backCardRef} className="w-[340px] h-[540px] bg-slate-50 rounded-[1.5rem] shadow-2xl overflow-hidden relative flex flex-col items-center border border-slate-200/60 p-8">
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
                  If found, please return to the issuing office.
                </p>
                
                {(companyPhone || officeAddress) && (
                  <div className="text-[10px] text-slate-700 font-bold text-center flex flex-col gap-1 mt-2">
                    {companyPhone && <div className="tracking-widest">{companyPhone}</div>}
                    {officeAddress && <div className="truncate text-slate-500 font-medium">{officeAddress}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
)}
`;

content = content.replace(
  /<div\s*id="id-card-print-area"[\s\S]*?\{\/\* Back Side \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  renderCorporate + "\n" + renderModern
);

fs.writeFileSync('src/components/StaffIdCardModal.tsx', content);
