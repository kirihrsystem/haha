import { Telegraf, Markup } from 'telegraf';
import { GoogleGenAI } from '@google/genai';

const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN || '8954764338:AAHzMN19FBL7496Io9vJlLzXXCjgF5o1oKU';
const bot = new Telegraf(botToken);

// In-memory session to store language preference
const userLanguage = new Map<number, string>();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const KIRIHR_KNOWLEDGE_BASE = `
SYSTEM ROLE & BOUNDARIES:
You are the official Telegram Customer Support AI Assistant for KiriHR (Kiri HR Workforce Management System).
Your ONLY purpose is to assist users with questions about KiriHR, its features, subscriptions, pricing, modules, installation, and official contact details.

STRICT GROUNDING RULES:
1. ONLY provide answers based on the official KiriHR website information provided below.
2. If a user asks for contact information, ONLY provide the official website contact details:
   - Email: kirihrsystem@gmail.com
   - Phone Number: 093988991
   - Telegram Founder/Support: @kirihr_founder
   - Location: Phnom Penh, Cambodia
3. If a user asks a question completely unrelated to KiriHR (e.g. general recipes, coding, math puzzles, external topics, or other products), politely decline and state that you are the official KiriHR support assistant and can only answer questions related to KiriHR system features, pricing, and support.
4. Always respond strictly in the user's selected language ($LANG$).
5. Keep your answers concise, clear, polite, and helpful.

OFFICIAL KIRIHR INFORMATION & FEATURES:
- App Name: KiriHR (Kiri HR Software / Workforce Management Platform)
- Purpose: Modern all-in-one HR, Payroll, Attendance, Leave, and Cash Flow Management platform designed for businesses in Cambodia and internationally.

Key Modules & Functionalities:
1. Smart Attendance System:
   - Geofenced GPS Check-In/Out (verifies employee physical location within office radius).
   - Face Recognition & QR Code scanning check-in.
   - Wi-Fi network based check-in.
   - Shift scheduling, custom work hours, late arrival calculations, and overtime (OT) tracking.
2. Leave Management Engine:
   - Submit leave requests (Annual, Sick, Maternity, Special, Unpaid).
   - Substitute employee assignment during leave.
   - Automated multi-level manager approvals and live leave balance updates.
3. Automated Payroll & Payslip Generation:
   - Salary calculations including base pay, overtime, allowances, and tax deductions.
   - Dual Currency support: USD ($) and Khmer Riel (៛ KHR).
   - Automated PDF payslip generation and download/print for employees.
   - Integrated Bakong / KHQR payment gateway for instant salary disbursements.
4. Digital Staff ID Cards & Employee Portal:
   - Employee self-service dashboard for attendance, payslips, and leave history.
   - Digital Staff ID Cards with scannable QR codes for verification.
5. Revenue & Cash Flow Manager (Finance):
   - Dual-entry financial logging for Cash Income (+) and Cash Expenses (-).
   - Multiple payment channels: Cash, Bank Transfer, KHQR / ABA, Credit Card, Petty Cash.
   - Reference/Invoice numbers (#INV-...), category filters, net cash flow calculation, and CSV/Print export.
6. Multi-Tenant Workspace & Role Management:
   - Role-Based Access Control: SuperAdmin, Admin, HR Manager, Department Manager, Employee.
   - Subscription & workspace activation key management.
7. Mobile & PWA Support:
   - Works on web browsers and as a Progressive Web App (PWA) on iOS & Android devices.

Subscription Plans & Pricing:
- Free Trial / Starter: Essential HR tools, attendance check-in, up to limited team members.
- Standard Plan: Full HR suite, geofencing, digital ID cards, leave management, automated payroll.
- Enterprise Plan: Unlimited staff, custom branding, Bakong KHQR automated payout integration, dedicated priority support.

Official Contact & Support:
- Email: kirihrsystem@gmail.com
- Phone: 093988991
- Telegram: @kirihr_founder
- Headquarters: Phnom Penh, Cambodia
`;

bot.start((ctx) => {
  ctx.reply(
    'Welcome to KiriHR Support! Please select your language / សូមជ្រើសរើសភាសា',
    Markup.inlineKeyboard([
      Markup.button.callback('English 🇬🇧', 'lang_en'),
      Markup.button.callback('ខ្មែរ 🇰🇭', 'lang_km'),
    ])
  );
});

bot.command('contact', (ctx) => {
  const userId = ctx.from?.id;
  const lang = (userId && userLanguage.get(userId)) || 'Khmer';
  if (lang === 'Khmer') {
    ctx.reply(
      'ព័ត៌មានទំនាក់ទំនងផ្លូវការ KiriHR:\n\n' +
      '📧 អ៊ីមែល: kirihrsystem@gmail.com\n' +
      '📞 ទូរស័ព្ទ: 093988991\n' +
      '✈️ Telegram ស្ថាបនិក: @kirihr_founder\n' +
      '📍 ទីតាំង: រាជធានីភ្នំពេញ ប្រទេសកម្ពុជា'
    );
  } else {
    ctx.reply(
      'Official KiriHR Contact Information:\n\n' +
      '📧 Email: kirihrsystem@gmail.com\n' +
      '📞 Phone: 093988991\n' +
      '✈️ Telegram Founder: @kirihr_founder\n' +
      '📍 Location: Phnom Penh, Cambodia'
    );
  }
});

bot.action('lang_en', (ctx) => {
  if (ctx.from) {
    userLanguage.set(ctx.from.id, 'English');
  }
  ctx.answerCbQuery().catch((err) => console.error('Callback error:', err.message));
  ctx.reply('You have selected English. How can I help you with KiriHR today?').catch((err) => console.error('Reply error:', err.message));
});

bot.action('lang_km', (ctx) => {
  if (ctx.from) {
    userLanguage.set(ctx.from.id, 'Khmer');
  }
  ctx.answerCbQuery().catch((err) => console.error('Callback error:', err.message));
  ctx.reply('អ្នកបានជ្រើសរើសភាសាខ្មែរ។ តើខ្ញុំអាចជួយអ្នកអំពីប្រព័ន្ធ KiriHR បានអ្វីខ្លះនៅថ្ងៃនេះ?').catch((err) => console.error('Reply error:', err.message));
});

async function fetchCustomKnowledgeFromFirestore(): Promise<string> {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0729083857';
    const dbId = 'ai-studio-remixremixkirihr-0df2ca9a-0f20-4739-b8ab-12a7a4f02443';
    const apiKey = 'AIzaSyBvybTHJjLOcyTeWyoLYpit7BQWWokMLgo';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/telegram_knowledge?key=${apiKey}`;
    
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) return '';

    let customKnowledgeText = '\n\nDYNAMIC SUPERADMIN FAQS & TRAINED CUSTOM KNOWLEDGE:\n';
    let count = 0;
    data.documents.forEach((doc: any) => {
      const fields = doc.fields || {};
      const active = fields.active?.booleanValue ?? true;
      if (!active) return;

      count++;
      const category = fields.category?.stringValue || 'General';
      const questionEn = fields.questionEn?.stringValue || '';
      const questionKh = fields.questionKh?.stringValue || '';
      const answerEn = fields.answerEn?.stringValue || '';
      const answerKh = fields.answerKh?.stringValue || '';

      customKnowledgeText += `${count}. [Category: ${category}]\n`;
      if (questionEn) customKnowledgeText += `   Question (EN): ${questionEn}\n`;
      if (questionKh) customKnowledgeText += `   Question (KH): ${questionKh}\n`;
      if (answerEn) customKnowledgeText += `   Answer (EN): ${answerEn}\n`;
      if (answerKh) customKnowledgeText += `   Answer (KH): ${answerKh}\n`;
      customKnowledgeText += '\n';
    });

    return count > 0 ? customKnowledgeText : '';
  } catch (err) {
    console.warn('Failed to fetch dynamic FAQs from Firestore:', err);
    return '';
  }
}

// Handle text messages
bot.on('text', async (ctx) => {
  const userId = ctx.from?.id;
  
  // Default to Khmer if no language is selected yet
  const lang = (userId && userLanguage.get(userId)) || 'Khmer';
  
  const userMsg = ctx.message.text;

  // Show typing indicator
  ctx.sendChatAction('typing').catch((err) => console.error('Typing indicator error:', err.message));

  try {
    const dynamicKnowledge = await fetchCustomKnowledgeFromFirestore();
    const fullSystemInstruction = (KIRIHR_KNOWLEDGE_BASE + dynamicKnowledge).replace('$LANG$', lang);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User question: ${userMsg}`,
      config: {
        systemInstruction: fullSystemInstruction,
      },
    });

    const replyText = response.text || (lang === 'Khmer' ? 'សុំទោស ខ្ញុំមិនមានព័ត៌មានអំពីបញ្ហានេះទេ។ សូមទាក់ទងមកកាន់ 093988991 ឬ kirihrsystem@gmail.com' : 'Sorry, I do not have information regarding this query. Please contact us at 093988991 or kirihrsystem@gmail.com');
    ctx.reply(replyText).catch((err) => console.error('Reply error:', err.message));
  } catch (error: any) {
    console.error('Gemini error:', error);
    const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('RESOURCE_EXHAUSTED');
    if (isRateLimit) {
      ctx.reply(lang === 'Khmer' ? 'ប្រព័ន្ធកំពុងមមាញឹក សូមរង់ចាំបន្តិចសិន។ (Rate limit)' : 'The system is currently busy. Please wait a moment and try again. (Rate limit)').catch((err) => console.error('Reply error:', err.message));
    } else {
      ctx.reply(lang === 'Khmer' ? 'សុំទោស មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្តងទៀត។' : 'Sorry, a technical error occurred. Please try again.').catch((err) => console.error('Reply error:', err.message));
    }
  }
});

let isBotInitialized = false;

export function setupTelegramBot(app: any) {
  if (isBotInitialized) {
    console.log('Telegram bot is already initialized');
    return;
  }
  isBotInitialized = true;

  bot.catch((err: any, ctx: any) => {
    if (err?.message?.includes('409: Conflict') || err?.code === 409) {
      console.warn('Telegram bot 409 Conflict ignored (another instance is active)');
      return;
    }
    console.error(`Ooops, encountered an error for ${ctx?.updateType}`, err);
  });

  // Clear any existing webhook to ensure long-polling works cleanly
  bot.telegram.deleteWebhook({ drop_pending_updates: true })
    .then(async () => {
      try {
        await bot.launch({ dropPendingUpdates: true });
        console.log('Telegram bot started in long-polling mode');
      } catch (err: any) {
        if (err?.message?.includes('409: Conflict') || err?.code === 409) {
          console.warn('Telegram bot launch 409 Conflict handled gracefully');
        } else {
          console.error('Failed launching telegram bot:', err?.message || err);
        }
      }
    })
    .catch((err) => {
      console.warn('Failed deleting webhook for telegram bot:', err?.message || err);
    });

  // Graceful stop
  process.once('SIGINT', () => {
    try { bot.stop('SIGINT'); } catch (e) {}
  });
  process.once('SIGTERM', () => {
    try { bot.stop('SIGTERM'); } catch (e) {}
  });
}

