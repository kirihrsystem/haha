const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

const enPricingStr = `
    // Pricing
    navPricing: "Pricing",
    pricingTag: "Clear Pricing",
    pricingTitle: "Simple plans for every team.",
    pricingSubtitle: "Start for free, upgrade when you need more power and control.",
    pricingTiers: [
      {
        name: "Starter",
        price: "$0",
        period: "/month",
        description: "Perfect for small teams getting started with digital tracking.",
        features: ["Up to 10 employees", "Basic GPS check-in", "1 Workspace location", "Standard reporting"],
        button: "Get Started Free",
        popular: false
      },
      {
        name: "Pro",
        price: "$10",
        period: "/month",
        description: "Everything you need to manage growing teams efficiently.",
        features: ["Unlimited employees", "Smart GPS & WiFi check-in", "Automated payroll calculation", "Telegram notifications", "Unlimited locations"],
        button: "Start Free Trial",
        popular: true
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Advanced controls and support for large organizations.",
        features: ["Dedicated account manager", "Custom API integration", "Advanced role permissions", "White-glove onboarding"],
        button: "Contact Sales",
        popular: false
      }
    ],
`;

code = code.replace('navFAQ: "FAQ",', 'navPricing: "Pricing",\n    navFAQ: "FAQ",');
code = code.replace('    // FAQs\n    faqTag: "Knowledge Base",', enPricingStr + '\n    // FAQs\n    faqTag: "Knowledge Base",');

fs.writeFileSync('src/pages/Landing.tsx', code);
