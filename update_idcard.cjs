const fs = require('fs');
let content = fs.readFileSync('src/components/StaffIdCardModal.tsx', 'utf8');

// Replace single ref with two refs
content = content.replace(
  /const idCardRef = useRef<HTMLDivElement>\(null\);/,
  `const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);`
);

// Replace handleDownload
content = content.replace(
  /const handleDownload = async \(\) => \{[\s\S]*?setIsExporting\(false\);\n\s*\}\n\s*\};/,
  `const handleDownload = async () => {
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
      // Wait a tiny bit between downloads
      await new Promise(r => setTimeout(r, 300));
      await exportCard(backCardRef.current, "Back");
    } catch (err) {
      console.error("Failed to export:", err);
    } finally {
      setIsExporting(false);
    }
  };`
);

// Remove the employee ID from the UI and change the refs
content = content.replace(
  /<div className="w-full mt-auto pt-6 pb-6 flex flex-col items-center gap-1.5 relative">\s*<div className="absolute top-0 left-1\/2 -translate-x-1\/2 w-3\/4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" \/>\s*<div className="text-\[10px\] text-slate-400 font-bold uppercase tracking-\[0\.2em\]">\s*Employee ID\s*<\/div>\s*<div className="font-mono text-lg font-black text-slate-700 tracking-\[0\.1em\]">\s*\{user\.passcode\}\s*<\/div>\s*<\/div>/,
  `{/* Minimal footer space instead of ID */}\n                <div className="w-full mt-auto pt-6 pb-6 flex flex-col items-center gap-1.5 relative">\n                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />\n                </div>`
);

content = content.replace(
  /<div\s*id="id-card-print-area"\s*ref=\{idCardRef\}\s*className="flex flex-col sm:flex-row gap-6 bg-transparent"\s*style=\{\{\s*width: "max-content",\s*padding: "20px", \/\/ Padding to avoid clipping shadows when downloading\s*margin: "0 auto"\s*\}\}\s*>/,
  `<div\n            id="id-card-print-area"\n            className="flex flex-col sm:flex-row gap-6 bg-transparent"\n            style={{\n              width: "max-content",\n              padding: "20px",\n              margin: "0 auto"\n            }}\n          >`
);

content = content.replace(
  /<div className="w-\[340px\] h-\[540px\] bg-white rounded-3xl shadow-2xl overflow-hidden relative flex flex-col items-center border border-slate-100 isolate">/,
  `<div ref={frontCardRef} className="w-[340px] h-[540px] bg-white rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col items-center border border-slate-100 isolate">`
);

content = content.replace(
  /<div className="w-\[340px\] h-\[540px\] bg-white rounded-3xl shadow-2xl overflow-hidden relative flex flex-col items-center border border-slate-100 p-8">/,
  `<div ref={backCardRef} className="w-[340px] h-[540px] bg-white rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col items-center border border-slate-100 p-8">`
);

fs.writeFileSync('src/components/StaffIdCardModal.tsx', content);
