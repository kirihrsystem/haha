const fs = require('fs');
let content = fs.readFileSync('src/components/StaffIdCardModal.tsx', 'utf8');

const regex = /<div className="flex text-\[14px\]">\s*<div className="font-bold text-\[#1A2849\] w-\[70px\]">ID No<\/div>\s*<div className="font-bold text-\[#1A2849\] mr-2">:<\/div>\s*<div className="text-\[#1A2849\] font-medium flex-1">\{user\.passcode \|\| "N\/A"\}<\/div>\s*<\/div>/g;

content = content.replace(regex, '');
fs.writeFileSync('src/components/StaffIdCardModal.tsx', content);
