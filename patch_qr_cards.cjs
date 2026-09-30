const fs = require('fs');

const fixStaffIdCard = () => {
    let content = fs.readFileSync('src/components/StaffIdCardModal.tsx', 'utf8');

    // Modern (187-193)
    content = content.replace(
        /\{logoUrl \? \([\s\S]*?<div className="mb-2"><img src=\{logoUrl\}.*?<\/div>[\s\S]*?\) : \([\s\S]*?<div className="w-12 h-12[^>]*>[\s\S]*?\{companyName\.charAt\(0\)\}[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<div className="mb-2"><img src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[160px] h-12 object-contain drop-shadow-md" /></div>`
    );

    // Corporate (275-281)
    content = content.replace(
        /\{logoUrl \? \([\s\S]*?<div className="h-\[45px\][^>]*><img src=\{logoUrl\}.*?<\/div>[\s\S]*?\) : \([\s\S]*?<div className="text-\[#00D4FF\][^>]*>[\s\S]*?\{companyName\.charAt\(0\)\}[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<div className="h-[45px] flex items-center justify-start mb-2"><img src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[180px] max-h-full object-contain drop-shadow-md" /></div>`
    );

    // Creative (364-370)
    content = content.replace(
        /\{logoUrl \? \([\s\S]*?<div className="h-12[^>]*><img src=\{logoUrl\}.*?<\/div>[\s\S]*?\) : \([\s\S]*?<div className="h-10 w-10[^>]*>[\s\S]*?\{companyName\.charAt\(0\)\}[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<div className="h-12 flex items-center justify-start"><img src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[140px] max-h-full object-contain drop-shadow-md" /></div>`
    );

    // Dynamic (451-457)
    content = content.replace(
        /\{logoUrl \? \([\s\S]*?<div className="mb-2"><img src=\{logoUrl\}.*?<\/div>[\s\S]*?\) : \([\s\S]*?<div className="text-white[^>]*>[\s\S]*?\{companyName\.charAt\(0\)\}[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<div className="mb-2"><img src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[160px] h-12 object-contain drop-shadow-md" /></div>`
    );

    // Minimal (524-530)
    content = content.replace(
        /\{logoUrl \? \([\s\S]*?<div className="h-12 flex items-center justify-start mb-4"><img src=\{logoUrl\}[^>]*><\/div>[\s\S]*?\) : \([\s\S]*?<div className="text-\[#111\][^>]*>[\s\S]*?\{companyName\.charAt\(0\)\}[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<div className="h-12 flex items-center justify-start mb-4"><img src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[160px] max-h-full object-contain brightness-0 invert drop-shadow-sm" /></div>`
    );

    // Cyberpunk (600-606)
    content = content.replace(
        /\{logoUrl \? \([\s\S]*?<div className="h-12 flex items-center justify-center mb-2"><img src=\{logoUrl\}[^>]*><\/div>[\s\S]*?\) : \([\s\S]*?<div className="text-cyan-400[^>]*>[\s\S]*?\{companyName\.charAt\(0\)\}[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<div className="h-12 flex items-center justify-center mb-2"><img src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[150px] max-h-full object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" /></div>`
    );

    // VIP (686-694)
    content = content.replace(
        /\{logoUrl \? \([\s\S]*?<div className="h-12 flex items-center justify-center mb-3">[\s\S]*?<img src=\{logoUrl\}[^>]*>[\s\S]*?<\/div>[\s\S]*?\) : \([\s\S]*?<div className="text-\[#d4af37\][^>]*>[\s\S]*?\{companyName\.charAt\(0\)\}[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<div className="h-12 flex items-center justify-center mb-3"><img src={logoUrl || "/logo.png"} alt="Logo" className="max-w-[180px] max-h-full object-contain filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.2)] sepia-[.3] hue-rotate-[340deg]" /></div>`
    );

    fs.writeFileSync('src/components/StaffIdCardModal.tsx', content);
};

const fixQRCard = () => {
    let content = fs.readFileSync('src/components/QRPrintCard.tsx', 'utf8');

    // Modern (72-83)
    content = content.replace(
        /\{companyLogoUrl \? \([\s\S]*?<img src=\{companyLogoUrl\}[^>]*>[\s\S]*?\) : \([\s\S]*?<div className="flex flex-col items-center gap-4 mb-8 print:mb-12">[\s\S]*?<div className="w-16 h-16[^>]*>[\s\S]*?\{companyName \? companyName\.charAt\(0\)\.toUpperCase\(\) : "C"\}[\s\S]*?<\/div>[\s\S]*?(<div className="flex flex-col items-center text-center">[\s\S]*?<\/div>)[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<img src={companyLogoUrl || "/logo.png"} alt="Logo" className="h-20 print:h-28 object-contain mb-8 print:mb-12 drop-shadow-md" />\n        {!companyLogoUrl && ($1)}`
    );

    // Clean (118-122)
    content = content.replace(
        /\{companyLogoUrl \? \([\s\S]*?<img src=\{companyLogoUrl\}[^>]*>[\s\S]*?\) : \([\s\S]*?<h2 className="font-semibold text-3xl[^>]*>\{companyName \|\| "Organization"\}<\/h2>[\s\S]*?\)\}/,
        `<img src={companyLogoUrl || "/logo.png"} alt="Logo" className="h-16 print:h-24 object-contain mb-8 print:mb-12 grayscale opacity-90" />\n        {!companyLogoUrl && (\n          <h2 className="font-semibold text-3xl print:text-5xl text-black mb-8 print:mb-12 tracking-tight">{companyName || "Organization"}</h2>\n        )}`
    );

    // Professional (146-154)
    content = content.replace(
        /\{companyLogoUrl \? \([\s\S]*?<div className="h-16 print:h-24 shrink-0 shadow-xl shadow-black\/5 mb-4 print:mb-6">[\s\S]*?<img src=\{companyLogoUrl\}[^>]*>[\s\S]*?<\/div>[\s\S]*?\) : \([\s\S]*?<div className="w-16 h-16[^>]*>[\s\S]*?<span[^>]*>\{companyName \? companyName\.charAt\(0\)\.toUpperCase\(\) : "C"\}<\/span>[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<div className="h-16 print:h-24 shrink-0 shadow-xl shadow-black/5 mb-4 print:mb-6">\n            <img src={companyLogoUrl || "/logo.png"} alt="Logo" className="h-full object-contain" />\n          </div>`
    );

    // High Impact (187-191)
    content = content.replace(
        /\{companyLogoUrl \? \([\s\S]*?<img src=\{companyLogoUrl\}[^>]*>[\s\S]*?\) : \([\s\S]*?<h2 className="font-extrabold text-3xl[^>]*>\{companyName \|\| "Organization"\}<\/h2>[\s\S]*?\)\}/,
        `<img src={companyLogoUrl || "/logo.png"} alt="Logo" className="h-16 print:h-24 object-contain mb-6 print:mb-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />\n        {!companyLogoUrl && (\n          <h2 className="font-extrabold text-3xl print:text-5xl text-white mb-6 print:mb-10 tracking-tight drop-shadow-xl shadow-black/5">{companyName || "Organization"}</h2>\n        )}`
    );

    fs.writeFileSync('src/components/QRPrintCard.tsx', content);
};

fixStaffIdCard();
fixQRCard();
console.log("Fixed files");
