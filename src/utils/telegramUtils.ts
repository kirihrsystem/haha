import { useSettingsStore } from '../store';

export const sendTelegramNotification = async (message: string, isAdminMessage = false) => {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const settings = useSettingsStore.getState().settings;
  
  let chatIdString = "";
  if (isAdminMessage) {
    // STRICT PRIVACY: For admin/privacy notifications, ONLY use telegramAdminChatId or VITE_TELEGRAM_ADMIN_CHAT_ID.
    // Do NOT fall back to the general attendance telegramChatId, to prevent leaking sensitive payroll/leave/employee data to general staff groups!
    chatIdString = settings?.telegramAdminChatId || import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID || "";
  } else {
    // Exclusively for regular attendance notifications (Check-in, Check-out, Break, Shift 2)
    chatIdString = settings?.telegramChatId || import.meta.env.VITE_TELEGRAM_CHAT_ID || "";
  }

  if (!botToken || !chatIdString) {
    console.warn(`Telegram bot token or ${isAdminMessage ? 'admin ' : ''}chat ID is missing. Notification skipped.`);
    return;
  }

  // Support multiple chat IDs separated by commas, semicolons, or newlines
  const chatIds = chatIdString
    .split(/[,\n;]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (chatIds.length === 0) {
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await Promise.allSettled(
      chatIds.map(async (chatId) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (response.status === 403 || response.status === 400) {
            console.warn(`Telegram API error for chat ID ${chatId}: ${response.status}`, errData);
          } else {
            console.warn(`Telegram API error for chat ID ${chatId}: ${response.status}`, errData);
          }
        }
      })
    );
  } catch (error: any) {
    if (error?.message === "Failed to fetch" || error?.name === "TypeError") {
      console.warn("Failed to send Telegram notification (network error or invalid token).");
    } else {
      console.warn("Failed to send Telegram notification:", error);
    }
  }
};

export const sendDirectTelegramMessage = async (chatId: string | undefined, message: string): Promise<boolean> => {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!botToken || !chatId) return false;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
        parse_mode: 'HTML',
      }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 403) {
        console.warn(`Direct Telegram error for ${chatId}: 403 (User blocked bot)`);
      } else {
        console.warn(`Direct Telegram error for ${chatId}: ${response.status}`, errData);
      }
      return false;
    }
    return true;
  } catch (error: any) {
    if (error?.message === "Failed to fetch" || error?.name === "TypeError") {
      console.warn("Failed direct telegram message (network error or invalid token).");
    } else {
      console.warn("Failed direct telegram message:", error);
    }
    return false;
  }
};

export const getTelegramBotInfo = async (): Promise<{ username?: string; name?: string } | null> => {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;
  try {
    // Automatically delete webhook so getUpdates polling is never blocked by Error 409
    await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=false`).catch(() => {});
    
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();
    if (data.ok && data.result) {
      return {
        username: data.result.username,
        name: data.result.first_name,
      };
    }
  } catch (err: any) {
    if (err?.message === "Failed to fetch" || err?.name === "TypeError") {
      console.warn("Telegram bot info check skipped (network error or invalid token).");
    } else {
      console.warn("Error fetching bot info:", err);
    }
  }
  return null;
};

export const checkBotUpdatesForStaff = async (
  staffId: string,
  passcode?: string
): Promise<{ chatId: string; username?: string; firstName?: string } | null> => {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;
  try {
    let res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=-50&limit=50`);
    if (res.status === 409) {
      // If webhook is set, getUpdates returns Error 409 Conflict. Clear it quietly and retry.
      await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=false`).catch(() => {});
      res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=-50&limit=50`);
    }
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) {
      if (data && !data.ok) {
        console.warn("Telegram getUpdates API error:", data.description || data);
      }
      return null;
    }

    const updates = [...data.result].reverse();
    const nowSec = Math.floor(Date.now() / 1000);

    // 1. Priority check: Explicit mention of staffId, passcode, or /start <id>
    for (const u of updates) {
      const msg = u.message || u.edited_message || u.channel_post || (u.my_chat_member ? { chat: u.my_chat_member.chat, from: u.my_chat_member.from, date: u.my_chat_member.date, text: '/start' } : null);
      if (!msg || !msg.chat) continue;

      const text = (msg.text || "").trim();
      const chatId = String(msg.chat.id);

      if (
        (staffId && text.includes(staffId)) ||
        (passcode && text.includes(passcode)) ||
        text === `/start ${staffId}` ||
        text === `/start ${passcode}`
      ) {
        return {
          chatId,
          username: msg.from?.username,
          firstName: msg.from?.first_name || msg.chat?.first_name,
        };
      }
    }

    // 2. Fallback check: ANY recent message sent to the bot in the last 15 minutes (900 seconds)
    // This solves the issue where users don't see a START button and just type "hi", "hello", or any text/sticker.
    for (const u of updates) {
      const msg = u.message || u.edited_message || (u.my_chat_member ? { chat: u.my_chat_member.chat, from: u.my_chat_member.from, date: u.my_chat_member.date, text: '/start' } : null);
      if (!msg || !msg.chat || !msg.date) continue;
      
      const chatId = String(msg.chat.id);
      
      // Accept any message sent within the last 15 minutes
      if (nowSec - msg.date < 900) {
        return {
          chatId,
          username: msg.from?.username,
          firstName: msg.from?.first_name || msg.chat?.first_name,
        };
      }
    }
  } catch (err: any) {
    if (err?.message === "Failed to fetch" || err?.name === "TypeError") {
      console.warn("Telegram bot updates check skipped (network error or invalid token).");
    } else {
      console.warn("Error polling telegram updates:", err);
    }
  }
  return null;
};

export const formatTelegramCurrency = (amount: number | undefined | null): string => {
  const val = amount || 0;
  const rounded = Math.round(val * 100) / 100;
  
  const usdStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rounded);
  
  const settings = useSettingsStore.getState().settings;
  const exchangeRate = settings?.exchangeRate || 4000;
  const riel = Math.round((val * exchangeRate) / 100) * 100;
  const khrStr = new Intl.NumberFormat('km-KH', { style: 'currency', currency: 'KHR', maximumFractionDigits: 0 }).format(riel);

  return `${usdStr} | ${khrStr}`;
};
