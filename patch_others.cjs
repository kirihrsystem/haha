const fs = require('fs');

const fixEmployeeProfile = () => {
    let content = fs.readFileSync('src/components/EmployeeProfile.tsx', 'utf8');
    content = content.replace(
        /\{settings\?\.logoUrl \? \([\s\S]*?<img[\s\S]*?src=\{settings\.logoUrl\}[\s\S]*?\/>[\s\S]*?\) : \([\s\S]*?<Building2.*?\/?>[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<img src={settings?.logoUrl || "/logo.png"} alt="Company Logo" className="w-full h-full object-contain p-2" />`
    );
    fs.writeFileSync('src/components/EmployeeProfile.tsx', content);
};

const fixCameraModal = () => {
    let content = fs.readFileSync('src/components/CameraModal.tsx', 'utf8');
    content = content.replace(
        /\{settings\?\.logoUrl \? \([\s\S]*?<img src=\{settings\.logoUrl\}[^>]*>[\s\S]*?\) : \([\s\S]*?<span[^>]*>\{settings\?\.companyName\?\.charAt\(0\) \|\| "C"\}<\/span>[\s\S]*?\)\}/,
        `<img src={settings?.logoUrl || "/logo.png"} alt="Logo" className="h-6 object-contain" />`
    );
    fs.writeFileSync('src/components/CameraModal.tsx', content);
};

const fixSignup = () => {
    let content = fs.readFileSync('src/pages/Signup.tsx', 'utf8');
    content = content.replace(
        /\{formData\.logoUrl \? \([\s\S]*?<img src=\{formData\.logoUrl\}[^>]*>[\s\S]*?\) : \([\s\S]*?<div className="text-slate-400 text-center flex flex-col items-center">[\s\S]*?<Upload.*?\/?>[\s\S]*?<span[^>]*>Upload Logo<\/span>[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `{formData.logoUrl ? (\n                    <div className="w-full h-full p-2 flex items-center justify-center overflow-visible">\n                      <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />\n                    </div>\n                  ) : (\n                    <div className="text-slate-400 text-center flex flex-col items-center">\n                      <Upload className="w-6 h-6 mb-1 opacity-60" />\n                      <span className="text-xs font-semibold">Upload Logo</span>\n                    </div>\n                  )}`
    );
    fs.writeFileSync('src/pages/Signup.tsx', content);
};

const fixPayroll = () => {
    let content = fs.readFileSync('src/components/PayrollReceiptPDF.tsx', 'utf8');
    content = content.replace(
        /\{settings\?\.logoUrl \? \([\s\S]*?<img src=\{settings\.logoUrl\}[^>]*>[\s\S]*?\) : \([\s\S]*?<div[^>]*>[\s\S]*?<Building2.*?\/?>[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<img src={settings?.logoUrl || "/logo.png"} alt="Logo" className="h-[70px] object-contain" crossOrigin="anonymous" />`
    );
    fs.writeFileSync('src/components/PayrollReceiptPDF.tsx', content);
}

const fixMonthly = () => {
    let content = fs.readFileSync('src/components/MonthlyPayrollReportPDF.tsx', 'utf8');
    content = content.replace(
        /\{logoUrl \? \([\s\S]*?<img[\s\S]*?src=\{logoUrl\}[\s\S]*?\/>[\s\S]*?\) : \([\s\S]*?<div[^>]*>[\s\S]*?<Building2.*?\/?>[\s\S]*?<\/div>[\s\S]*?\)\}/,
        `<img src={logoUrl || "/logo.png"} alt="Logo" className="w-[120px] h-[40px] object-contain" crossOrigin="anonymous" />`
    );
    fs.writeFileSync('src/components/MonthlyPayrollReportPDF.tsx', content);
}

fixEmployeeProfile();
fixCameraModal();
fixSignup();
fixPayroll();
fixMonthly();

