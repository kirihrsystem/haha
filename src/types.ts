export interface Staff {
  id: string;
  companyId: string;
  name: string;
  nameKh?: string;
  passcode: string;
  role: 'admin' | 'staff' | 'super_admin';
  avatar?: string;
  hourlyRate: number;
  monthlySalary?: number;
  position?: string;
  branch?: string;
  shiftStart?: string; // HH:mm
  shiftEnd?: string;   // HH:mm
  shift2Start?: string; // HH:mm (Second shift)
  shift2End?: string;   // HH:mm (Second shift)
  breakHours?: number;
  shiftOverrides?: Record<number, { start: string, end: string, start2?: string, end2?: string, active: boolean, breakHours?: number }>; 
  bonus?: number;
  email?: string;
  phone?: string;
  profilePictureUrl?: string;
  startingDate?: string;
  address?: string;
  bankQrUrl?: string;
  nationalIdCardUrl?: string;
  password?: string;
  telegramChatId?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  category?: 'coupon' | 'invite'; // 'coupon' for promo discounts, 'invite' for workspace invite pass
  type: 'days' | 'months' | 'years' | 'unlimited' | 'lifetime';
  planType?: string; // e.g. 'starter_monthly', 'professional_yearly', 'enterprise', 'custom'
  employeeLimit?: number; // max number of employees allowed. Use Infinity or undefined for unlimited
  isPublic?: boolean; // If true, display publicly as an ad on subscription page
  duration: number; // e.g. 30 (days) or 999 (unlimited)
  maxUses: number;
  usedCount: number;
  price?: number;
  qrCodeUrl?: string; // custom image url or generated QR code data
  qrType?: 'auto' | 'custom' | 'none';
  expiresAt: string; // ISO string
  createdAt: string;
}

export interface Log {
  id: string;
  companyId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // ISO string
  timeOut?: string; 
  timeIn2?: string;
  timeOut2?: string;
  late: boolean;
  lateCheckIn?: boolean;
  earlyLeave: boolean;
  earlyCheckOut?: boolean;
  regularHours: number;
  overtimeHours: number;
  dailySalary: number;
  lateDeduction?: number;
  totalEarnings: number;
  status: 'active' | 'break' | 'active2' | 'checked_out';
  checkInPhotoUrl?: string;
  checkOutPhotoUrl?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  checkIn2PhotoUrl?: string;
  checkOut2PhotoUrl?: string;
  checkIn2Lat?: number;
  checkIn2Lng?: number;
  checkOut2Lat?: number;
  checkOut2Lng?: number;
}

export interface Leave {
  id: string;
  companyId: string;
  staffId: string;
  date: string;
  type: 'day_off' | 'permission' | 'late_checkin' | 'early_leave';
  isPaid?: boolean;
  reason: string;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  createdAt: string;
}

export interface PayrollDetailVisibility {
  basicSalary?: boolean;
  workPay?: boolean;
  overtimePay?: boolean;
  commission?: boolean;
  monthlyBonus?: boolean;
  manualDeduction?: boolean;
  lateDeduction?: boolean;
  deductions?: boolean;
  absentPenalties?: boolean;
  hourlyRate?: boolean;
}

export interface SubscriptionPlan {
  type: 'free' | 'monthly' | 'yearly' | 'unlimited' | 'lifetime' | 'starter_monthly' | 'starter_yearly' | 'professional_monthly' | 'professional_yearly' | 'enterprise';
  status: 'active' | 'expired' | 'pending' | 'suspended' | 'locked' | 'held';
  expiresAt?: string;
  lastPaymentHash?: string;
  updatedAt?: string;
  price?: number;
  employeeLimit?: number;
}

export interface Settings {
  id?: string;
  companyId: string;
  companyName?: string;
  companyCode?: string;
  slug?: string;
  logoUrl?: string;
  exchangeRate: number; 
  defaultHourlyRate: number;
  defaultOvertimeRate: number; // legacy?
  overtimeRateType?: 'multiplier' | 'fixed';
  overtimeRateValue?: number;
  lateDeductionPerHour?: number;
  currencyDisplay: 'USD' | 'KHR' | 'BOTH';
  currency?: string;
  officeLat?: number;
  officeLng?: number;
  officeRadius?: number;
  requireGeolocation?: 'NONE' | 'CHECKIN' | 'CHECKOUT' | 'BOTH';
  requirePhoto?: 'NONE' | 'CHECKIN' | 'CHECKOUT' | 'BOTH';
  gracePeriodMinutes?: number;
  overtimeGraceMinutes?: number;
  telegramChatId?: string;
  telegramAdminChatId?: string;
  companyPhone?: string;
  adminEmail?: string;
  officeAddress?: string;
  adminPayrollDetails?: PayrollDetailVisibility;
  employeePayrollDetails?: PayrollDetailVisibility;
  subscription?: SubscriptionPlan;
  isLocked?: boolean;
  lockReason?: string;
  lockedAt?: string;
}

export interface RevenueReportSchedule {
  id: string;
  enabled: boolean;
  frequency: 'weekly' | 'monthly';
  sendDay: number; // Weekly: 1=Monday...7=Sunday | Monthly: 1..31
  sendTime: string; // e.g. "09:00"
  recipients: string[]; // List of email addresses
  includeMetrics: {
    totalRevenue: boolean;
    activeWorkspaces: boolean;
    revenueBreakdown: boolean;
    topWorkspaces: boolean;
    recentTransactions: boolean;
    couponRedemptions: boolean;
  };
  emailSubjectTemplate?: string;
  lastSentAt?: string;
  nextScheduledAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ReportLog {
  id: string;
  reportType: 'revenue_summary' | 'renewal_alert';
  frequency: 'weekly' | 'monthly' | 'instant' | 'auto_reminder';
  recipients: string[];
  sentAt: string;
  status: 'sent' | 'failed' | 'simulated';
  summaryMetrics?: {
    totalRevenue: number;
    activeWorkspacesCount: number;
    subscribersCount: number;
    transactionsCount: number;
  };
  workspaceId?: string;
  workspaceName?: string;
  daysRemaining?: number;
  htmlBodyPreview?: string;
}

export interface RenewalAlertConfig {
  id: string;
  enabled: boolean;
  notifyDaysBefore: number[]; // e.g. [7, 3, 1, 0]
  autoSendEnabled: boolean;
  emailSubjectTemplate: string;
  recipientsScope: 'workspace_admin' | 'all_super_admins' | 'custom_list';
  customRecipients?: string[];
  lastAutoRunAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DirectMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  createdAt: string;
  repliedAt?: string;
  notes?: string;
}

export interface TelegramBotFAQ {
  id: string;
  category: string;
  questionEn: string;
  questionKh?: string;
  answerEn: string;
  answerKh?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TelegramBotSettings {
  id?: string;
  systemPromptEn?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactTelegram?: string;
  updatedAt?: string;
}

export interface Testimonial {
  id?: string;
  name: string;
  nameKh?: string;
  title: string;
  titleKh?: string;
  initial: string;
  quote: string;
  quoteKh?: string;
  color: string;
  row: number;
  createdAt: string;
}

export interface BakongApiUsageStats {
  date: string;
  dailyLimit: number;
  requestsUsedToday: number;
  remainingToday: number;
  qrGenerationsToday: number;
  checksToday: number;
  tokenRenewalsToday: number;
  totalLifetimeRequests: number;
  lastCheckedAt: string | null;
  lastStatus: string;
  recentLogs?: any[];
  isLimitReached: boolean;
  resetsAt: string;
  registeredEmails?: string[];
  recentActivity?: Array<{
    timestamp: string;
    type: 'qr' | 'check' | 'token';
    status: string;
    details?: string;
  }>;
}


