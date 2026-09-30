const fs = require('fs');

let content = fs.readFileSync('src/components/StaffIdCardModal.tsx', 'utf8');

const newIdCardStr = `
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
`;

content = content.replace(
  /\{\/\* Front Side \*\/\}[\s\S]*\{\/\* Back Side \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/motion\.div>/,
  newIdCardStr + '\n          </div>\n        </motion.div>\n      </motion.div>\n'
);

fs.writeFileSync('src/components/StaffIdCardModal.tsx', content);
