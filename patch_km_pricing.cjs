const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

const kmPricingStr = `
    // Pricing
    navPricing: "តម្លៃ",
    pricingTag: "តម្លៃច្បាស់លាស់",
    pricingTitle: "គម្រោងសាមញ្ញសម្រាប់គ្រប់ក្រុមការងារ។",
    pricingSubtitle: "ចាប់ផ្តើមដោយឥតគិតថ្លៃ ដំឡើងកញ្ចប់នៅពេលអ្នកត្រូវការមុខងារបន្ថែម។",
    pricingTiers: [
      {
        name: "ចាប់ផ្តើម",
        price: "$0",
        period: "/ខែ",
        description: "សាកសមបំផុតសម្រាប់ក្រុមតូចៗ ដែលទើបចាប់ផ្តើម។",
        features: ["បុគ្គលិករហូតដល់ 10 នាក់", "ចុះវត្តមានតាម GPS", "ទីតាំងការងារ 1 ទីតាំង", "របាយការណ៍ទូទៅ"],
        button: "ចាប់ផ្តើមដោយឥតគិតថ្លៃ",
        popular: false
      },
      {
        name: "ប្រូ",
        price: "$10",
        period: "/ខែ",
        description: "អ្វីគ្រប់យ៉ាងដែលអ្នកត្រូវការដើម្បីគ្រប់គ្រងក្រុមឱ្យមានប្រសិទ្ធភាព។",
        features: ["បុគ្គលិកមិនកំណត់", "ចុះវត្តមានតាម GPS និង WiFi", "គណនាប្រាក់ខែស្វ័យប្រវត្តិ", "ភ្ជាប់ជាមួយ Telegram", "ទីតាំងមិនកំណត់"],
        button: "សាកល្បងដោយឥតគិតថ្លៃ",
        popular: true
      },
      {
        name: "សហគ្រាស",
        price: "ទាក់ទង",
        period: "",
        description: "ការគ្រប់គ្រង និងការគាំទ្រកម្រិតខ្ពស់សម្រាប់ស្ថាប័នធំៗ។",
        features: ["អ្នកគ្រប់គ្រងគណនីផ្ទាល់ខ្លួន", "ភ្ជាប់ API ផ្ទាល់ខ្លួន", "ការគ្រប់គ្រងសិទ្ធិកម្រិតខ្ពស់", "ការបណ្តុះបណ្តាលផ្ទាល់"],
        button: "ទាក់ទងផ្នែកលក់",
        popular: false
      }
    ],
`;

code = code.replace('navFAQ: "សំណួរញឹកញាប់",', 'navPricing: "តម្លៃ",\n    navFAQ: "សំណួរញឹកញាប់",');
code = code.replace('    // FAQs\n    faqTag: "សំណួរ និងចម្លើយ",', kmPricingStr + '\n    // FAQs\n    faqTag: "សំណួរ និងចម្លើយ",');

fs.writeFileSync('src/pages/Landing.tsx', code);
