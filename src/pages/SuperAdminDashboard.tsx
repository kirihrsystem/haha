import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Staff, Settings, Coupon, DirectMessage, BakongApiUsageStats, Testimonial } from '../types';
import { useAuthStore, useThemeStore } from '../store';
import { Building2, ChevronLeft, ChevronRight, CreditCard, ArrowUpRight, ArrowDownRight, List, Menu, Users, Ticket, Search, Plus, Trash2, Calendar, ShieldAlert, LogIn, PauseCircle, PlayCircle, Key, Edit, X, Activity, DollarSign, QrCode, Copy, Check, Sparkles, Download, RefreshCw, RefreshCcw, Image as ImageIcon, Tag, Printer, Zap, LogOut, ShieldCheck, User, TrendingUp, TrendingDown, Clock, PieChart as LucidePieChart, BarChart3, CheckCircle2, Wallet, Filter, ExternalLink, ArrowRight, Lock, Unlock, Camera, Upload, Mail, Sun, Moon, Settings as SettingsIcon, MessageSquare, Inbox, CheckCheck, Archive, Reply, MessageCircle, Bot, Gauge, Server, AlertTriangle, RotateCcw, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import ScheduledRevenueReports from '../components/ScheduledRevenueReports';
import { TelegramBotManager } from '../components/TelegramBotManager';
import TestimonialsManager from '../components/TestimonialsManager';
import SystemResetManager from '../components/SystemResetManager';
import { compressImage } from '../utils/imageUtils';
import ScrollLock from '../components/ScrollLock';

export default function SuperAdminDashboard() {
  const { user, setUser, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Settings[]>([]);
  const [allUsers, setAllUsers] = useState<Staff[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'read' | 'replied' | 'archived'>('all');
  const [selectedMessage, setSelectedMessage] = useState<DirectMessage | null>(null);
  const [replyNote, setReplyNote] = useState('');
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);
  
  // Bakong API Quota & Usage state
  const [bakongUsage, setBakongUsage] = useState<BakongApiUsageStats | null>(null);
  const [isLoadingBakongUsage, setIsLoadingBakongUsage] = useState(false);
  const [showQuotaConfigModal, setShowQuotaConfigModal] = useState(false);
  const [customQuotaInput, setCustomQuotaInput] = useState('100');
  const [isSubmittingQuotaUpdate, setIsSubmittingQuotaUpdate] = useState(false);
  const [quotaActionMessage, setQuotaActionMessage] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users' | 'coupons' | 'transactions' | 'reports' | 'messages' | 'telegram_bot' | 'bakong_quota' | 'testimonials' | 'system_reset'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    // Scroll to top when tab changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit user password
  const [editingUser, setEditingUser] = useState<Staff | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Coupon form & QR view modal state
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponFilter, setCouponFilter] = useState<'all' | 'coupon' | 'invite'>('all');
  const [selectedQrCoupon, setSelectedQrCoupon] = useState<Coupon | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Lock / Hold Workspace modal state
  const [lockingCompany, setLockingCompany] = useState<Settings | null>(null);
  const [lockStatus, setLockStatus] = useState<'locked' | 'held' | 'active'>('locked');
  const [lockReasonInput, setLockReasonInput] = useState('');
  const [isSubmittingLock, setIsSubmittingLock] = useState(false);

  // Super Admin Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || 'Super Admin');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'kirihrsystem@gmail.com');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '093988991');
  const [profileAvatar, setProfileAvatar] = useState(user?.profilePictureUrl || user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenProfileModal = () => {
    setProfileName(user?.name || 'Super Admin');
    setProfileEmail(user?.email || 'kirihrsystem@gmail.com');
    setProfilePhone(user?.phone || '093988991');
    setProfileAvatar(user?.profilePictureUrl || user?.avatar || '');
    setShowProfileModal(true);
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size should be under 5MB.");
        return;
      }
      try {
        const compressedBase64 = await compressImage(file, 800, 800, 0.7, true);
        setProfileAvatar(compressedBase64);
      } catch (err) {
        console.error("Failed to compress image:", err);
        alert("Failed to process image.");
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updatedUser: Staff = {
        ...(user || {
          id: 'super_admin',
          companyId: '',
          name: 'Super Admin',
          passcode: '0000',
          role: 'super_admin',
          hourlyRate: 0,
          createdAt: new Date().toISOString()
        }),
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        profilePictureUrl: profileAvatar,
        avatar: profileAvatar,
      };

      // 1. Save to Firestore staff collection
      if (user?.id) {
        await updateDoc(doc(db, 'staff', user.id), {
          name: profileName.trim(),
          email: profileEmail.trim(),
          phone: profilePhone.trim(),
          profilePictureUrl: profileAvatar,
          avatar: profileAvatar,
        }).catch(async () => {
          await setDoc(doc(db, 'staff', user.id), updatedUser, { merge: true });
        });
      } else {
        const q = query(collection(db, 'staff'), where('role', '==', 'super_admin'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const targetDoc = snap.docs[0];
          await updateDoc(doc(db, 'staff', targetDoc.id), {
            name: profileName.trim(),
            email: profileEmail.trim(),
            phone: profilePhone.trim(),
            profilePictureUrl: profileAvatar,
            avatar: profileAvatar,
          });
        }
      }

      // 2. Update Auth Store so header and entire app reflect changes
      setUser(updatedUser, user?.companyId || '');

      // 3. Update local user list
      setAllUsers(prev => prev.map(u => (u.id === user?.id || u.role === 'super_admin') ? {
        ...u,
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        profilePictureUrl: profileAvatar,
        avatar: profileAvatar,
      } : u));

      setShowProfileModal(false);
    } catch (err: any) {
      console.error("Error saving super admin profile", err);
      alert("Failed to update profile: " + (err?.message || err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Helper to format date in local timezone YYYY-MM-DD
  const formatLocalDate = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [newBakongEmail, setNewBakongEmail] = useState('');
  const [isAddingBakongEmail, setIsAddingBakongEmail] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    category: 'coupon',
    type: 'days',
    duration: 30,
    maxUses: 100,
    price: 0,
    qrType: 'auto',
    qrCodeUrl: '',
    isPublic: false,
    expiresAt: formatLocalDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
  });

  useEffect(() => {
    fetchData();
    fetchBakongUsage();
  }, []);

  const fetchBakongUsage = async () => {
    setIsLoadingBakongUsage(true);
    try {
      const res = await fetch('/api/billing/usage');
      if (res.ok) {
        const data = await res.json();
        setBakongUsage(data);
        if (data.dailyLimit) {
          setCustomQuotaInput(String(data.dailyLimit));
        }
      }
    } catch (err) {
      console.warn("Could not fetch Bakong API usage stats:", err);
    } finally {
      setIsLoadingBakongUsage(false);
    }
  };

  const handleResetBakongUsage = async () => {
    if (!window.confirm("Are you sure you want to reset the Bakong API request counter for today?")) return;
    try {
      setIsLoadingBakongUsage(true);
      const res = await fetch('/api/billing/usage/reset', { method: 'POST' });
      if (res.ok) {
        setQuotaActionMessage("Bakong API request counter reset successfully.");
        setTimeout(() => setQuotaActionMessage(null), 4000);
        await fetchBakongUsage();
      }
    } catch (err) {
      console.error("Error resetting Bakong quota:", err);
    } finally {
      setIsLoadingBakongUsage(false);
    }
  };

  const handleUpdateBakongLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = Number(customQuotaInput);
    if (isNaN(limitNum) || limitNum <= 0) return;
    setIsSubmittingQuotaUpdate(true);
    try {
      const res = await fetch('/api/billing/usage/set-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: limitNum })
      });
      if (res.ok) {
        setShowQuotaConfigModal(false);
        setQuotaActionMessage(`Daily limit updated to ${limitNum} requests/day.`);
        setTimeout(() => setQuotaActionMessage(null), 4000);
        await fetchBakongUsage();
      }
    } catch (err) {
      console.error("Error updating Bakong daily limit:", err);
    } finally {
      setIsSubmittingQuotaUpdate(false);
    }
  };

  const handleAddBakongEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBakongEmail.trim()) return;
    setIsAddingBakongEmail(true);
    try {
      const res = await fetch('/api/billing/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newBakongEmail.trim() })
      });
      if (res.ok) {
        setQuotaActionMessage(`Added new Bakong API email: ${newBakongEmail.trim()}`);
        setNewBakongEmail('');
        setTimeout(() => setQuotaActionMessage(null), 4000);
        await fetchBakongUsage();
      }
    } catch (err) {
      console.error("Error adding Bakong email:", err);
    } finally {
      setIsAddingBakongEmail(false);
    }
  };

  const handleRemoveBakongEmail = async (emailToRemove: string) => {
    try {
      setIsLoadingBakongUsage(true);
      const res = await fetch(`/api/billing/emails/${encodeURIComponent(emailToRemove)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setQuotaActionMessage(`Removed Bakong API email: ${emailToRemove}`);
        setTimeout(() => setQuotaActionMessage(null), 4000);
        await fetchBakongUsage();
      } else {
        const errorData = await res.json();
        console.error("Failed to remove email:", errorData);
        alert(errorData.error || "Failed to remove email.");
      }
    } catch (err) {
      console.error("Error removing Bakong email:", err);
    } finally {
      setIsLoadingBakongUsage(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      fetchBakongUsage();
      
      // Fetch Companies
      try {
        const compSnap = await getDocs(collection(db, 'companies_settings'));
        const compData = compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Settings));
        setCompanies(compData);
      } catch (compErr) {
        console.warn("Notice while fetching companies:", compErr);
      }

      // Fetch All Users
      try {
        const usersSnap = await getDocs(collection(db, 'staff'));
        const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
        setAllUsers(usersData);
      } catch (userErr) {
        console.warn("Notice while fetching users:", userErr);
      }

      // Fetch Coupons
      try {
        const couponsSnap = await getDocs(query(collection(db, 'coupons'), orderBy('createdAt', 'desc')));
        const couponsData = couponsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
        setCoupons(couponsData);
      } catch (couponErr) {
        console.warn("Notice while fetching coupons:", couponErr);
      }

      // Fetch Testimonials
      try {
        const testSnap = await getDocs(collection(db, 'testimonials'));
        const testData = testSnap.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial));
        setTestimonials(testData);
      } catch (testErr) {
        console.warn("Notice while fetching testimonials:", testErr);
      }

      // Fetch Direct Messages
      try {
        const msgsSnap = await getDocs(query(collection(db, 'direct_messages'), orderBy('createdAt', 'desc')));
        const msgsData = msgsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DirectMessage));
        setDirectMessages(msgsData);
      } catch (msgErr) {
        console.warn("Direct messages collection initialized or empty:", msgErr);
        setDirectMessages([]);
      }
    } catch (err) {
      console.warn("Notice syncing super admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessageStatus = async (msgId: string, newStatus: 'unread' | 'read' | 'replied' | 'archived', notes?: string) => {
    setIsUpdatingMessage(true);
    try {
      const updatePayload: any = { status: newStatus };
      if (newStatus === 'replied') {
        updatePayload.repliedAt = new Date().toISOString();
      }
      if (notes !== undefined) {
        updatePayload.notes = notes;
      }
      await updateDoc(doc(db, 'direct_messages', msgId), updatePayload);
      setDirectMessages(prev => prev.map(m => m.id === msgId ? { ...m, ...updatePayload } : m));
      if (selectedMessage?.id === msgId) {
        setSelectedMessage(prev => prev ? { ...prev, ...updatePayload } : null);
      }
    } catch (err) {
      console.error("Error updating message status", err);
    } finally {
      setIsUpdatingMessage(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteDoc(doc(db, 'direct_messages', msgId));
        setDirectMessages(prev => prev.filter(m => m.id !== msgId));
        if (selectedMessage?.id === msgId) setSelectedMessage(null);
      } catch (err) {
        console.error("Error deleting message", err);
      }
    }
  };

  const generateRandomCode = (category: 'coupon' | 'invite') => {
    const prefix = category === 'invite' ? 'INVITE' : 'KIRI';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewCoupon(prev => ({ ...prev, code: `${prefix}-${randStr}-${randNum}` }));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(code);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const downloadQrCode = (code: string, containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || (window as any).webkitURL;
      const blobURL = URLObj.createObjectURL(svgBlob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width + 40;
        canvas.height = image.height + 40;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 20, 20);
          const png = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = png;
          downloadLink.download = `QR-${code}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };
      image.src = blobURL;
    } else {
      const imgEl = container.querySelector('img');
      if (imgEl && imgEl.src) {
        const downloadLink = document.createElement('a');
        downloadLink.href = imgEl.src;
        downloadLink.download = `QR-${code}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 800, 800, 0.7);
        setNewCoupon({ ...newCoupon, qrCodeUrl: compressedBase64, qrType: 'custom' });
      } catch (err) {
        console.error("Failed to compress QR image:", err);
      }
    }
  };

  // Expiry preset helper
  const applyExpiryPreset = (days: number, isEdit = false) => {
    const d = new Date();
    if (days >= 30000) {
      d.setFullYear(2099, 11, 31);
    } else {
      d.setDate(d.getDate() + days);
    }
    const dateStr = formatLocalDate(d);
    if (isEdit && editingCoupon) {
      setEditingCoupon({ ...editingCoupon, expiresAt: dateStr });
    } else {
      setNewCoupon(prev => ({ ...prev, expiresAt: dateStr }));
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    try {
      const couponId = newCoupon.code.toUpperCase().replace(/\s+/g, '');
      const couponDoc: Coupon = {
        id: couponId,
        code: couponId,
        category: newCoupon.category || 'coupon',
        type: newCoupon.type as 'days' | 'months' | 'years',
        duration: Number(newCoupon.duration),
        maxUses: Number(newCoupon.maxUses),
        usedCount: 0,
        price: Number(newCoupon.price || 0),
        qrType: newCoupon.qrType || 'auto',
        qrCodeUrl: newCoupon.qrCodeUrl || '',
        planType: newCoupon.planType || '',
        employeeLimit: newCoupon.employeeLimit || 0,
        isPublic: !!newCoupon.isPublic,
        expiresAt: new Date(newCoupon.expiresAt as string).toISOString(),
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'coupons', couponId), couponDoc);
      setShowCouponForm(false);
      setNewCoupon({
        code: '',
        category: 'coupon',
        type: 'days',
        duration: 30,
        maxUses: 100,
        price: 0,
        qrType: 'auto',
        qrCodeUrl: '',
        isPublic: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      console.error("Error creating coupon/invite code", err);
    }
  };

  // Delete confirmation modal state
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

  const confirmDeleteCoupon = async () => {
    if (!deletingCoupon) return;
    try {
      const docId = deletingCoupon.id || deletingCoupon.code;
      await deleteDoc(doc(db, 'coupons', docId));
      if (deletingCoupon.code && deletingCoupon.code !== docId) {
        await deleteDoc(doc(db, 'coupons', deletingCoupon.code)).catch(() => {});
      }
      setCoupons(prev => prev.filter(c => c.id !== deletingCoupon.id && c.code !== deletingCoupon.code));
      setDeletingCoupon(null);
      fetchData();
    } catch (err: any) {
      console.error("Error deleting coupon", err);
      // Fallback optimistic deletion from UI state
      setCoupons(prev => prev.filter(c => c.id !== deletingCoupon.id && c.code !== deletingCoupon.code));
      setDeletingCoupon(null);
    }
  };

  const handleEditQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCoupon) {
      try {
        const compressedBase64 = await compressImage(file, 800, 800, 0.7);
        setEditingCoupon({ ...editingCoupon, qrCodeUrl: compressedBase64, qrType: 'custom' });
      } catch (err) {
        console.error("Failed to compress QR image:", err);
      }
    }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      const codeId = editingCoupon.code.toUpperCase().replace(/\s+/g, '');
      const updatedDoc: Coupon = {
        ...editingCoupon,
        code: codeId,
        duration: Number(editingCoupon.duration),
        maxUses: Number(editingCoupon.maxUses),
        price: Number(editingCoupon.price || 0),
        expiresAt: editingCoupon.expiresAt.includes('T') ? editingCoupon.expiresAt : new Date(editingCoupon.expiresAt).toISOString()
      };
      await setDoc(doc(db, 'coupons', editingCoupon.id), updatedDoc);
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? updatedDoc : c));
      setEditingCoupon(null);
      fetchData();
    } catch (err: any) {
      console.error("Error updating coupon", err);
      alert("Failed to update coupon: " + (err?.message || err));
    }
  };

  const openLockModal = (company: Settings) => {
    setLockingCompany(company);
    const subStatus = company.subscription?.status;
    if (subStatus === 'held') {
      setLockStatus('held');
    } else if (subStatus === 'suspended' || subStatus === 'locked' || company.isLocked) {
      setLockStatus('locked');
    } else {
      setLockStatus('locked');
    }
    setLockReasonInput(company.lockReason || '');
  };

  const handleSaveWorkspaceLockStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lockingCompany) return;
    const targetId = lockingCompany.id || lockingCompany.companyId;
    if (!targetId) return;

    setIsSubmittingLock(true);
    try {
      const currentSub = lockingCompany.subscription || { type: 'free', status: 'active', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
      
      const isLockedBool = lockStatus !== 'active';
      const newSubStatus = lockStatus === 'active' ? 'active' : (lockStatus === 'held' ? 'held' : 'locked');
      const reasonToSave = lockStatus === 'active' ? '' : lockReasonInput.trim();

      await updateDoc(doc(db, 'companies_settings', targetId), {
        subscription: {
          ...currentSub,
          status: newSubStatus
        },
        isLocked: isLockedBool,
        lockReason: reasonToSave,
        lockedAt: isLockedBool ? new Date().toISOString() : ''
      });

      // Optimistically update local state
      setCompanies(prev => prev.map(c => {
        if ((c.id || c.companyId) === targetId) {
          return {
            ...c,
            subscription: {
              ...(c.subscription || currentSub),
              status: newSubStatus
            },
            isLocked: isLockedBool,
            lockReason: reasonToSave,
            lockedAt: isLockedBool ? new Date().toISOString() : ''
          };
        }
        return c;
      }));

      setLockingCompany(null);
      setLockReasonInput('');
      fetchData();
    } catch (err: any) {
      console.error("Error saving workspace lock/hold status", err);
      alert("Failed to update lock status: " + (err?.message || err));
    } finally {
      setIsSubmittingLock(false);
    }
  };

  const handleToggleSuspendCompany = async (company: Settings) => {
    openLockModal(company);
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };
  
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'staff', userToDelete));
      fetchData();
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user", err);
    }
  };

  const handleSavePassword = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'staff', editingUser.id), {
        password: newPassword,
        passcode: newPasscode
      });
      setEditingUser(null);
      fetchData();
    } catch (err) {
      console.error("Error updating password", err);
    }
  };

  const handleLoginAsCompany = (companyId: string, companyName?: string) => {
    // Find the primary admin for this company
    const companyAdmin = allUsers.find(u => u.companyId === companyId && u.role === 'admin');
    if (companyAdmin) {
      setUser(companyAdmin, companyId, companyName || 'Workspace');
      navigate('/admin');
    } else {
      // If no admin found, find any staff and upgrade them to admin in memory to view dashboard
      const companyStaff = allUsers.find(u => u.companyId === companyId);
      if (companyStaff) {
         setUser({ ...companyStaff, role: 'admin' }, companyId, companyName || 'Workspace');
         navigate('/admin');
      } else {
        alert("This workspace has no users to login as.");
      }
    }
  };

  const handleLoginAsUser = (targetUser: Staff) => {
    const comp = companies.find(c => c.companyId === targetUser.companyId);
    setUser(targetUser, targetUser.companyId, comp?.companyName || 'Workspace');
    if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
      navigate('/admin');
    } else {
      navigate('/employee');
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-slate-500">You must be a platform administrator to view this page.</p>
      </div>
    );
  }

  const filteredCompanies = companies.filter(c => 
    c.companyName?.toLowerCase().includes(search.toLowerCase()) || 
    c.companyCode?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getCompanyUsers = (compId: string) => allUsers.filter(u => u.companyId === compId);

    
  const parseSubDate = (sub: any): Date => {
    const tryParse = (val: any): Date | null => {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      if (typeof val.toDate === 'function') {
        try { const d = val.toDate(); if (!isNaN(d.getTime())) return d; } catch (e) {}
      }
      if (typeof val.toMillis === 'function') {
        try { const d = new Date(val.toMillis()); if (!isNaN(d.getTime())) return d; } catch (e) {}
      }
      if (typeof val.seconds === 'number') {
        const d = new Date(val.seconds * 1000);
        if (!isNaN(d.getTime())) return d;
      }
      if (typeof val === 'number') {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
      }
      if (typeof val === 'string') {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    };

    const dUpdated = tryParse(sub?.updatedAt);
    const dCreated = tryParse(sub?.createdAt);
    const dExp = tryParse(sub?.expiresAt);

    // If dUpdated or dCreated is present and not in the future (within 12 hours of now), return it directly
    const nowBuffer = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const candidateDate = dUpdated || dCreated;

    if (candidateDate && candidateDate <= nowBuffer) {
      return candidateDate;
    }

    // If the candidate date is in the future (which happens when updatedAt was erroneously saved as expiresAt),
    // or if candidateDate is missing, derive transaction date from the expiration date:
    const refExp = candidateDate && candidateDate > nowBuffer ? candidateDate : dExp;
    if (refExp) {
      if (sub?.type === 'unlimited' || sub?.type === 'lifetime' || refExp.getFullYear() > 2050) {
        return new Date();
      } else if (sub?.type === 'yearly' || sub?.type?.endsWith('_yearly')) {
        return new Date(refExp.getFullYear() - 1, refExp.getMonth(), refExp.getDate());
      } else {
        return new Date(refExp.getFullYear(), refExp.getMonth() - 1, refExp.getDate());
      }
    }

    return new Date();
  };

  const superAdminCompanyIds = React.useMemo(() => new Set(allUsers.filter(u => u.role === 'super_admin').map(u => u.companyId)), [allUsers]);
  const totalRevenue = React.useMemo(() => {
    return coupons.reduce((sum, c) => {
      const price = c.price || 0;
      const count = (c.usedCount && c.usedCount > 0) ? c.usedCount : (price > 0 ? 1 : 0);
      return sum + (price * count);
    }, 0);
  }, [coupons]);

  const revenueStats = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let daily = 0;
    let monthly = 0;
    let yearly = 0;
    let prevDaily = 0;
    let prevMonthly = 0;
    let prevYearly = 0;
    let total = 0;
    
    // For calculating MoM and YoY
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthStr = prevMonthDate.getMonth();
    const prevMonthYear = prevMonthDate.getFullYear();
    const prevYearStr = currentYear - 1;

    let subRevenue = 0;
    let passRevenue = 0;
    let subCount = 0;
    let couponCount = 0;

    let monthlySubCount = 0;
    let monthlySubRev = 0;
    let yearlySubCount = 0;
    let yearlySubRev = 0;
    let unlimitedSubCount = 0;
    let unlimitedSubRev = 0;
    let inviteCodeCount = 0;
    let inviteCodeRev = 0;
    let promoCouponCount = 0;
    let promoCouponRev = 0;
    let freeCouponCount = 0;
    let freeCouponRev = 0;

    // Track workspace subscriptions metadata and REAL CASH INCOME
    companies.forEach(c => {
      if (c.subscription?.status === 'active') {
        let price = c.subscription.price;
        const usedCodeStr = (c.subscription as any).usedCode;
        let matchedCoupon: Coupon | undefined;
        if (usedCodeStr) {
          matchedCoupon = coupons.find(coup => coup.code === usedCodeStr || coup.id === usedCodeStr);
          if (matchedCoupon && matchedCoupon.price !== undefined) price = matchedCoupon.price;
        }
        if (price === undefined || price === null) {
           if (c.subscription.type === 'starter_monthly') price = 4.99;
           else if (c.subscription.type === 'starter_yearly') price = 47.99;
           else if (c.subscription.type === 'professional_monthly') price = 9.99;
           else if (c.subscription.type === 'professional_yearly') price = 95.99;
           else price = c.subscription.type === 'yearly' ? 0.2 : (c.subscription.type === 'monthly' ? 0.1 : 0);
        }
        const isFreeHash = c.subscription.lastPaymentHash?.startsWith('FREE_');
        const isInvite = c.subscription.lastPaymentHash?.startsWith('INVITE_') || c.subscription.lastPaymentHash?.includes('INVITE') || (c.subscription.type as string) === 'invite';
        
        // Is it actually a paid subscription?
        const isPaidTransaction = !isFreeHash && !isInvite && c.subscription.type !== 'free';
        const actualCash = isPaidTransaction ? price : 0;

        const isUnlimited = c.subscription.type === 'unlimited' || c.subscription.type === 'lifetime' || (matchedCoupon && (matchedCoupon.type === 'unlimited' || matchedCoupon.type === 'lifetime'));

        if (isInvite) {
          inviteCodeCount++;
          inviteCodeRev += 0; // It's free
          freeCouponCount++;
        } else if (isUnlimited) {
          unlimitedSubCount++;
          unlimitedSubRev += actualCash;
        } else if (matchedCoupon && matchedCoupon.price > 0) {
          promoCouponCount++;
          promoCouponRev += actualCash;
        } else if (matchedCoupon && (matchedCoupon.price === 0 || isFreeHash)) {
          freeCouponCount++;
          freeCouponRev += 0;
        } else if (c.subscription.type === 'yearly' || c.subscription.type?.endsWith('_yearly')) {
          yearlySubCount++;
          yearlySubRev += actualCash;
        } else {
          monthlySubCount++;
          monthlySubRev += actualCash;
        }

        if (isPaidTransaction) {
          subRevenue += price;
          subCount++;
          total += price;

          const pDate = parseSubDate(c.subscription);
          const pDateStr = pDate.getFullYear() + '-' + String(pDate.getMonth() + 1).padStart(2, '0') + '-' + String(pDate.getDate()).padStart(2, '0');

          if (pDate.getFullYear() === currentYear) {
            yearly += price;
            if (pDate.getMonth() === currentMonth) {
              monthly += price;
            } else if (c.subscription.status === 'active') {
              if (c.subscription.type === 'yearly' || c.subscription.type?.endsWith('_yearly')) {
                monthly += Number((price / 12).toFixed(2));
              } else {
                monthly += price;
              }
            }
          } else if (c.subscription.status === 'active') {
            if (c.subscription.type === 'yearly' || c.subscription.type?.endsWith('_yearly')) {
              monthly += Number((price / 12).toFixed(2));
            } else {
              monthly += price;
            }
            yearly += price;
          }

          if (pDateStr === todayStr) {
            daily += price;
          }

          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
          if (pDateStr === yesterdayStr) {
            prevDaily += price;
          }

          if (pDate.getFullYear() === prevMonthYear && pDate.getMonth() === prevMonthStr) {
            prevMonthly += price;
          }
        }
      }
    });

    // Historical coupon usage
    coupons.forEach(c => {
      const price = c.price || 0;
      const uses = c.usedCount || 0;
      if (uses > 0) {
        couponCount += uses;
        if (c.type === 'unlimited' || c.type === 'lifetime') {
          if (unlimitedSubCount === 0 && price > 0) {
            unlimitedSubRev += price * uses;
          }
        } else if (price > 0) {
          if (promoCouponCount === 0) {
            promoCouponRev += price * uses;
          }
        } else {
          if (freeCouponCount === 0) {
            freeCouponCount += uses;
          }
        }
      }
    });

    const momGrowth = prevMonthly > 0 ? ((monthly - prevMonthly) / prevMonthly) * 100 : (monthly > 0 ? 100 : 0);
    const yoyGrowth = prevYearly > 0 ? ((yearly - prevYearly) / prevYearly) * 100 : (yearly > 0 ? 100 : 0);

    return {
      yesterday: Number(prevDaily.toFixed(2)),
      daily: Number(daily.toFixed(2)),
      monthly: Number(monthly.toFixed(2)),
      yearly: Number(yearly.toFixed(2)),
      total: Number(total.toFixed(2)),
      momGrowth: Number(momGrowth.toFixed(1)),
      yoyGrowth: Number(yoyGrowth.toFixed(1)),
      subRevenue: Number(subRevenue.toFixed(2)),
      passRevenue: Number(passRevenue.toFixed(2)),
      activeSubscribers: subCount,
      totalRedemptions: couponCount,
      categories: {
        monthlySub: { label: 'Monthly Plan', count: monthlySubCount, revenue: Number(monthlySubRev.toFixed(2)) },
        yearlySub: { label: 'Yearly Plan', count: yearlySubCount, revenue: Number(yearlySubRev.toFixed(2)) },
        inviteCode: { label: 'Invite Code', count: inviteCodeCount, revenue: Number(inviteCodeRev.toFixed(2)) },
        promoCoupon: { label: 'Promocode Coupon', count: promoCouponCount, revenue: Number(promoCouponRev.toFixed(2)) },
        freeCoupon: { label: 'Free Coupon', count: freeCouponCount, revenue: Number(freeCouponRev.toFixed(2)) },
        unlimitedCoupon: { label: 'Unlimited Coupon', count: unlimitedSubCount, revenue: Number(unlimitedSubRev.toFixed(2)) }
      }
    };
  }, [companies, coupons]);

  // Derive real transactions from actual subscriptions and coupon usages in Firestore
  const realTransactions = React.useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      userName: string;
      userEmail: string;
      amount: number;
      status: string;
      method: string;
    }> = [];

    // 1. Transactions from workspace subscriptions (Only count QR Payments)
    companies.forEach((comp, idx) => {
      if (comp.subscription) {
        const hash = comp.subscription.lastPaymentHash || '';
        const isFreeHash = hash.startsWith('FREE_') || hash.startsWith('INVITE_');
        const isPaidTransaction = !isFreeHash && (comp.subscription.type !== 'free') && comp.subscription.status === 'active';

        // ONLY include if they actually paid
        if (isPaidTransaction) {
          const adminUser = allUsers.find(u => u.companyId === comp.companyId && (u.role === 'admin' || u.role === 'super_admin')) || allUsers.find(u => u.companyId === comp.companyId);
          
          let subPrice = comp.subscription.price;
          const usedCodeStr = (comp.subscription as any).usedCode;
          if (usedCodeStr) {
            const matchedCoupon = coupons.find(coup => coup.code === usedCodeStr || coup.id === usedCodeStr);
            if (matchedCoupon) subPrice = matchedCoupon.price;
          }
          if (subPrice === undefined || subPrice === null) {
             if (comp.subscription.type === 'starter_monthly') subPrice = 4.99;
             else if (comp.subscription.type === 'starter_yearly') subPrice = 47.99;
             else if (comp.subscription.type === 'professional_monthly') subPrice = 9.99;
             else if (comp.subscription.type === 'professional_yearly') subPrice = 95.99;
             else subPrice = comp.subscription.type === 'yearly' ? 0.2 : (comp.subscription.type === 'monthly' ? 0.1 : 0);
          }
          
          const pDate = parseSubDate(comp.subscription);

          list.push({
            id: `sub_${comp.companyId || comp.id || idx}`,
            date: pDate.toLocaleDateString(),
            userName: adminUser?.name || `${comp.companyName || 'Workspace'} Admin`,
            userEmail: adminUser?.email || `admin@${comp.slug || 'workspace'}.com`,
            amount: subPrice,
            status: 'Completed',
            method: hash.length > 5 ? `Bakong KHQR (${hash.slice(0, 8)})` : 'Online Payment'
          });
        }
      }
    });

    return list;
  }, [companies, allUsers, coupons]);

  const filteredTransactions = realTransactions.filter(t => 
    t.userName.toLowerCase().includes(search.toLowerCase()) ||
    t.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    t.method.toLowerCase().includes(search.toLowerCase())
  );

  const getChartData = () => {
    const now = new Date();
    if (timeRange === 'daily') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        const dayName = days[d.getDay()];
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        let daySubRev = 0;
        let dayActiveCount = 0;

        companies.forEach(c => {
          if (c.subscription?.status === 'active') {
            const pDate = parseSubDate(c.subscription);

            if (pDate <= dayEnd) {
              dayActiveCount++;
            }

            const isFreeHash = c.subscription.lastPaymentHash?.startsWith('FREE_') || c.subscription.lastPaymentHash?.startsWith('INVITE_');
            const isPaidTransaction = !isFreeHash && (c.subscription.type !== 'free') && c.subscription.status === 'active';

            if (isPaidTransaction) {
              let price = c.subscription.price;
              const usedCodeStr = (c.subscription as any).usedCode;
              if (usedCodeStr) {
                 const matchedCoupon = coupons.find(coup => coup.code === usedCodeStr || coup.id === usedCodeStr);
                 if (matchedCoupon && matchedCoupon.price !== undefined) price = matchedCoupon.price;
              }
              if (price === undefined || price === null) {
           if (c.subscription.type === 'starter_monthly') price = 4.99;
           else if (c.subscription.type === 'starter_yearly') price = 47.99;
           else if (c.subscription.type === 'professional_monthly') price = 9.99;
           else if (c.subscription.type === 'professional_yearly') price = 95.99;
           else price = c.subscription.type === 'yearly' ? 0.2 : (c.subscription.type === 'monthly' ? 0.1 : 0);
        }

              if (pDate.getFullYear() + '-' + String(pDate.getMonth() + 1).padStart(2, '0') + '-' + String(pDate.getDate()).padStart(2, '0') === dayStr) {
                daySubRev += price;
              }
            }
          }
        });

        result.push({
          name: dayName,
          label: dayName,
          revenue: Number(daySubRev.toFixed(2)),
          value: Number(daySubRev.toFixed(2)),
          active: dayActiveCount
        });
      }
      return result;
    } else {
      const result = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        
        let monthSubRev = 0;
        let monthActiveCount = 0;

        companies.forEach(c => {
          if (c.subscription?.status === 'active') {
            const pDate = parseSubDate(c.subscription);

            if (pDate <= monthEnd) {
              monthActiveCount++;
            }

            const isFreeHash = c.subscription.lastPaymentHash?.startsWith('FREE_') || c.subscription.lastPaymentHash?.startsWith('INVITE_');
            const isPaidTransaction = !isFreeHash && (c.subscription.type !== 'free') && c.subscription.status === 'active';

            if (isPaidTransaction) {
              let price = c.subscription.price;
              const usedCodeStr = (c.subscription as any).usedCode;
              if (usedCodeStr) {
                 const matchedCoupon = coupons.find(coup => coup.code === usedCodeStr || coup.id === usedCodeStr);
                 if (matchedCoupon && matchedCoupon.price !== undefined) price = matchedCoupon.price;
              }
              if (price === undefined || price === null) {
           if (c.subscription.type === 'starter_monthly') price = 4.99;
           else if (c.subscription.type === 'starter_yearly') price = 47.99;
           else if (c.subscription.type === 'professional_monthly') price = 9.99;
           else if (c.subscription.type === 'professional_yearly') price = 95.99;
           else price = c.subscription.type === 'yearly' ? 0.2 : (c.subscription.type === 'monthly' ? 0.1 : 0);
        }

              if (pDate.getFullYear() === d.getFullYear() && pDate.getMonth() === d.getMonth()) {
                monthSubRev += price;
              }
            }
          }
        });

        result.push({
          name: monthLabel,
          label: monthLabel,
          revenue: Number(monthSubRev.toFixed(2)),
          value: Number(monthSubRev.toFixed(2)),
          active: monthActiveCount
        });
      }
      return result;
    }
  };


  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Full-Width Header Bar (No Margins) */}
      <header className="w-full shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shadow-xs select-none z-40 flex flex-col">
        <div className="h-16 px-3 sm:px-6 flex items-center justify-between w-full min-w-0 relative">
          {/* Left: Branding & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/30 shrink-0">
                <ShieldAlert className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-300" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                    Kiri HR Super Admin
                  </h1>
                  <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider shrink-0">
                    Master
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">System Control Center</span>
                </p>
              </div>
            </div>
          </div>

          {/* Center Platform Metrics (Tablet & Desktop) */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-4 px-4 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 mx-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Today's Income:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">${revenueStats.daily.toFixed(2)}</span>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Total Cash:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">${revenueStats.total.toFixed(2)}</span>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Workspaces:</span>
              <span className="font-bold text-slate-900 dark:text-white">{companies.length}</span>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Total Users:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{allUsers.filter(u => u.role !== 'super_admin').length}</span>
            </div>
          </div>

          {/* Right Tools & User Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Control Pills Container */}
            <div className="flex items-center gap-0.5 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              {/* Refresh Data */}
              <button
                onClick={fetchData}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                title="Refresh Dashboard Data"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                title="Toggle Light / Dark Mode"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />}
              </button>
            </div>

            {/* Quick Reset Website Button in Header */}
            <button
              onClick={() => setActiveTab('system_reset')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === 'system_reset'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-400'
                  : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-800/80'
              }`}
              title="Factory Reset Entire Website & Database"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Website</span>
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* User Profile Button */}
            <div
              onClick={handleOpenProfileModal}
              className="flex items-center gap-2 p-1 sm:pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer group border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60"
              title="Click to Edit Super Admin Profile"
            >
              <div className="relative flex-shrink-0">
                {user?.profilePictureUrl || user?.avatar ? (
                  <img
                    src={user.profilePictureUrl || user.avatar}
                    alt="Profile"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-amber-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {(user?.name?.[0] || 'S').toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate max-w-[120px]">
                  {user?.name || 'Super Admin'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none truncate">
                  System Master
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Metrics Horizontal Scroller Bar (Professional, Sleek, Single-Line, Scrollable) */}
        <div className="lg:hidden w-full border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-50/90 dark:bg-slate-950/70 backdrop-blur-md px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
          {/* Daily Income Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Income</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">${revenueStats.daily.toFixed(2)}</span>
          </div>

          {/* Total Cash Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cash</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">${revenueStats.total.toFixed(2)}</span>
          </div>

          {/* Workspaces Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workspaces</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{companies.length}</span>
          </div>

          {/* Total Users Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Users</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{allUsers.filter(u => u.role !== 'super_admin').length}</span>
          </div>
        </div>
      </header>

      {/* Main Body Section (Edge to Edge with Sidebar and Content) */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        {/* Left Desktop Sidebar Navigation (Flush Left) */}
        <motion.aside
          initial={false}
          animate={{ 
            width: isSidebarCollapsed ? 72 : 260,
            transition: { duration: 0.25, ease: 'easeInOut' }
          }}
          className="hidden md:flex flex-col flex-shrink-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 justify-between z-30 select-none overflow-y-auto hide-scrollbar"
        >
          {/* Navigation Links */}
          <div className="p-3 space-y-6">
            {/* Analytics Section */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Main Analytics
                </div>
              )}
              
              {/* Overview Tab */}
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'overview' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                title="Overview Dashboard"
              >
                <div className="flex items-center gap-3">
                  <Activity className={`w-4 h-4 flex-shrink-0 ${activeTab === 'overview' ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isSidebarCollapsed && <span className="truncate">Overview</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'overview' ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Live
                  </span>
                )}
              </button>

              {/* Subscribers Tab */}
              <button
                onClick={() => setActiveTab('companies')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'companies' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                title="Subscribers / Workspaces"
              >
                <div className="flex items-center gap-3">
                  <Building2 className={`w-4 h-4 flex-shrink-0 ${activeTab === 'companies' ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isSidebarCollapsed && <span className="truncate">Subscribers</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'companies' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {companies.length}
                  </span>
                )}
              </button>

              {/* Users Tab */}
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'users' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                title="All System Users"
              >
                <div className="flex items-center gap-3">
                  <Users className={`w-4 h-4 flex-shrink-0 ${activeTab === 'users' ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isSidebarCollapsed && <span className="truncate">All Users</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {allUsers.filter(u => u.role !== 'super_admin').length}
                  </span>
                )}
              </button>

              {/* Direct Messages Tab */}
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'messages' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                title="Landing Page Direct Messages"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeTab === 'messages' ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isSidebarCollapsed && <span className="truncate">Direct Messages</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'messages' ? 'bg-white/20 text-white' : directMessages.filter(m => m.status === 'unread').length > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {directMessages.filter(m => m.status === 'unread').length > 0 ? `${directMessages.filter(m => m.status === 'unread').length} New` : directMessages.length}
                  </span>
                )}
              </button>

              {/* Testimonials Tab */}
              <button
                onClick={() => setActiveTab('testimonials')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'testimonials' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                title="Manage Testimonials"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className={`w-4 h-4 flex-shrink-0 ${activeTab === 'testimonials' ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isSidebarCollapsed && <span className="truncate">Testimonials</span>}
                </div>
              </button>

              {/* Telegram Bot Training Tab */}
              <button
                onClick={() => setActiveTab('telegram_bot')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'telegram_bot' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                title="Telegram Bot AI Trainer"
              >
                <div className="flex items-center gap-3">
                  <Bot className={`w-4 h-4 flex-shrink-0 ${activeTab === 'telegram_bot' ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isSidebarCollapsed && <span className="truncate">Telegram Bot AI</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'telegram_bot' ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    AI Trainer
                  </span>
                )}
              </button>
            </div>

            {/* Billing & Monetization Section */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Billing & Monetization
                </div>
              )}

              {/* Coupons Tab */}
              <button
                onClick={() => setActiveTab('coupons')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'coupons' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                title="Coupons & Invites"
              >
                <div className="flex items-center gap-3">
                  <Ticket className={`w-4 h-4 flex-shrink-0 ${activeTab === 'coupons' ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isSidebarCollapsed && <span className="truncate">Coupons</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'coupons' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                  }`}>
                    {coupons.length}
                  </span>
                )}
              </button>

              {/* Transactions Tab */}
              <button
                onClick={() => setActiveTab('transactions')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'transactions' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                title="Transactions History"
              >
                <CreditCard className={`w-4 h-4 flex-shrink-0 ${activeTab === 'transactions' ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                {!isSidebarCollapsed && <span className="truncate">Transactions</span>}
              </button>

              {/* Automated Revenue Reports Tab */}
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'reports' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                title="Automated Revenue Reports"
              >
                <Mail className={`w-4 h-4 flex-shrink-0 ${activeTab === 'reports' ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                {!isSidebarCollapsed && <span className="truncate">Automated Reports</span>}
              </button>

              {/* Bakong KHQR API Quota Tab */}
              <button
                onClick={() => setActiveTab('bakong_quota')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  activeTab === 'bakong_quota' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                title="Bakong KHQR API Quota & Usage"
              >
                <div className="flex items-center gap-3">
                  <Gauge className={`w-4 h-4 flex-shrink-0 ${activeTab === 'bakong_quota' ? 'text-amber-300' : 'text-red-500 dark:text-red-400'}`} />
                  {!isSidebarCollapsed && <span className="truncate font-medium">Bakong KHQR API</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'bakong_quota'
                      ? 'bg-white/20 text-white'
                      : (bakongUsage?.remainingToday ?? 100) <= 0 
                        ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400' 
                        : (bakongUsage?.remainingToday ?? 100) < 30
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {bakongUsage ? `${bakongUsage.remainingToday} left` : '100 left'}
                  </span>
                )}
              </button>

              {/* System Maintenance & Factory Reset Tab */}
              <div className="pt-2">
                {!isSidebarCollapsed && (
                  <div className="px-3 mb-1 text-[10px] font-bold tracking-wider text-red-500/80 uppercase">
                    System Maintenance
                  </div>
                )}
                <button
                  onClick={() => setActiveTab('system_reset')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                    activeTab === 'system_reset' 
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-semibold' 
                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 border border-red-200/60 dark:border-red-900/40'
                  } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                  title="Factory Reset Entire Website"
                >
                  <div className="flex items-center gap-3">
                    <RotateCcw className={`w-4 h-4 flex-shrink-0 ${activeTab === 'system_reset' ? 'text-white animate-spin-reverse' : 'text-red-500'}`} />
                    {!isSidebarCollapsed && <span className="truncate font-bold">Reset Website</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      activeTab === 'system_reset' ? 'bg-white/20 text-white' : 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300'
                    }`}>
                      Danger
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Metric & Collapse Button */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
            {!isSidebarCollapsed && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span>System Health</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Revenue</span>
                  <span className="font-bold text-slate-900 dark:text-white">${revenueStats.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </motion.aside>

        {/* Mobile Drawer Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div key="mobile-admin-drawer" className="fixed inset-0 z-[999] md:hidden">
              <ScrollLock />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 left-0 bottom-0 w-full sm:w-[280px] bg-white dark:bg-slate-900 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
                        <ShieldAlert className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Super Admin</h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">System Controller</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="flex flex-col gap-1">
                    <div className="px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                      Navigation
                    </div>

                    <button
                      onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'overview' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4" />
                        <span>Overview</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">Live</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('companies'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'companies' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4" />
                        <span>Subscribers</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{companies.length}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'users' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4" />
                        <span>All Users</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{allUsers.filter(u => u.role !== 'super_admin').length}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'messages' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4" />
                        <span>Direct Messages</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {directMessages.filter(m => m.status === 'unread').length > 0 ? `${directMessages.filter(m => m.status === 'unread').length} New` : directMessages.length}
                      </span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('testimonials'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'testimonials' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-4 h-4" />
                        <span>Testimonials</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('telegram_bot'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'telegram_bot' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bot className="w-4 h-4" />
                        <span>Telegram Bot AI</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">Trainer</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('coupons'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'coupons' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Ticket className="w-4 h-4" />
                        <span>Coupons</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">{coupons.length}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'transactions' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4" />
                        <span>Transactions</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'reports' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4" />
                        <span>Automated Reports</span>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('bakong_quota'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-medium text-xs cursor-pointer ${
                        activeTab === 'bakong_quota' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Gauge className="w-4 h-4 text-red-500" />
                        <span>Bakong KHQR API</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (bakongUsage?.remainingToday ?? 100) <= 0
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {bakongUsage ? `${bakongUsage.remainingToday} left` : '100 left'}
                      </span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('system_reset'); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-between p-2.5 rounded-xl font-bold text-xs cursor-pointer ${
                        activeTab === 'system_reset' 
                          ? 'bg-red-600 text-white' 
                          : 'text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 border border-red-200/60 dark:border-red-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RotateCcw className="w-4 h-4 text-red-500" />
                        <span>Reset Whole Website</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600 text-white font-black uppercase">
                        Danger
                      </span>
                    </button>
                  </nav>
                </div>

                {/* Mobile Profile Card */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div 
                      onClick={() => { setIsMobileMenuOpen(false); handleOpenProfileModal(); }}
                      className="flex items-center gap-3 min-w-0 cursor-pointer group"
                      title="Click to Edit Profile & Photo"
                    >
                      <div className="relative shrink-0">
                        {user?.profilePictureUrl || user?.avatar ? (
                          <img src={user.profilePictureUrl || user.avatar} alt="Profile" className="w-9 h-9 rounded-lg object-cover ring-2 ring-indigo-500/40" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
                            {(user?.name?.[0] || 'S').toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-full shadow-xs">
                          <Camera className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <span>{user?.name || 'Super Admin'}</span>
                          <Edit className="w-3 h-3 text-slate-400 shrink-0" />
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'kirihrsystem@gmail.com'}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex-shrink-0 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab !== 'coupons' && (
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Top Quick KPI Row - Bank Card Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {[
                    { 
                      label: "Today's Income", 
                      value: `$${revenueStats.daily.toFixed(2)}`, 
                      desc: "vs yesterday", 
                      trend: revenueStats.yesterday > 0 ? ((revenueStats.daily - revenueStats.yesterday)/revenueStats.yesterday)*100 : 0, 
                      icon: <DollarSign className="w-5 h-5 text-white/80" />,
                      bg: "bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900",
                      chip: "bg-indigo-400/30",
                      glass: "from-indigo-500/20 to-transparent"
                    },
                    { 
                      label: "Monthly Income", 
                      value: `$${revenueStats.monthly.toFixed(2)}`, 
                      desc: "vs last month", 
                      trend: revenueStats.momGrowth, 
                      icon: <TrendingUp className="w-5 h-5 text-white/80" />,
                      bg: "bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950",
                      chip: "bg-emerald-400/30",
                      glass: "from-emerald-500/20 to-transparent"
                    },
                    { 
                      label: "Total Lifetime", 
                      value: `$${revenueStats.total.toFixed(2)}`, 
                      desc: "Cumulative", 
                      trend: null, 
                      icon: <Wallet className="w-5 h-5 text-white/80" />,
                      bg: "bg-gradient-to-br from-gray-900 via-zinc-900 to-black",
                      chip: "bg-gray-500/30",
                      glass: "from-gray-500/20 to-transparent"
                    },
                    { 
                      label: "Total Workspaces", 
                      value: companies.length, 
                      desc: "Active & Inactive", 
                      trend: null, 
                      icon: <Building2 className="w-5 h-5 text-white/80" />,
                      bg: "bg-gradient-to-br from-violet-900 via-fuchsia-900 to-purple-950",
                      chip: "bg-violet-400/30",
                      glass: "from-violet-500/20 to-transparent"
                    }
                  ].map((kpi, i) => (
                    <div key={i} className={`relative p-5 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden text-white min-h-[170px] ${kpi.bg} border border-white/10 group hover:-translate-y-1 transition-all duration-300 ring-1 ring-white/5`}>
                      {/* Abstract Background Patterns */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${kpi.glass} opacity-50`} />
                      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-700 ease-out" />
                      <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-20 h-20 rounded-full bg-black/20 blur-lg pointer-events-none" />
                      
                      {/* Top Row: Chip & Contactless */}
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        {/* EMV Chip approximation */}
                        <div className={`w-9 h-7 rounded-md border border-white/20 flex flex-col items-center justify-center overflow-hidden relative ${kpi.chip} shadow-inner`}>
                          <div className="w-full h-[1px] bg-white/20 absolute top-1/2 -translate-y-1/2" />
                          <div className="w-[1px] h-full bg-white/20 absolute left-1/2 -translate-x-1/2" />
                          <div className="w-4 h-3 rounded-sm border border-white/20 z-10 bg-white/5" />
                        </div>
                        {/* Custom Contactless / NFC style icon */}
                        <div className="flex gap-1 opacity-60">
                          <div className="w-1 h-1 rounded-full bg-white" />
                          <div className="w-1 h-2 rounded-full bg-white" />
                          <div className="w-1 h-3 rounded-full bg-white" />
                          <div className="w-1 h-4 rounded-full bg-white" />
                        </div>
                      </div>

                      {/* Middle Row: Value (like Card Number) */}
                      <div className="relative z-10 mb-4">
                        <div className="text-[10px] font-medium text-white/50 uppercase tracking-[0.2em] mb-1">{kpi.label}</div>
                        <h3 className="text-2xl font-bold tracking-tight drop-shadow-sm font-mono">{kpi.value}</h3>
                      </div>

                      {/* Bottom Row: Label & Trend */}
                      <div className="flex items-end justify-between relative z-10">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">Valid Thru</span>
                          <span className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono opacity-90">{kpi.desc}</span>
                        </div>
                        <div className="flex items-center">
                          {kpi.trend !== null ? (
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md border ${kpi.trend >= 0 ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-red-500/20 text-red-100 border-red-500/30'}`}>
                              {kpi.trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                              {Math.abs(kpi.trend).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md bg-white/10 text-white/70 backdrop-blur-md border border-white/10">
                              --
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions (Banking Style) */}
                <div className="flex flex-wrap gap-4 items-center mb-4">
                  <button onClick={() => setActiveTab('coupons')} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-500/50 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Create Coupon</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Add new promo</span>
                    </div>
                  </button>
                  
                  <button onClick={() => setActiveTab('transactions')} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <List className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">View History</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Income statements</span>
                    </div>
                  </button>

                  <button onClick={() => setActiveTab('companies')} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-cyan-500/50 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Workspaces</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Manage clients</span>
                    </div>
                  </button>
                  
                  <button onClick={() => setActiveTab('reports')} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-slate-500/50 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                      <SettingsIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Reports</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">System config</span>
                    </div>
                  </button>

                  <button onClick={() => setActiveTab('messages')} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform relative">
                      <MessageSquare className="w-5 h-5" />
                      {directMessages.filter(m => m.status === 'unread').length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Messages
                        {directMessages.filter(m => m.status === 'unread').length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold">
                            {directMessages.filter(m => m.status === 'unread').length}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Landing inquiries</span>
                    </div>
                  </button>

                  <button onClick={() => setActiveTab('bakong_quota')} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-red-500/50 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform relative">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Bakong KHQR
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                          (bakongUsage?.remainingToday ?? 100) <= 0 
                            ? 'bg-red-500 text-white' 
                            : (bakongUsage?.remainingToday ?? 100) < 30
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-500 text-white'
                        }`}>
                          {bakongUsage?.remainingToday ?? 100} Left
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">NBC API quota</span>
                    </div>
                  </button>

                  <button onClick={() => setActiveTab('system_reset')} className="flex items-center gap-2 px-5 py-3 bg-red-50/50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900/60 rounded-2xl shadow-sm hover:border-red-500 hover:shadow-md transition-all group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:rotate-180 transition-transform duration-500">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        Reset Website
                        <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-black uppercase">
                          Danger
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Factory data wipe</span>
                    </div>
                  </button>
                </div>

                {/* Bakong KHQR API Quota & Remaining Requests Live Monitor */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  {/* Top Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">Bakong KHQR API Network & Quota</h3>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            (bakongUsage?.remainingToday ?? 100) <= 0 
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                              : (bakongUsage?.remainingToday ?? 100) < 30
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              (bakongUsage?.remainingToday ?? 100) <= 0 ? 'bg-red-500' : (bakongUsage?.remainingToday ?? 100) < 30 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                            }`} />
                            {(bakongUsage?.remainingToday ?? 100) <= 0 ? 'Daily Limit Reached (0 Left)' : `${bakongUsage?.remainingToday ?? 100} Requests Left`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          National Bank of Cambodia (NBC) Bakong API developer quota usage & remaining checks today
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={fetchBakongUsage}
                        disabled={isLoadingBakongUsage}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Refresh Bakong Quota"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBakongUsage ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>

                      <button 
                        onClick={() => setShowQuotaConfigModal(true)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Configure Quota Limit"
                      >
                        <SettingsIcon className="w-3.5 h-3.5" />
                        Set Limit ({bakongUsage?.dailyLimit ?? 100})
                      </button>

                      <button 
                        onClick={() => setActiveTab('bakong_quota')}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all cursor-pointer"
                      >
                        <Gauge className="w-3.5 h-3.5" />
                        Full Quota Center
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Rate Limit Notice */}
                  <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">Daily Quota Consumed</span>
                        <span className="text-slate-400 font-medium">({bakongUsage?.date || new Date().toISOString().split('T')[0]})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {bakongUsage?.requestsUsedToday ?? 0} / {bakongUsage?.dailyLimit ?? 100} requests
                        </span>
                        <span className="font-black text-indigo-600 dark:text-indigo-400">
                          {((((bakongUsage?.requestsUsedToday ?? 0) / (bakongUsage?.dailyLimit ?? 100))) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          (bakongUsage?.remainingToday ?? 100) <= 0 
                            ? 'bg-red-500' 
                            : (bakongUsage?.remainingToday ?? 100) < 30 
                              ? 'bg-amber-500' 
                              : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, (((bakongUsage?.requestsUsedToday ?? 0) / (bakongUsage?.dailyLimit ?? 100))) * 100))}%` }}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Quota auto-resets: <strong className="text-slate-700 dark:text-slate-300">Daily at Midnight 00:00 (Cambodia Time / UTC+7)</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Last API call: <strong className="text-slate-700 dark:text-slate-300">{bakongUsage?.lastCheckedAt ? new Date(bakongUsage.lastCheckedAt).toLocaleTimeString() : 'Ready'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Remaining Requests */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/30 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200/70 dark:border-emerald-900/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Remaining Left</span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Zap className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {bakongUsage?.remainingToday ?? 100}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Available today before limit
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Used Today */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50/30 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200/70 dark:border-indigo-900/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Requests Used</span>
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                          {bakongUsage?.requestsUsedToday ?? 0}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Out of {bakongUsage?.dailyLimit ?? 100} daily quota
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Checks & Tokens */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Checks & Renewals</span>
                        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">
                          {bakongUsage?.checksToday ?? 0} <span className="text-xs text-slate-400 font-normal">checks</span> / {bakongUsage?.tokenRenewalsToday ?? 0} <span className="text-xs text-slate-400 font-normal">auth</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          NBC Network MD5 checks & token logins
                        </div>
                      </div>
                    </div>

                    {/* Card 4: QR Generated & Lifetime */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">QR & Lifetime</span>
                        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                          <QrCode className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">
                          {bakongUsage?.qrGenerationsToday ?? 0} <span className="text-xs text-slate-400 font-normal">QRs</span> / {bakongUsage?.totalLifetimeRequests ?? 0} <span className="text-xs text-slate-400 font-normal">total</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          KHQR billings generated by subscribers
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Panel */}
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 flex-shrink-0 backdrop-blur-md">
                      <Sparkles className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1.5">
                        Performance Analysis
                      </h3>
                      <p className="text-indigo-200/80 text-sm leading-relaxed max-w-4xl">
                        Based on the current trajectory, revenue is {revenueStats.momGrowth >= 0 ? 'up' : 'down'} <strong className="text-white">{Math.abs(revenueStats.momGrowth).toFixed(1)}%</strong> this month. 
                        The primary growth driver is <strong>{
                          revenueStats.categories.yearlySub.revenue > revenueStats.categories.monthlySub.revenue 
                          ? 'Yearly Subscriptions' 
                          : 'Monthly Subscriptions'
                        }</strong>, which constitutes the majority of your cash income.
                        Consider running a promotional campaign to boost {revenueStats.categories.yearlySub.revenue > revenueStats.categories.monthlySub.revenue ? 'monthly' : 'yearly'} plans to balance the distribution.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Charts Grid - 4 Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* 1. Revenue Growth (Area Chart) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Growth</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cash income trajectory</p>
                      </div>
                      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        {(['daily', 'monthly', 'yearly'] as const).map(tr => (
                          <button
                            key={tr}
                            onClick={() => setTimeRange(tr)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                              timeRange === tr 
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            {tr}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} dy={10} />
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-border)', color: 'var(--chart-tooltip-text)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                          />
                          <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevArea)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 2. Adoption Metrics (Line Chart) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Workspaces</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Growth of active subscriptions</p>
                      </div>
                    </div>
                    
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-border)', color: 'var(--chart-tooltip-text)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [value, 'Active']}
                          />
                          <Line type="monotone" dataKey="active" name="Workspaces" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 3. Revenue vs Active (Combo Chart) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue vs Adoption</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Correlating income with active users</p>
                      </div>
                    </div>
                    
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} dy={10} />
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} />
                          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-border)', color: 'var(--chart-tooltip-text)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any, name: any) => [name === 'Revenue' ? `$${Number(value).toFixed(2)}` : value, name]}
                          />
                          <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Line yAxisId="right" type="monotone" dataKey="active" name="Workspaces" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 4. Income Distribution (Doughnut Chart) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Distribution</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Breakdown by cash income category</p>
                    </div>
                    
                    <div className="flex-1 min-h-[200px] flex items-center justify-center relative mt-4">
                      {revenueStats.total > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Monthly Plan', value: revenueStats.categories.monthlySub.revenue, color: '#6366f1' },
                                  { name: 'Yearly Plan', value: revenueStats.categories.yearlySub.revenue, color: '#06b6d4' },
                                  { name: 'Promocode Coupon', value: revenueStats.categories.promoCoupon.revenue, color: '#f59e0b' },
                                  { name: 'Free Coupon', value: revenueStats.categories.freeCoupon.revenue, color: '#10b981' },
                                  { name: 'Unlimited Coupon', value: revenueStats.categories.unlimitedCoupon.revenue, color: '#a855f7' },
                                ].filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                              >
                                {[
                                  { name: 'Monthly Plan', value: revenueStats.categories.monthlySub.revenue, color: '#6366f1' },
                                  { name: 'Yearly Plan', value: revenueStats.categories.yearlySub.revenue, color: '#06b6d4' },
                                  { name: 'Promocode Coupon', value: revenueStats.categories.promoCoupon.revenue, color: '#f59e0b' },
                                  { name: 'Free Coupon', value: revenueStats.categories.freeCoupon.revenue, color: '#10b981' },
                                  { name: 'Unlimited Coupon', value: revenueStats.categories.unlimitedCoupon.revenue, color: '#a855f7' },
                                ].filter(d => d.value > 0).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: any) => `$${Number(value).toFixed(2)} USD`}
                                contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-border)', color: 'var(--chart-tooltip-text)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
                            <span className="text-base font-black text-slate-900 dark:text-white">${revenueStats.total.toFixed(0)}</span>
                          </div>
                        </>
                      ) : (
                         <div className="flex flex-col items-center justify-center text-slate-400">
                           <LucidePieChart className="w-12 h-12 opacity-20 mb-2" />
                           <span className="text-xs">No Revenue Yet</span>
                         </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
                      {[
                        { label: 'Monthly Plan', rev: revenueStats.categories.monthlySub.revenue, count: revenueStats.categories.monthlySub.count, color: 'bg-indigo-500' },
                        { label: 'Yearly Plan', rev: revenueStats.categories.yearlySub.revenue, count: revenueStats.categories.yearlySub.count, color: 'bg-cyan-500' },
                        { label: 'Promocode Coupon', rev: revenueStats.categories.promoCoupon.revenue, count: revenueStats.categories.promoCoupon.count, color: 'bg-amber-500' },
                        { label: 'Free Coupon', rev: revenueStats.categories.freeCoupon.revenue, count: revenueStats.categories.freeCoupon.count, color: 'bg-emerald-500' },
                        { label: 'Unlimited Coupon', rev: revenueStats.categories.unlimitedCoupon.revenue, count: revenueStats.categories.unlimitedCoupon.count, color: 'bg-purple-500' }
                      ].map((cat, i) => (
                        <div key={i} className="flex flex-col text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-center gap-1 mb-0.5 text-[10px]">
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.color}`} />
                            <span className="text-slate-600 dark:text-slate-300 font-semibold truncate">{cat.label}</span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">${cat.rev.toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400">{cat.count} {cat.label.includes('Coupon') ? 'redeemed' : 'active'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Earnings Breakdown by Plan & Coupon Card Banner */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-indigo-500" />
                        Earnings Breakdown by Plan & Coupon
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Detailed breakdown of income generated across all subscription plans and promotional coupon codes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full">
                        Total Cash: ${revenueStats.total.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* 1. Monthly Plan */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-500/5 to-transparent border border-indigo-500/20 dark:border-indigo-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          {revenueStats.total > 0 ? ((revenueStats.categories.monthlySub.revenue / revenueStats.total) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Plan</div>
                        <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                          ${revenueStats.categories.monthlySub.revenue.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-medium">
                          {revenueStats.categories.monthlySub.count} Active Workspaces
                        </div>
                      </div>
                    </div>

                    {/* 2. Yearly Plan */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-500/5 to-transparent border border-cyan-500/20 dark:border-cyan-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">
                          {revenueStats.total > 0 ? ((revenueStats.categories.yearlySub.revenue / revenueStats.total) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Yearly Plan</div>
                        <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                          ${revenueStats.categories.yearlySub.revenue.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-medium">
                          {revenueStats.categories.yearlySub.count} Active Workspaces
                        </div>
                      </div>
                    </div>

                    {/* 3. Promocode Coupon */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                          <Tag className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                          {revenueStats.total > 0 ? ((revenueStats.categories.promoCoupon.revenue / revenueStats.total) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Promocode Coupon</div>
                        <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                          ${revenueStats.categories.promoCoupon.revenue.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-medium">
                          {revenueStats.categories.promoCoupon.count} Redemptions
                        </div>
                      </div>
                    </div>

                    {/* 4. Free Coupon */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                          Free
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Free Coupon</div>
                        <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                          $0.00
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-medium">
                          {revenueStats.categories.freeCoupon.count} Free Redemptions
                        </div>
                      </div>
                    </div>

                    {/* 5. Unlimited Coupon */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-500/5 to-transparent border border-purple-500/20 dark:border-purple-500/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                          {revenueStats.total > 0 ? ((revenueStats.categories.unlimitedCoupon.revenue / revenueStats.total) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unlimited Coupon</div>
                        <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                          ${revenueStats.categories.unlimitedCoupon.revenue.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-medium">
                          {revenueStats.categories.unlimitedCoupon.count} Lifetime Redemptions
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Third Row: Recent Transactions Mini Table & Usage Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Transactions */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest 5 payments processed</p>
                      </div>
                      <button onClick={() => setActiveTab('transactions')} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                        View All <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                            <th className="pb-3 font-medium">Workspace/User</th>
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Method</th>
                            <th className="pb-3 font-medium text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {realTransactions.slice(0, 5).map((t, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-3">
                                <div className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{t.userName}</div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{t.userEmail}</div>
                              </td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{t.date}</td>
                              <td className="py-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                  {t.method.includes('KHQR') ? <QrCode className="w-3 h-3 text-emerald-500" /> : <Tag className="w-3 h-3 text-amber-500" />}
                                  {t.method}
                                </span>
                              </td>
                              <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                ${t.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {realTransactions.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400">No transactions recorded yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Non-Revenue Platform Stats */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-5">Platform Analytics</h3>
                    
                    <div className="space-y-4">
                      {/* Active vs Inactive Workspaces */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Active Workspaces</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                              {companies.filter(c => c.subscription?.status === 'active').length}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Total Users */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total End Users</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                              {allUsers.filter(u => u.role !== 'super_admin').length}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Free Redeems */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Free Redemptions</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                              {revenueStats.categories.freeCoupon.count + revenueStats.categories.inviteCode.count}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'companies' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                    <th className="p-4 font-semibold">Workspace Name</th>
                    <th className="p-4 font-semibold">Code</th>
                    <th className="p-4 font-semibold">Users</th>
                    <th className="p-4 font-semibold">Subscription Plan</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((c, idx) => (
                    <tr key={`${c.id || c.companyId}-${idx}`} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div 
                          className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 cursor-pointer hover:underline"
                          onClick={() => handleLoginAsCompany(c.companyId, c.companyName)}
                        >
                          <img src={c.logoUrl || "/logo.png"} className="w-6 h-6 object-contain" />
                          {c.companyName || 'Unknown'}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-sm">{c.companyCode || '-'}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{getCompanyUsers(c.companyId).length}</td>
                      <td className="p-4">
                        <span className="capitalize px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {c.subscription?.type || 'free'}
                        </span>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const status = c.subscription?.status || 'active';
                          const isLocked = c.isLocked || status === 'locked' || status === 'suspended';
                          const isHeld = status === 'held';

                          if (isLocked) {
                            return (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                  <Lock className="w-3 h-3" /> Locked
                                </span>
                                {c.lockReason && (
                                  <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium max-w-[200px] truncate mt-1 flex items-center gap-1" title={c.lockReason}>
                                    <ShieldAlert className="w-3 h-3 shrink-0 text-rose-500" /> {c.lockReason}
                                  </div>
                                )}
                              </div>
                            );
                          } else if (isHeld) {
                            return (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                  <PauseCircle className="w-3 h-3" /> On Hold
                                </span>
                                {c.lockReason && (
                                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium max-w-[200px] truncate mt-1 flex items-center gap-1" title={c.lockReason}>
                                    <ShieldAlert className="w-3 h-3 shrink-0 text-amber-500" /> {c.lockReason}
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button
                          title="Send Automated Subscription Renewal Email Alert"
                          onClick={() => setActiveTab('reports')}
                          className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        >
                          <Mail className="w-4 h-4 text-amber-500" />
                          <span className="hidden sm:inline">Renewal Alert</span>
                        </button>
                        <button
                          title="Login as Workspace"
                          onClick={() => handleLoginAsCompany(c.companyId, c.companyName)}
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <LogIn className="w-4 h-4" />
                        </button>
                        <button
                          title="Lock / Hold Workspace Access & Reason"
                          onClick={() => openLockModal(c)}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                            c.isLocked || c.subscription?.status === 'locked' || c.subscription?.status === 'suspended'
                              ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400'
                              : c.subscription?.status === 'held'
                              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span className="hidden sm:inline">Hold / Lock</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No subscribers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'users' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Workspace</th>
                    <th className="p-4 font-semibold">Contact / Credentials</th>
                    <th className="p-4 font-semibold">Joined</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => {
                    const comp = companies.find(c => c.companyId === u.companyId);
                    return (
                      <tr key={`${u.id}-${idx}`} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4">
                          <div 
                            className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-3 cursor-pointer hover:underline"
                            onClick={() => handleLoginAsUser(u)}
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0">
                              {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name?.slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div>{u.name}</div>
                              {u.nameKh && <div className="text-xs font-normal text-slate-400">{u.nameKh}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.role === 'admin' || u.role === 'super_admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">{comp?.companyName || 'Unknown'}</td>
                        <td className="p-4 text-slate-500 text-sm">
                          {u.email && <div><span className="font-semibold">Email:</span> {u.email}</div>}
                          {u.phone && <div><span className="font-semibold">Phone:</span> {u.phone}</div>}
                          {u.password && <div><span className="font-semibold">Pwd:</span> {u.password}</div>}
                          <div><span className="font-semibold">PIN:</span> {u.passcode}</div>
                        </td>
                        <td className="p-4 text-slate-500 text-sm">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            title="Edit Password/PIN"
                            onClick={() => {
                              setEditingUser(u);
                              setNewPassword(u.password || '');
                              setNewPasscode(u.passcode || '');
                            }}
                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            title="Login as User"
                            onClick={() => handleLoginAsUser(u)}
                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg transition-colors"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          {u.role !== 'super_admin' && (
                            <button
                              title="Delete User"
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'coupons' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Ticket className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      Coupons & Workspace Invite Codes
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Create promo discount coupons or workspace invite codes with instant auto-generated QR Codes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowCouponForm(!showCouponForm)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Add Code / Coupon
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <button
                    onClick={() => setCouponFilter('all')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      couponFilter === 'all' 
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All Codes ({coupons.length})
                  </button>
                  <button
                    onClick={() => setCouponFilter('coupon')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      couponFilter === 'coupon' 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" /> Discount Coupons ({coupons.filter(c => c.category !== 'invite').length})
                  </button>
                  <button
                    onClick={() => setCouponFilter('invite')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      couponFilter === 'invite' 
                        ? 'bg-emerald-600 text-white' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" /> Invite Codes ({coupons.filter(c => c.category === 'invite').length})
                  </button>
                </div>

                {/* Create Coupon / Invite Code Form */}
                {showCouponForm && (
                  <motion.form 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleCreateCoupon}
                    className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        Create New Coupon or Invite Pass
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setShowCouponForm(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Step 1: Category Selection */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                        1. Select Code Purpose
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setNewCoupon(prev => ({ ...prev, category: 'coupon' }))}
                          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                            newCoupon.category !== 'invite'
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className={`p-2.5 rounded-lg ${newCoupon.category !== 'invite' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            <Ticket className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">Promo Discount Coupon</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Discount or free plan extension code for subscription pages.</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNewCoupon(prev => ({ ...prev, category: 'invite' }))}
                          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                            newCoupon.category === 'invite'
                              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className={`p-2.5 rounded-lg ${newCoupon.category === 'invite' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            <Key className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">Workspace Invite Pass Code</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Direct invite code given to clients to unlock workspace access.</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Code Input */}
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          {newCoupon.category === 'invite' ? 'Invite Code' : 'Coupon Code'}
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" required
                            value={newCoupon.code}
                            onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase().replace(/\s+/g, '')})}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase font-mono font-bold tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={newCoupon.category === 'invite' ? "e.g. INVITE-KIRI-2026" : "e.g. SUMMER2026"}
                          />
                          <button
                            type="button"
                            onClick={() => generateRandomCode(newCoupon.category || 'coupon')}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Auto Generate
                          </button>
                        </div>
                      </div>

                      {/* Price (Optional) */}
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Price (USD) - Optional</label>
                        <input 
                          type="number" min="0" step="0.01"
                          value={newCoupon.price}
                          onChange={e => setNewCoupon({...newCoupon, price: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>

                      {/* User Subscription Benefit */}
                      <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="font-bold text-sm text-slate-900 dark:text-white mb-0.5 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          User Subscription Access Granted (Benefit for User)
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                          When a user redeems this code, how much subscription access time will be added to their workspace, which plan they get, and employee limits.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Plan Type (Optional)</label>
                            <select 
                              value={newCoupon.planType || ""}
                              onChange={e => setNewCoupon({...newCoupon, planType: e.target.value})}
                              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-bold"
                            >
                              <option value="">Any Plan / Extend Current</option>
                              <option value="starter_monthly">Starter (Monthly)</option>
                              <option value="starter_yearly">Starter (Yearly)</option>
                              <option value="professional_monthly">Professional (Monthly)</option>
                              <option value="professional_yearly">Professional (Yearly)</option>
                              <option value="enterprise">Enterprise / Custom</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Employee Limit</label>
                            <input 
                              type="number" min="0" placeholder="0 = Unlimited"
                              value={newCoupon.employeeLimit || 0}
                              onChange={e => setNewCoupon({...newCoupon, employeeLimit: parseInt(e.target.value) || 0})}
                              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-bold"
                            />
                            <span className="text-[10px] text-slate-500">Leave as 0 for unlimited or use plan defaults.</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!newCoupon.isPublic}
                              onChange={e => setNewCoupon({...newCoupon, isPublic: e.target.checked})}
                              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Public Ad / Quick Promo</div>
                              <div className="text-xs text-slate-500">Display this code publicly on the Subscription page as an active promotion for users to click and apply instantly.</div>
                            </div>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Duration Amount</label>
                            <input 
                              type="number" required min="1"
                              value={newCoupon.duration}
                              onChange={e => setNewCoupon({...newCoupon, duration: parseInt(e.target.value) || 1})}
                              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Duration Unit</label>
                            <select 
                              value={newCoupon.type}
                              onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})}
                              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-bold"
                            >
                              <option value="days">Days (e.g. +30 Days)</option>
                              <option value="months">Months (e.g. +1 Month)</option>
                              <option value="years">Years (e.g. +1 Year)</option>
                              <option value="unlimited">Unlimited (Lifetime - Permanent Access)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Code Active Expiration Window */}
                      <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="font-bold text-sm text-slate-900 dark:text-white mb-0.5 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          Code Active Claiming Expiration (Lifetime Window)
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                          How long this coupon or invite code stays active for users to claim. Once this date passes, the code expires.
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Quick Active Presets:</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => applyExpiryPreset(0)}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                onClick={() => applyExpiryPreset(2)}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                              >
                                Active for 2 Days
                              </button>
                              <button
                                type="button"
                                onClick={() => applyExpiryPreset(7)}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                              >
                                Active for 7 Days
                              </button>
                              <button
                                type="button"
                                onClick={() => applyExpiryPreset(30)}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                              >
                                Active for 1 Month
                              </button>
                              <button
                                type="button"
                                onClick={() => applyExpiryPreset(90)}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                              >
                                Active for 3 Months
                              </button>
                              <button
                                type="button"
                                onClick={() => applyExpiryPreset(365)}
                                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                              >
                                Active for 1 Year
                              </button>
                              <button
                                type="button"
                                onClick={() => applyExpiryPreset(36500)}
                                className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500" /> Active Forever (2099)
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div>
                              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Code Expiry Date</label>
                              <input 
                                type="date" required
                                value={newCoupon.expiresAt as string}
                                onChange={e => setNewCoupon({...newCoupon, expiresAt: e.target.value})}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Max Redemption Uses</label>
                              <input 
                                type="number" required min="1"
                                value={newCoupon.maxUses}
                                onChange={e => setNewCoupon({...newCoupon, maxUses: parseInt(e.target.value) || 1})}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* QR Code Options */}
                      <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-indigo-500" />
                          QR Code Configuration
                        </label>

                        <div className="flex flex-wrap gap-3">
                          <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            newCoupon.qrType === 'auto' || !newCoupon.qrType
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' 
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            <input 
                              type="radio" 
                              name="qrType" 
                              checked={newCoupon.qrType === 'auto' || !newCoupon.qrType} 
                              onChange={() => setNewCoupon({ ...newCoupon, qrType: 'auto' })}
                              className="hidden"
                            />
                            <QrCode className="w-4 h-4" /> Auto-Generate Scannable QR
                          </label>

                          <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            newCoupon.qrType === 'custom'
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' 
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            <input 
                              type="radio" 
                              name="qrType" 
                              checked={newCoupon.qrType === 'custom'} 
                              onChange={() => setNewCoupon({ ...newCoupon, qrType: 'custom' })}
                              className="hidden"
                            />
                            <ImageIcon className="w-4 h-4" /> Upload Custom QR Image
                          </label>

                          <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            newCoupon.qrType === 'none'
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' 
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            <input 
                              type="radio" 
                              name="qrType" 
                              checked={newCoupon.qrType === 'none'} 
                              onChange={() => setNewCoupon({ ...newCoupon, qrType: 'none' })}
                              className="hidden"
                            />
                            No QR Code
                          </label>
                        </div>

                        {newCoupon.qrType === 'custom' && (
                          <div className="pt-2">
                            <input 
                              type="file" accept="image/*"
                              onChange={handleQrUpload}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                            />
                          </div>
                        )}
                      </div>

                      {/* Live QR Preview Box */}
                      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center min-h-[140px]">
                        <span className="text-xs font-semibold text-slate-400 mb-2">Live QR Code Preview</span>
                        {newCoupon.qrType === 'custom' && newCoupon.qrCodeUrl ? (
                          <img src={newCoupon.qrCodeUrl} alt="Custom QR" className="w-24 h-24 object-contain rounded-lg border" />
                        ) : newCoupon.qrType !== 'none' && newCoupon.code ? (
                          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                            <QRCode value={newCoupon.code} size={90} level="M" />
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic text-center p-4 border border-dashed rounded-lg w-full">
                            Type a code above to generate QR Code preview
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button 
                        type="button" 
                        onClick={() => setShowCouponForm(false)}
                        className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md text-sm flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Save {newCoupon.category === 'invite' ? 'Invite Code' : 'Coupon'}
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coupons
                    .filter(c => couponFilter === 'all' || (couponFilter === 'invite' ? c.category === 'invite' : c.category !== 'invite'))
                    .map((coupon, idx) => {
                      const isInvite = coupon.category === 'invite';
                      const isExpired = new Date(coupon.expiresAt) < new Date();
                      const isMaxedOut = coupon.usedCount >= coupon.maxUses;

                      return (
                        <div key={`${coupon.id}-${idx}`} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group flex flex-col justify-between transition-all hover:shadow-md">
                          <div>
                            {/* Card Header & Category Badge */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                isInvite 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                                  : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                              }`}>
                                {isInvite ? <Key className="w-3.5 h-3.5" /> : <Ticket className="w-3.5 h-3.5" />}
                                {isInvite ? 'Invite Code' : 'Discount Coupon'}
                              </span>

                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => setEditingCoupon({ 
                                    ...coupon, 
                                    expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '' 
                                  })}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Edit Code / Coupon"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleCopyCode(coupon.code)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Copy Code"
                                >
                                  {copiedCodeId === coupon.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button 
                                  onClick={() => setDeletingCoupon(coupon)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                  title="Delete Code"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Code Display & Badges */}
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-lg text-slate-900 dark:text-white tracking-wider uppercase">
                                  {coupon.code}
                                </span>
                                {isExpired ? (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200 dark:border-rose-800 uppercase">
                                    🔴 Expired
                                  </span>
                                ) : isMaxedOut ? (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200 dark:border-amber-800 uppercase">
                                    🟡 Used Up
                                  </span>
                                ) : (
                                  <div className="flex gap-1 items-center">
                                    {coupon.isPublic && (
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200 dark:border-blue-800 uppercase flex items-center gap-1">
                                        📢 Public Ad
                                      </span>
                                    )}
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase">
                                      🟢 Active
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                                <span className="font-semibold">Grants User:</span>
                                {coupon.type === 'unlimited' || coupon.type === 'lifetime' || coupon.duration >= 99 ? (
                                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Permanent Lifetime Access
                                  </span>
                                ) : (
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">+{coupon.duration} {coupon.type} Access</span>
                                )}
                              </div>
                            </div>

                            {/* QR Code Container */}
                            {coupon.qrType !== 'none' && (
                              <div 
                                onClick={() => setSelectedQrCoupon(coupon)}
                                className="mb-4 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center cursor-pointer group/qr relative hover:border-indigo-400 transition-colors"
                                id={`card-qr-${coupon.id}`}
                              >
                                {coupon.qrType === 'custom' && coupon.qrCodeUrl ? (
                                  <img src={coupon.qrCodeUrl} alt="Custom QR" className="w-28 h-28 object-contain" />
                                ) : (
                                  <QRCode value={coupon.code} size={110} level="M" fgColor="#0f172a" />
                                )}
                                <div className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover/qr:underline">
                                  <QrCode className="w-3 h-3" /> Click to View & Download QR
                                </div>
                              </div>
                            )}

                            {/* Details */}
                            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                              <div className="flex justify-between items-center font-medium">
                                <span>Price</span>
                                {coupon.price && coupon.price > 0 ? (
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                    ${coupon.price.toFixed(2)} USD
                                  </span>
                                ) : (
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    FREE
                                  </span>
                                )}
                              </div>
                              {coupon.planType && (
                                <div className="flex justify-between font-medium">
                                  <span>Target Plan</span>
                                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px] text-right" title={coupon.planType}>
                                    {coupon.planType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-medium">
                                <span>Employee Limit</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {coupon.employeeLimit ? coupon.employeeLimit : 'Default/Unlimited'}
                                </span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>Redemptions</span>
                                <span className="font-bold text-slate-900 dark:text-white">{coupon.usedCount} / {coupon.maxUses}</span>
                              </div>

                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2">
                                <div 
                                  className={`h-1.5 rounded-full ${isInvite ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                  style={{ width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Expiration</span>
                                <span className={isExpired ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-white font-medium'}>
                                  {new Date(coupon.expiresAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Bar */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedQrCoupon(coupon)}
                              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <QrCode className="w-3.5 h-3.5" /> View QR Modal
                            </button>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              {copiedCodeId === coupon.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedCodeId === coupon.code ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {coupons.length === 0 && !showCouponForm && (
                    <div className="col-span-full p-12 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                      <Ticket className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No coupons or invite codes created yet.</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Click "Add Code / Coupon" to generate your first promo code with QR scanner support.</p>
                      <button 
                        onClick={() => setShowCouponForm(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Create First Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <List className="w-5 h-5 text-indigo-500" />
                    Transaction History
                  </h2>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                          <th className="p-4 font-semibold">Date</th>
                          <th className="p-4 font-semibold">User</th>
                          <th className="p-4 font-semibold">Amount</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((tx, idx) => (
                          <tr key={`${tx.id}-${idx}`} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                              {tx.date}
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-slate-900 dark:text-white">{tx.userName}</div>
                              <div className="text-xs text-slate-500">{tx.userEmail}</div>
                            </td>
                            <td className="p-4 font-semibold text-slate-900 dark:text-white">
                              ${tx.amount.toFixed(2)} USD
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                tx.status === 'Completed' || tx.status === 'active' 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {tx.status === 'active' ? 'Completed' : tx.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-sm font-medium">
                                <CreditCard className="w-4 h-4 text-indigo-500" />
                                {tx.method}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">
                              No transactions match your search or filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <ScheduledRevenueReports
                companies={companies}
                allUsers={allUsers}
                coupons={coupons}
                totalRevenue={revenueStats.total}
                revenueStats={revenueStats}
                realTransactions={realTransactions}
              />
            )}

            {activeTab === 'testimonials' && (
              <TestimonialsManager testimonials={testimonials} onUpdate={fetchData} />
            )}

            {activeTab === 'telegram_bot' && (
              <TelegramBotManager />
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                {/* Header & Stats Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      Landing Direct Messages
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Inquiries and messages sent directly from potential clients on the landing page.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={fetchData}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </div>
                </div>

                {/* Filter Pills & Search */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { key: 'all', label: 'All Messages', count: directMessages.length },
                      { key: 'unread', label: 'Unread', count: directMessages.filter(m => m.status === 'unread').length, highlight: true },
                      { key: 'read', label: 'Read', count: directMessages.filter(m => m.status === 'read').length },
                      { key: 'replied', label: 'Replied', count: directMessages.filter(m => m.status === 'replied').length },
                      { key: 'archived', label: 'Archived', count: directMessages.filter(m => m.status === 'archived').length }
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setMessageFilter(f.key as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                          messageFilter === f.key
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          messageFilter === f.key
                            ? 'bg-white/20 text-white'
                            : f.highlight && f.count > 0
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages List */}
                {(() => {
                  const filtered = directMessages.filter(m => {
                    const matchesFilter = messageFilter === 'all' ? true : m.status === messageFilter;
                    const matchesSearch = !search ? true : (
                      m.name?.toLowerCase().includes(search.toLowerCase()) ||
                      m.email?.toLowerCase().includes(search.toLowerCase()) ||
                      m.message?.toLowerCase().includes(search.toLowerCase()) ||
                      m.notes?.toLowerCase().includes(search.toLowerCase())
                    );
                    return matchesFilter && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-4">
                          <Inbox className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">No direct messages found</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                          {search ? 'No inquiries match your current search terms.' : 'There are no messages in this status view currently.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 gap-4">
                      {filtered.map((msg) => (
                        <div
                          key={msg.id}
                          className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all p-5 md:p-6 shadow-sm hover:shadow-md relative overflow-hidden ${
                            msg.status === 'unread'
                              ? 'border-amber-400/80 dark:border-amber-500/50 ring-1 ring-amber-400/20'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {msg.status === 'unread' && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                          )}

                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                            {/* Sender Info */}
                            <div className="flex items-center gap-3.5">
                              <div className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-sm ${
                                msg.status === 'unread'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                              }`}>
                                {(msg.name?.[0] || 'U').toUpperCase()}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {msg.name}
                                  </h3>
                                  {/* Status Pill */}
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                                    msg.status === 'unread' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 animate-pulse' :
                                    msg.status === 'replied' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400' :
                                    msg.status === 'archived' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400'
                                  }`}>
                                    {msg.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  <a
                                    href={`mailto:${msg.email}?subject=Re:%20Kiri%20HR%20Inquiry`}
                                    className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors font-medium"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{msg.email}</span>
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* Timestamp & Quick Action */}
                            <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                              <span className="flex items-center gap-1 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(msg.createdAt).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Message Body */}
                          <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                            {msg.message}
                          </div>

                          {/* Notes if any */}
                          {msg.notes && (
                            <div className="mb-4 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Super Admin Note:</span> {msg.notes}
                              </div>
                            </div>
                          )}

                          {/* Action Toolbar */}
                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Direct Email Reply */}
                              <a
                                href={`mailto:${msg.email}?subject=Re:%20Kiri%20HR%20Inquiry%20-%20Message%20from%20${encodeURIComponent(msg.name)}`}
                                onClick={() => {
                                  if (msg.status === 'unread') {
                                    handleUpdateMessageStatus(msg.id, 'replied');
                                  }
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Reply className="w-3.5 h-3.5" /> Reply via Email
                              </a>

                              {/* Toggle Read / Unread */}
                              <button
                                onClick={() => handleUpdateMessageStatus(msg.id, msg.status === 'unread' ? 'read' : 'unread')}
                                disabled={isUpdatingMessage}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                {msg.status === 'unread' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Mail className="w-3.5 h-3.5 text-amber-500" />}
                                {msg.status === 'unread' ? 'Mark as Read' : 'Mark Unread'}
                              </button>

                              {/* Mark as Replied */}
                              {msg.status !== 'replied' && (
                                <button
                                  onClick={() => handleUpdateMessageStatus(msg.id, 'replied')}
                                  disabled={isUpdatingMessage}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" /> Mark Replied
                                </button>
                              )}

                              {/* Archive / Unarchive */}
                              <button
                                onClick={() => handleUpdateMessageStatus(msg.id, msg.status === 'archived' ? 'read' : 'archived')}
                                disabled={isUpdatingMessage}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                {msg.status === 'archived' ? 'Unarchive' : 'Archive'}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Open Detail & Note Modal */}
                              <button
                                onClick={() => {
                                  setSelectedMessage(msg);
                                  setReplyNote(msg.notes || '');
                                  if (msg.status === 'unread') {
                                    handleUpdateMessageStatus(msg.id, 'read');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" /> Add Note
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-all cursor-pointer"
                                title="Delete Message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Selected Message Detail & Notes Modal */}
                <AnimatePresence>
                  {selectedMessage && (
                    <div key="modal-direct-message" className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedMessage(null)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden z-10"
                      >
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Message Details
                              </h3>
                              <p className="text-xs text-slate-500">From {selectedMessage.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedMessage(null)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="mt-5 space-y-4">
                          {/* Sender Meta */}
                          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs">
                            <div>
                              <span className="text-slate-400 block font-medium">Sender Name</span>
                              <span className="font-bold text-slate-900 dark:text-white">{selectedMessage.name}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Email Address</span>
                              <a
                                href={`mailto:${selectedMessage.email}`}
                                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                {selectedMessage.email}
                              </a>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Sent On</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {new Date(selectedMessage.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Current Status</span>
                              <span className="font-bold uppercase text-amber-600 dark:text-amber-400">
                                {selectedMessage.status}
                              </span>
                            </div>
                          </div>

                          {/* Message Content */}
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                              Full Message Text
                            </label>
                            <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {selectedMessage.message}
                            </div>
                          </div>

                          {/* Internal Admin Note */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                              Internal Admin Notes / Action Log
                            </label>
                            <textarea
                              rows={3}
                              value={replyNote}
                              onChange={(e) => setReplyNote(e.target.value)}
                              placeholder="Record internal notes, phone call logs, or reply status..."
                              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <a
                              href={`mailto:${selectedMessage.email}?subject=Re:%20Kiri%20HR%20Inquiry`}
                              onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'replied', replyNote)}
                              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                            >
                              <Reply className="w-4 h-4" /> Email & Mark Replied
                            </a>

                            <button
                              onClick={() => {
                                handleUpdateMessageStatus(selectedMessage.id, selectedMessage.status, replyNote);
                                setSelectedMessage(null);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
                            >
                              Save Notes
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Bakong KHQR API Quota Management Tab */}
            {activeTab === 'bakong_quota' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden border border-red-500/20">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/4 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 shrink-0 border border-white/20">
                        <QrCode className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-2xl font-black text-white tracking-tight">Bakong KHQR API Quota & Usage</h2>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            (bakongUsage?.remainingToday ?? 100) <= 0 
                              ? 'bg-red-500/20 text-red-200 border border-red-500/40' 
                              : (bakongUsage?.remainingToday ?? 100) < 30
                                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              (bakongUsage?.remainingToday ?? 100) <= 0 ? 'bg-red-400' : (bakongUsage?.remainingToday ?? 100) < 30 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
                            }`} />
                            {(bakongUsage?.remainingToday ?? 100) <= 0 
                              ? 'Daily Limit Reached' 
                              : `${bakongUsage?.remainingToday ?? 100} of ${bakongUsage?.dailyLimit ?? 100} Remaining Today`}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                          Monitor live developer requests to the National Bank of Cambodia (NBC) Bakong Payment Gateway. Track KHQR bill generations, transaction verification checks, and safeguard your quota.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        onClick={fetchBakongUsage}
                        disabled={isLoadingBakongUsage}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingBakongUsage ? 'animate-spin' : ''}`} />
                        Refresh Live Status
                      </button>

                      <button 
                        onClick={() => setShowQuotaConfigModal(true)}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        Set Daily Limit
                      </button>

                      <button 
                        onClick={handleResetBakongUsage}
                        disabled={isLoadingBakongUsage}
                        className="px-4 py-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-red-500/40 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset Today's Counter
                      </button>
                    </div>
                  </div>

                  {quotaActionMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      {quotaActionMessage}
                    </motion.div>
                  )}
                </div>

                {/* Main Quota Gauge & Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Metric 1: Remaining Left */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Remaining Left Today</span>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        (bakongUsage?.remainingToday ?? 100) <= 0 
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-600' 
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                      }`}>
                        <Zap className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className={`text-4xl font-black font-mono ${
                        (bakongUsage?.remainingToday ?? 100) <= 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : (bakongUsage?.remainingToday ?? 100) < 30
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {bakongUsage?.remainingToday ?? 100}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Resets at 00:00 Phnom Penh (UTC+7)
                      </p>
                    </div>
                  </div>

                  {/* Metric 2: Used Today */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Used Today</span>
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                        {bakongUsage?.requestsUsedToday ?? 0}
                        <span className="text-base text-slate-400 font-semibold ml-1">/ {bakongUsage?.dailyLimit ?? 100}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {((((bakongUsage?.requestsUsedToday ?? 0) / (bakongUsage?.dailyLimit ?? 100))) * 100).toFixed(0)}% of daily allowance consumed
                      </p>
                    </div>
                  </div>

                  {/* Metric 3: Transaction Checks */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Checks Today</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                        {bakongUsage?.checksToday ?? 0}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Manual user payment verifications
                      </p>
                    </div>
                  </div>

                  {/* Metric 4: Lifetime API Requests */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lifetime API Calls</span>
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Gauge className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                        {bakongUsage?.totalLifetimeRequests ?? 0}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Total since server inception
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Details Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Quota Consumption & Rate Limit Status
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Daily Requests: {bakongUsage?.requestsUsedToday ?? 0} / {bakongUsage?.dailyLimit ?? 100}
                      </span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400">
                        {((((bakongUsage?.requestsUsedToday ?? 0) / (bakongUsage?.dailyLimit ?? 100))) * 100).toFixed(1)}% Used
                      </span>
                    </div>

                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          (bakongUsage?.remainingToday ?? 100) <= 0 
                            ? 'bg-red-500' 
                            : (bakongUsage?.remainingToday ?? 100) < 30 
                              ? 'bg-amber-500' 
                              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, (((bakongUsage?.requestsUsedToday ?? 0) / (bakongUsage?.dailyLimit ?? 100))) * 100))}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <strong className="block text-slate-800 dark:text-slate-200">On-Demand Verification</strong>
                          <span className="text-slate-500 dark:text-slate-400">Automatic background polling disabled to save 95% of quota.</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <strong className="block text-slate-800 dark:text-slate-200">Cambodia Timezone Sync</strong>
                          <span className="text-slate-500 dark:text-slate-400">Auto-resets at midnight in Asia/Phnom_Penh (UTC+7).</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <strong className="block text-slate-800 dark:text-slate-200">Rate Limit Protection</strong>
                          <span className="text-slate-500 dark:text-slate-400">Alerts administrators before quota depletion.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registered Service Emails (Quota Pooling) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-500" />
                        API Service Emails (Quota Pooling)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Add multiple NBC Bakong developer emails to increase your daily request limits dynamically.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAddBakongEmail} className="flex flex-col sm:flex-row gap-3 mb-5">
                    <input
                      type="email"
                      required
                      placeholder="Add Bakong developer email to pool..."
                      value={newBakongEmail}
                      onChange={(e) => setNewBakongEmail(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isAddingBakongEmail || !newBakongEmail.trim()}
                      className="whitespace-nowrap px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isAddingBakongEmail ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add Email
                    </button>
                  </form>

                  <div className="space-y-2">
                    {bakongUsage?.registeredEmails && bakongUsage.registeredEmails.length > 0 ? (
                      bakongUsage.registeredEmails.map((email, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">{email}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">+100 Daily Requests capacity</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveBakongEmail(email)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Remove from pool"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                        No service emails registered. The system is falling back to defaults.
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent API Activity Logs */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-red-500" />
                        Live Bakong API Activity Log
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Real-time audit log of NBC endpoint requests recorded today
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {bakongUsage?.recentLogs?.length || 0} Recent Operations
                    </span>
                  </div>

                  {(!bakongUsage?.recentLogs || bakongUsage.recentLogs.length === 0) ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <QrCode className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Bakong API calls recorded yet today</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Activity will appear here when users generate KHQR codes or check payment statuses.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                      {bakongUsage.recentLogs.map((log, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] ${
                              log.type === 'check_transaction_by_md5' 
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' 
                                : log.type === 'generate_khqr'
                                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                                  : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                            }`}>
                              {log.type === 'check_transaction_by_md5' ? 'CHK' : log.type === 'generate_khqr' ? 'GEN' : 'AUTH'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white capitalize">
                                {log.type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-slate-400 ml-2 font-mono text-[11px]">{log.endpoint}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              log.status === 200 || log.status === 0
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                            }`}>
                              HTTP {log.status}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'system_reset' && (
              <SystemResetManager 
                currentUser={user} 
                onResetComplete={fetchData} 
              />
            )}

          </div>
        )}
      </div>
      </div>

      {/* Quota Limit Configuration Modal */}
      <AnimatePresence>
        {showQuotaConfigModal && (
          <div key="modal-quota-config" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowQuotaConfigModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 text-left z-10"
            >
              <button 
                onClick={() => setShowQuotaConfigModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configure Daily Quota Limit</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Set maximum developer requests allowed per day</p>
                </div>
              </div>

              <form onSubmit={handleUpdateBakongLimit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Daily Limit (Requests / 24 Hours)
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="100000"
                    value={customQuotaInput}
                    onChange={(e) => setCustomQuotaInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-base font-bold font-mono outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Quick Presets</span>
                  <div className="flex flex-wrap gap-2">
                    {[100, 250, 500, 1000, 5000].map(limit => (
                      <button
                        key={limit}
                        type="button"
                        onClick={() => setCustomQuotaInput(String(limit))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          customQuotaInput === String(limit)
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {limit} reqs
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300">
                  <strong>NBC Developer Policy:</strong> Standard Bakong sandbox / production developer apps typically receive a 100 request/day soft limit. Upgraded tiers allow higher throughput.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowQuotaConfigModal(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingQuotaUpdate}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/30 transition-all flex items-center gap-2"
                  >
                    {isSubmittingQuotaUpdate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Limit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View & Download QR Code Modal */}
      <AnimatePresence>
        {selectedQrCoupon && (
          <div key="modal-qr" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setSelectedQrCoupon(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 text-center z-10"
            >
              <button 
                onClick={() => setSelectedQrCoupon(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                {selectedQrCoupon.category === 'invite' ? <Key className="w-3.5 h-3.5" /> : <Ticket className="w-3.5 h-3.5" />}
                {selectedQrCoupon.category === 'invite' ? 'Workspace Invite Pass' : 'Discount Promo Coupon'}
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                Scannable QR Code
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Scan this QR code from the Subscription tab camera or upload the saved image to instantly redeem access.
              </p>

              {/* QR Container */}
              <div 
                id="superadmin-modal-qr-box" 
                className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-inner flex flex-col items-center justify-center mx-auto mb-6 max-w-[260px]"
              >
                {selectedQrCoupon.qrType === 'custom' && selectedQrCoupon.qrCodeUrl ? (
                  <img src={selectedQrCoupon.qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain" />
                ) : (
                  <QRCode value={selectedQrCoupon.code} size={200} level="H" fgColor="#0f172a" />
                )}
                <div className="mt-3 font-mono font-bold text-slate-900 text-base tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                  {selectedQrCoupon.code}
                </div>
              </div>

              {/* Details summary */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1 mb-6 text-left">
                <div className="flex justify-between">
                  <span>Duration Bonus:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">+{selectedQrCoupon.duration} {selectedQrCoupon.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Redemptions Used:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedQrCoupon.usedCount} of {selectedQrCoupon.maxUses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires On:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{new Date(selectedQrCoupon.expiresAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadQrCode(selectedQrCoupon.code, 'superadmin-modal-qr-box')}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download QR (PNG)
                </button>
                <button
                  onClick={() => handleCopyCode(selectedQrCoupon.code)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
                >
                  {copiedCodeId === selectedQrCoupon.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedCodeId === selectedQrCoupon.code ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Edit Password Modal */}
      <AnimatePresence>
        {editingUser && (
          <div key="modal-edit-user" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800"
            >
              <button 
                onClick={() => setEditingUser(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Edit Credentials</h3>
              <div className="mb-4 text-sm text-slate-500">
                Editing for <span className="font-semibold text-slate-900 dark:text-white">{editingUser.name}</span>
              </div>
              
              <div className="space-y-4 mb-6">
                {editingUser.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Admin Password</label>
                    <input 
                      type="text" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Employee PIN (Passcode)</label>
                  <input 
                    type="text" 
                    value={newPasscode}
                    onChange={e => setNewPasscode(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePassword}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Coupon / Invite Code Modal */}
      <AnimatePresence>
        {editingCoupon && (
          <div key="modal-edit-coupon" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setEditingCoupon(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setEditingCoupon(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Code / Coupon</h3>
                  <p className="text-xs text-slate-500">Update code parameters, pricing, and QR code settings</p>
                </div>
              </div>

              <form onSubmit={handleUpdateCoupon} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Code Purpose / Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, category: 'coupon' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        editingCoupon.category === 'coupon'
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Ticket className="w-4 h-4" /> Discount Promo Coupon
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, category: 'invite' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        editingCoupon.category === 'invite'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Key className="w-4 h-4" /> Workspace Invite Pass
                    </button>
                  </div>
                </div>

                {/* Code String */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Code Text</label>
                  <input 
                    type="text" 
                    value={editingCoupon.code}
                    onChange={e => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                  />
                </div>

                {/* Price ($ USD) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Price ($ USD) <span className="text-slate-400 font-normal capitalize">(Leave 0 for Free)</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input 
                      type="number" step="0.01" min="0"
                      value={editingCoupon.price ?? 0}
                      onChange={e => setEditingCoupon({ ...editingCoupon, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                {/* User Subscription Benefit */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-xs text-slate-900 dark:text-white mb-0.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    User Subscription Access Granted
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                    Duration added to user's workspace upon redemption.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Duration Amount</label>
                      <input 
                        type="number" min="1"
                        value={editingCoupon.duration}
                        onChange={e => setEditingCoupon({ ...editingCoupon, duration: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Duration Unit</label>
                      <select
                        value={editingCoupon.type}
                        onChange={e => setEditingCoupon({ ...editingCoupon, type: e.target.value as any })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                        <option value="unlimited">Unlimited (Lifetime)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Code Active Claim Expiration */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-xs text-slate-900 dark:text-white mb-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    Code Active Expiration Date
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    When this coupon or invite code stops being claimable.
                  </p>

                  <div className="space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyExpiryPreset(0, true)}
                        className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-md text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => applyExpiryPreset(2, true)}
                        className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-md text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        +2 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => applyExpiryPreset(7, true)}
                        className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-md text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        +7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => applyExpiryPreset(30, true)}
                        className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-md text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        +1 Month
                      </button>
                      <button
                        type="button"
                        onClick={() => applyExpiryPreset(90, true)}
                        className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-md text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        +3 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => applyExpiryPreset(365, true)}
                        className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-md text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        +1 Year
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Expiration Date</label>
                        <input 
                          type="date"
                          value={editingCoupon.expiresAt}
                          onChange={e => setEditingCoupon({ ...editingCoupon, expiresAt: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Max Redemptions</label>
                        <input 
                          type="number" min="1"
                          value={editingCoupon.maxUses}
                          onChange={e => setEditingCoupon({ ...editingCoupon, maxUses: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Option */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">QR Code Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, qrType: 'auto' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${editingCoupon.qrType === 'auto' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                      Auto QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, qrType: 'custom' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${editingCoupon.qrType === 'custom' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                      Custom QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, qrType: 'none' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${editingCoupon.qrType === 'none' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                      No QR
                    </button>
                  </div>

                  {editingCoupon.qrType === 'custom' && (
                    <div className="mt-2">
                      <input 
                        type="file" accept="image/*"
                        onChange={handleEditQrUpload}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setEditingCoupon(null)}
                    className="px-5 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md text-sm flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Code Confirmation Modal */}
      <AnimatePresence>
        {deletingCoupon && (
          <div key="modal-delete-coupon" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setDeletingCoupon(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Delete Code / Coupon?</h3>
              <p className="text-xs text-slate-500 mb-6">
                Are you sure you want to permanently delete <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{deletingCoupon.code}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCoupon(null)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCoupon}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-md text-xs flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lock or Hold Workspace Modal */}
      <AnimatePresence>
        {lockingCompany && (
          <div key="modal-lock-workspace" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setLockingCompany(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    lockStatus === 'locked' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400' :
                    lockStatus === 'held' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400'
                  }`}>
                    {lockStatus === 'locked' ? <Lock className="w-5 h-5" /> : lockStatus === 'held' ? <PauseCircle className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Hold or Lock Workspace Access</h3>
                    <p className="text-xs text-slate-500 font-medium truncate max-w-[280px]">
                      Workspace: <span className="font-semibold text-slate-800 dark:text-slate-200">{lockingCompany.companyName || 'Workspace'}</span> (Code: {lockingCompany.companyCode || '-'})
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setLockingCompany(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveWorkspaceLockStatus} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Access Status Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setLockStatus('locked')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 ${
                        lockStatus === 'locked'
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm ring-2 ring-rose-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Lock className="w-5 h-5 text-rose-500" />
                      <span className="text-xs font-bold">Lock Access</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLockStatus('held')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 ${
                        lockStatus === 'held'
                          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm ring-2 ring-amber-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <PauseCircle className="w-5 h-5 text-amber-500" />
                      <span className="text-xs font-bold">Put On Hold</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLockStatus('active')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center gap-1.5 ${
                        lockStatus === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Unlock className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-bold">Active / Unlock</span>
                    </button>
                  </div>
                </div>

                {lockStatus !== 'active' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Lock / Hold Reason
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      State the official reason for locking or holding this workspace. This note is displayed to users when access is blocked.
                    </p>
                    <textarea
                      rows={3}
                      value={lockReasonInput}
                      onChange={(e) => setLockReasonInput(e.target.value)}
                      placeholder="Write reason (e.g. Subscription payment overdue, security inspection, account under review)..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                    />

                    {/* Presets */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-400 self-center mr-1">Quick Presets:</span>
                      {[
                        "Subscription payment overdue",
                        "Account under audit review",
                        "Workspace owner requested hold",
                        "Expired subscription pass",
                        "Terms of service violation"
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setLockReasonInput(preset)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setLockingCompany(null)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingLock}
                    className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md text-xs flex items-center gap-2 ${
                      lockStatus === 'locked' ? 'bg-rose-600 hover:bg-rose-700' :
                      lockStatus === 'held' ? 'bg-amber-600 hover:bg-amber-700' :
                      'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isSubmittingLock ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {lockStatus === 'locked' ? 'Apply Lock & Reason' : lockStatus === 'held' ? 'Apply Hold & Reason' : 'Unlock Workspace'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete User</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Are you sure you want to permanently delete this user? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div key="super-admin-profile-modal" className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Super Admin Profile</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage your profile photo & credentials</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
                {/* Photo Profile Section */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="relative group mb-3">
                    {profileAvatar ? (
                      <img 
                        src={profileAvatar} 
                        alt="Super Admin Avatar" 
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/30 shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white font-black flex items-center justify-center text-3xl shadow-lg ring-4 ring-amber-400/30">
                        {(profileName?.[0] || 'S').toUpperCase()}
                      </div>
                    )}
                    
                    <label 
                      htmlFor="super-admin-photo-input"
                      className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                      title="Upload New Photo"
                    >
                      <Camera className="w-4 h-4" />
                      <input 
                        id="super-admin-photo-input" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleProfilePhotoUpload} 
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <label 
                      htmlFor="super-admin-photo-input-btn"
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Photo
                      <input 
                        id="super-admin-photo-input-btn" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleProfilePhotoUpload} 
                        className="hidden"
                      />
                    </label>

                    {profileAvatar && (
                      <button
                        type="button"
                        onClick={() => setProfileAvatar('')}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Supports PNG, JPG, or WebP (Max 5MB)</p>
                </div>

                {/* Profile Details Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Super Admin"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. kirihrsystem@gmail.com"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="e.g. 093988991"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setShowProfileModal(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 text-xs flex items-center gap-2 active:scale-95"
                  >
                    {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
