const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

code = code.replace(
  'price: "$0",',
  'price: "$4.99",'
);
code = code.replace(
  'button: "Get Started Free",',
  'button: "Get Started",'
);
code = code.replace(
  'button: "ចាប់ផ្តើមដោយឥតគិតថ្លៃ",',
  'button: "ចាប់ផ្តើម",'
);

code = code.replace(
  'price: "$10",',
  'price: "$9.99",'
);
code = code.replace(
  'features: ["Unlimited employees", "Smart GPS & WiFi check-in", "Automated payroll calculation", "Telegram notifications", "Unlimited locations"],',
  'features: ["Up to 25 employees", "Smart GPS & WiFi check-in", "Automated payroll calculation", "Telegram notifications", "Unlimited locations"],'
);
code = code.replace(
  'features: ["បុគ្គលិកមិនកំណត់", "ចុះវត្តមានតាម GPS និង WiFi", "គណនាប្រាក់ខែស្វ័យប្រវត្តិ", "ភ្ជាប់ជាមួយ Telegram", "ទីតាំងមិនកំណត់"],',
  'features: ["បុគ្គលិករហូតដល់ 25 នាក់", "ចុះវត្តមានតាម GPS និង WiFi", "គណនាប្រាក់ខែស្វ័យប្រវត្តិ", "ភ្ជាប់ជាមួយ Telegram", "ទីតាំងមិនកំណត់"],'
);
code = code.replace(
  'button: "Start Free Trial",',
  'button: "Get Pro",'
);
code = code.replace(
  'button: "សាកល្បងដោយឥតគិតថ្លៃ",',
  'button: "ជ្រើសរើស Pro",'
);

fs.writeFileSync('src/pages/Landing.tsx', code);
