import { format } from "date-fns";
import { km, enUS } from "date-fns/locale";

export const KHMER_DAYS = [
  "អាទិត្យ", // Sunday (0)
  "ចន្ទ",     // Monday (1)
  "អង្គារ",   // Tuesday (2)
  "ពុធ",     // Wednesday (3)
  "ព្រហស្បតិ៍",// Thursday (4)
  "សុក្រ",    // Friday (5)
  "សៅរ៍",    // Saturday (6)
];

export const KHMER_MONTHS = [
  "មករា",    // January (0)
  "កុម្ភៈ",    // February (1)
  "មីនា",     // March (2)
  "មេសា",    // April (3)
  "ឧសភា",    // May (4)
  "មិថុនា",   // June (5)
  "កក្កដា",   // July (6)
  "សីហា",    // August (7)
  "កញ្ញា",    // September (8)
  "តុលា",     // October (9)
  "វិច្ឆិកា",   // November (10)
  "ធ្នូ",      // December (11)
];

export const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

/**
 * Converts standard numbers/digits to Khmer numerals
 */
export function toKhmerDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => KHMER_DIGITS[parseInt(digit, 10)] || digit);
}

/**
 * Returns Khmer period of day: ព្រឹក (Morning/AM), រសៀល (Afternoon), ល្ងាច (Evening), យប់ (Night)
 */
export function getKhmerPeriodOfDay(date: Date): string {
  const hours = date.getHours();
  if (hours >= 0 && hours < 12) {
    return "ព្រឹក"; // Morning / AM
  } else if (hours >= 12 && hours < 17) {
    return "រសៀល"; // Afternoon
  } else if (hours >= 17 && hours < 20) {
    return "ល្ងាច"; // Evening
  } else {
    return "យប់"; // Night
  }
}

/**
 * Formats the live digital clock time components (hh:mm and AM/PM or Khmer period)
 */
export function formatLiveClock(date: Date, isKhmer: boolean): { time: string; period: string } {
  if (isKhmer) {
    const rawHours = date.getHours();
    const hours12 = rawHours % 12 || 12;
    const minutes = date.getMinutes();
    const time = toKhmerDigits(`${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
    const period = getKhmerPeriodOfDay(date);
    return { time, period };
  } else {
    const time = format(date, "hh:mm", { locale: enUS });
    const period = format(date, "a", { locale: enUS });
    return { time, period };
  }
}

/**
 * Formats full live date subtitle below clock
 * Khmer: ថ្ងៃពុធ ទី26 ខែសីហា ឆ្នាំ2026
 * English: Wednesday, August 26th, 2026
 */
export function formatLiveFullDate(date: Date, isKhmer: boolean): string {
  if (isKhmer) {
    const dayName = KHMER_DAYS[date.getDay()] || "";
    const dayNumber = date.getDate();
    const monthName = KHMER_MONTHS[date.getMonth()] || "";
    const year = date.getFullYear();
    return `ថ្ងៃ${dayName} ទី${toKhmerDigits(dayNumber)} ខែ${monthName} ឆ្នាំ${toKhmerDigits(year)}`;
  } else {
    return format(date, "EEEE, MMMM do, yyyy", { locale: enUS });
  }
}

/**
 * Formats top header live date badge
 * Khmer: ថ្ងៃពុធ ទី26 ខែសីហា ឆ្នាំ2026
 * English: Wednesday, 26 Aug 2026
 */
export function formatLiveHeaderDate(date: Date, isKhmer: boolean): string {
  if (isKhmer) {
    const dayName = KHMER_DAYS[date.getDay()] || "";
    const dayNumber = date.getDate();
    const monthName = KHMER_MONTHS[date.getMonth()] || "";
    const year = date.getFullYear();
    return `ថ្ងៃ${dayName} ទី${toKhmerDigits(dayNumber)} ខែ${monthName} ឆ្នាំ${toKhmerDigits(year)}`;
  } else {
    return format(date, "EEEE, d MMM yyyy", { locale: enUS });
  }
}

/**
 * Formats timestamps in logs (e.g. 08:30 AM / 08:30 ព្រឹក)
 */
export function formatTimeWithLocale(dateInput: Date | string | number | null | undefined, isKhmer: boolean): string {
  if (!dateInput) return "-";
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "-";

  if (isKhmer) {
    const rawHours = date.getHours();
    const hours12 = rawHours % 12 || 12;
    const minutes = date.getMinutes();
    const time = toKhmerDigits(`${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
    const period = getKhmerPeriodOfDay(date);
    return `${time} ${period}`;
  } else {
    return format(date, "hh:mm a", { locale: enUS });
  }
}
