import express from "express";
import webpush from 'web-push';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { BakongKHQR, khqrData, IndividualInfo } from "bakong-khqr";
import { setupTelegramBot } from "./telegram.js";

const publicVapidKey = 'BPyBaHpb5_pAvx6E7kz8kdUpb7M9jGgEgiV1nc4_wUdXpAncANcERtnsAQnBFADYi0HKFLjpGZN-4qHXv5ztXrc';
const privateVapidKey = '_Ob9V0W0JZ8qhp1S9cuJIkzvCWVOdy1qqDdfQEIYpa8';

webpush.setVapidDetails(
  'mailto:kirihrsystem@gmail.com',
  publicVapidKey,
  privateVapidKey
);

const app = express();

// Trust first proxy (Nginx / Cloud Run reverse proxy)
app.set('trust proxy', 1);

// Security Middleware (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to prevent blocking of frontend assets in our sandboxed env
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  xFrameOptions: false // Disabled for AI Studio preview iframe
}));

// Basic CORS to allow frontend/backend communication within same host but block arbitrary domains
app.use(cors({
  origin: '*', // For strict environments, specify the actual frontend URL. 
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Rate limiting middleware to prevent brute force/DDoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { xForwardedForHeader: false, forwardedHeader: false, trustProxy: false },
  message: "Too many requests from this IP, please try again after 15 minutes"
});

// Stricter rate limiting for Bakong/Payment API endpoints to prevent financial abuse
const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Limit each IP to 50 payment/bakong requests per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false, trustProxy: false },
  message: "Too many payment requests from this IP, please try again after 10 minutes"
});

// Apply basic rate limiting to all /api routes
app.use('/api/', apiLimiter);

// Apply strict rate limiting to payment/bakong API routes
app.use('/api/billing', strictLimiter);

app.use(express.json());

// Setup Telegram Bot
setupTelegramBot(app);

// Bakong NBC API Quota Tracker
interface BakongUsageState {
  date: string;
  dailyLimit: number;
  requestsUsedToday: number;
  qrGenerationsToday: number;
  checksToday: number;
  tokenRenewalsToday: number;
  totalLifetimeRequests: number;
  lastCheckedAt: string | null;
  lastStatus: string;
  isLimitReached: boolean;
  registeredEmails: string[];
  history: Array<{
    timestamp: string;
    type: 'qr' | 'check' | 'token';
    status: string;
    details?: string;
  }>;
}

function getCambodiaDateStr(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Phnom_Penh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

const initialEmails = [process.env.BAKONG_EMAIL || "kirihrsystem@gmail.com"];

const bakongTracker: BakongUsageState = {
  date: getCambodiaDateStr(),
  dailyLimit: initialEmails.length * 100,
  requestsUsedToday: 0,
  qrGenerationsToday: 0,
  checksToday: 0,
  tokenRenewalsToday: 0,
  totalLifetimeRequests: 0,
  lastCheckedAt: null,
  lastStatus: "Operational",
  isLimitReached: false,
  registeredEmails: initialEmails,
  history: []
};

function ensureDateRollOver() {
  const today = getCambodiaDateStr();
  if (bakongTracker.date !== today) {
    bakongTracker.date = today;
    bakongTracker.requestsUsedToday = 0;
    bakongTracker.qrGenerationsToday = 0;
    bakongTracker.checksToday = 0;
    bakongTracker.tokenRenewalsToday = 0;
    bakongTracker.isLimitReached = false;
    bakongTracker.lastStatus = "Quota reset for new day (Cambodia Time)";
  }
}

function recordBakongActivity(type: 'qr' | 'check' | 'token', status: string, details?: string, countsAsQuotaRequest = true) {
  ensureDateRollOver();
  if (countsAsQuotaRequest) {
    bakongTracker.requestsUsedToday += 1;
  }
  bakongTracker.totalLifetimeRequests += 1;
  bakongTracker.lastCheckedAt = new Date().toISOString();
  bakongTracker.lastStatus = status;

  if (type === 'qr') bakongTracker.qrGenerationsToday += 1;
  if (type === 'check') bakongTracker.checksToday += 1;
  if (type === 'token') bakongTracker.tokenRenewalsToday += 1;

  if (status.toLowerCase().includes('limit') || status.toLowerCase().includes('exceeded') || status.toLowerCase().includes('quota')) {
    bakongTracker.isLimitReached = true;
    bakongTracker.requestsUsedToday = Math.max(bakongTracker.requestsUsedToday, bakongTracker.dailyLimit);
  }

  bakongTracker.history.push({
    timestamp: new Date().toISOString(),
    type,
    status,
    details: details ? details.substring(0, 100) : undefined
  });
  if (bakongTracker.history.length > 50) {
    bakongTracker.history = bakongTracker.history.slice(-50);
  }
}

// Endpoint to retrieve remaining requests and usage stats
app.get("/api/billing/usage", (req, res) => {
  ensureDateRollOver();
  const remaining = Math.max(0, bakongTracker.dailyLimit - bakongTracker.requestsUsedToday);
  res.json({
    date: bakongTracker.date,
    dailyLimit: bakongTracker.dailyLimit,
    requestsUsedToday: bakongTracker.requestsUsedToday,
    remainingToday: remaining,
    qrGenerationsToday: bakongTracker.qrGenerationsToday,
    checksToday: bakongTracker.checksToday,
    tokenRenewalsToday: bakongTracker.tokenRenewalsToday,
    totalLifetimeRequests: bakongTracker.totalLifetimeRequests,
    lastCheckedAt: bakongTracker.lastCheckedAt,
    lastStatus: bakongTracker.lastStatus,
    isLimitReached: bakongTracker.isLimitReached || bakongTracker.requestsUsedToday >= bakongTracker.dailyLimit,
    resetsAt: "Midnight 00:00 (Cambodia Time / UTC+7)",
    registeredEmails: bakongTracker.registeredEmails,
    recentActivity: bakongTracker.history.slice(-15).reverse()
  });
});

// Endpoint to manually add a new Bakong email
app.post("/api/billing/emails", (req, res) => {
  const { email } = req.body;
  if (email && !bakongTracker.registeredEmails.includes(email)) {
    bakongTracker.registeredEmails.push(email);
    bakongTracker.dailyLimit = Math.max(bakongTracker.dailyLimit, bakongTracker.registeredEmails.length * 100);
    bakongTracker.isLimitReached = bakongTracker.requestsUsedToday >= bakongTracker.dailyLimit;
    recordBakongActivity('token', `Added new Bakong API email: ${email}`, undefined, false);
  }
  res.json({ success: true, registeredEmails: bakongTracker.registeredEmails, dailyLimit: bakongTracker.dailyLimit });
});

// Endpoint to manually remove a Bakong email
app.delete("/api/billing/emails/:email", (req, res) => {
  const emailToRemove = req.params.email;
  console.log(`Attempting to remove email: ${emailToRemove}`);
  console.log(`Current registered emails:`, bakongTracker.registeredEmails);
  if (bakongTracker.registeredEmails.includes(emailToRemove)) {
    bakongTracker.registeredEmails = bakongTracker.registeredEmails.filter(e => e !== emailToRemove);
    bakongTracker.dailyLimit = Math.max(100, bakongTracker.registeredEmails.length * 100);
    recordBakongActivity('token', `Removed Bakong API email: ${emailToRemove}`, undefined, false);
    res.json({ success: true, registeredEmails: bakongTracker.registeredEmails, dailyLimit: bakongTracker.dailyLimit });
  } else {
    console.log(`Email not found in registered emails.`);
    return res.status(400).json({ success: false, error: "Email not found." });
  }
});

// Endpoint to manually reset or sync quota
app.post("/api/billing/usage/reset", (req, res) => {
  bakongTracker.requestsUsedToday = 0;
  bakongTracker.qrGenerationsToday = 0;
  bakongTracker.checksToday = 0;
  bakongTracker.tokenRenewalsToday = 0;
  bakongTracker.isLimitReached = false;
  bakongTracker.lastStatus = "Manual quota counter reset by Super Admin";
  res.json({ success: true, message: "Bakong usage counter reset successfully", tracker: bakongTracker });
});

// Endpoint to update daily quota limit
app.post("/api/billing/usage/set-limit", (req, res) => {
  const { limit } = req.body;
  if (limit && Number(limit) > 0) {
    bakongTracker.dailyLimit = Number(limit);
    if (bakongTracker.requestsUsedToday < bakongTracker.dailyLimit) {
      bakongTracker.isLimitReached = false;
    }
  }
  res.json({ success: true, dailyLimit: bakongTracker.dailyLimit });
});

app.post("/api/send-push", async (req, res) => {
  try {
    const { subscription, payload } = req.body;
    const options: any = {
      urgency: 'high',
      TTL: 86400
    };
    await webpush.sendNotification(subscription, JSON.stringify(payload), options);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error sending push:', err);
    res.status(500).json({ error: 'Failed' });
  }
});

app.post("/api/billing/generate-qr", (req, res) => {
  try {
    const { amount, currency, description, orderId } = req.body;
    const accountId = process.env.BAKONG_ACCOUNT_ID || "workspace@aclb";
    const merchantName = "KiriHR Software";
    
    const optionalData = {
      currency: currency === "USD" ? khqrData.currency.usd : khqrData.currency.khr,
      amount: parseFloat(amount),
      mobileNumber: "85593988991",
      storeLabel: "KiriHR",
      terminalLabel: "Online",
      purposeOfTransaction: (description || "Subscription").substring(0, 25),
      languagePreference: "KM",
      merchantNameAlternateLanguage: merchantName,
      merchantCityAlternateLanguage: "Phnom Penh",
      billNumber: String(orderId || "BILL" + Date.now()).replace(/[^a-zA-Z0-9]/g, "").substring(0, 25) || ("BILL" + Date.now()).substring(0, 25),
      expirationTimestamp: Date.now() + (15 * 60 * 1000)
    };

    const individualInfo = new IndividualInfo(
      accountId,
      merchantName,
      "Phnom Penh",
      optionalData
    );

    const khqr = new BakongKHQR();
    const qrResponse = khqr.generateIndividual(individualInfo);
    
    if (qrResponse.status.code !== 0 || !qrResponse.data) {
      recordBakongActivity('qr', 'Failed: ' + (qrResponse.status.message || 'QR Gen Error'), undefined, false);
      return res.status(500).json({ error: qrResponse.status.message || "Failed to generate QR" });
    }

    const qrString = qrResponse.data.qr;
    const md5 = qrResponse.data.md5;

    recordBakongActivity('qr', 'QR Generated Successfully', `Amount: $${amount} ${currency}`, false);

    res.json({ qrString, md5 });
  } catch (err: any) {
    console.error("QR Error", err);
    recordBakongActivity('qr', 'Error: ' + err.message, undefined, false);
    res.status(500).json({ error: err.message });
  }
});

let cachedBakongToken: string | null = null;
let tokenExpiry: number = 0;
let currentEmailIndex: number = 0;

async function getBakongToken(baseUrl: string): Promise<string> {
  if (cachedBakongToken && Date.now() < tokenExpiry) {
    return cachedBakongToken;
  }
  
  if (bakongTracker.registeredEmails.length === 0) {
    throw new Error("No Bakong emails configured.");
  }

  let attempts = 0;
  const maxAttempts = bakongTracker.registeredEmails.length;
  let lastError = "";

  while (attempts < maxAttempts) {
    const email = bakongTracker.registeredEmails[currentEmailIndex % bakongTracker.registeredEmails.length];
    
    try {
      const tokenRes = await fetch(`${baseUrl}/v1/renew_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      const responseText = await tokenRes.text();
      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
      
      if (tokenData.responseCode !== 0 || !tokenData.data?.token) {
        const errorMsg = tokenData.responseMessage || JSON.stringify(tokenData);
        if (errorMsg.toLowerCase().includes('limit') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('exceeded')) {
          currentEmailIndex++;
          attempts++;
          lastError = errorMsg;
          recordBakongActivity('token', `Quota limit on ${email}, switching account...`, undefined, true);
          continue;
        } else {
          recordBakongActivity('token', 'Token Renewal Failed: ' + errorMsg, undefined, true);
          throw new Error(`Failed to get Bakong token for ${email}: ${errorMsg}`);
        }
      }

      cachedBakongToken = tokenData.data.token;
      tokenExpiry = Date.now() + 50 * 60 * 1000; 
      recordBakongActivity('token', `Token Renewed (Valid 50m) via ${email}`, undefined, true);
      return cachedBakongToken;
      
    } catch (err: any) {
      if (err.message.includes('Failed to get Bakong token')) throw err;
      currentEmailIndex++;
      attempts++;
      lastError = err.message;
    }
  }

  recordBakongActivity('token', 'All emails exhausted or failed.', undefined, true);
  bakongTracker.isLimitReached = true;
  throw new Error(`Failed to get Bakong token from any registered email. Last error: ${lastError}`);
}

  app.post("/api/billing/verify", async (req, res) => {
    try {
      const { md5 } = req.body;
      const baseUrl = (process.env.BAKONG_BASE_URL || "https://api-bakong.nbc.gov.kh").replace(/\/+$/, '');
    
    // Allow static token override if provided via process.env.BAKONG_TOKEN
    let token: string | null = process.env.BAKONG_TOKEN || null;
    
    const performCheck = async (t: string) => {
      const checkRes = await fetch(`${baseUrl}/v1/check_transaction_by_md5`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${t}`
        },
        body: JSON.stringify({ md5 })
      });
      const responseText = await checkRes.text();
      try {
        return JSON.parse(responseText);
      } catch(e) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
    };

    let checkData: any;
    
    if (token) {
      checkData = await performCheck(token);
    } else {
      try {
        token = await getBakongToken(baseUrl);
        checkData = await performCheck(token);
        
        // If NBC Bakong returns a quota/limit error on the transaction check itself
        if (checkData.responseCode !== 0 && (checkData.responseMessage?.toLowerCase().includes('limit') || checkData.responseMessage?.toLowerCase().includes('quota'))) {
           cachedBakongToken = null;
           currentEmailIndex++; // move to next email pool
           recordBakongActivity('check', `Quota hit during check, rotating token...`, undefined, true);
           
           // Retry once with new token
           token = await getBakongToken(baseUrl);
           checkData = await performCheck(token);
        }
      } catch (e: any) {
        console.error("Bakong Token Error:", e.message);
        recordBakongActivity('check', 'Token Auth Error: ' + e.message, `MD5: ${md5?.substring(0, 8)}`, true);
        return res.status(429).json({ 
          responseCode: 1,
          error: "Bakong API token/quota error", 
          responseMessage: e.message || "Failed to authenticate with NBC Bakong network." 
        });
      }
    }

    const statusMsg = checkData.responseCode === 0 ? 'Transaction Confirmed (Paid)' : (checkData.responseMessage || (checkData.errorCode === 1 ? 'Awaiting Payment' : 'Check Complete'));
    recordBakongActivity('check', statusMsg, `MD5: ${md5?.substring(0, 8)} | Code: ${checkData.responseCode}`, true);
    
    // Return real response directly from NBC Bakong network
    res.json(checkData);
  } catch (err: any) {
    console.error("Bakong Check Error:", err);
    recordBakongActivity('check', 'Network Error: ' + err.message, undefined, true);
    res.status(500).json({
      responseCode: 1,
      responseMessage: err.message || "Internal server error connecting to Bakong network."
    });
  }
});

// Stripe payment intent creation
app.post("/api/payment/create-intent", async (req, res) => {
  try {
    const { amount, currency, description, orderId, userId, companyId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      description,
      metadata: {
        orderId,
        userId,
        companyId
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error: any) {
    console.error("Stripe intent creation error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stripe webhook handler
app.post("/api/payment/webhook", express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Then define and call a function to handle the event
      handleSuccessfulPayment(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a function to handle the event
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({received: true});
});

async function handleSuccessfulPayment(paymentIntent: any) {
  try {
    const { orderId, userId, companyId } = paymentIntent.metadata;
    const amount = paymentIntent.amount / 100; // Convert from cents

    // Update subscription in Firebase
    await updateDoc(doc(db, "companies_settings", companyId), {
      subscription: {
        type: 'stripe_payment', // You might want to determine this based on amount
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updatedAt: new Date().toISOString(),
        lastPaymentHash: paymentIntent.id
      }
    });

    // TODO: Send confirmation email
  } catch (error) {
    console.error(`Webhook handler failed:`, error);
  }
}

export default app;
