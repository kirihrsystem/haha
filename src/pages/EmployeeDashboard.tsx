import { useAuthStore, useSettingsStore } from "../store";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Coffee, LogOut, LogIn, DollarSign, AlertTriangle, FileText, Home, Camera, Smartphone, Download, Share, PlusSquare, MapPin, User, Calendar, X, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ScrollLock from '../components/ScrollLock';
import EmployeeHistory from "../components/EmployeeHistory";
import EmployeeProfileSetupWizard from "../components/EmployeeProfileSetupWizard";
import EmployeeProfile from "../components/EmployeeProfile";
import MasterShiftPlanner from "../components/MasterShiftPlanner";
import CameraModal from "../components/CameraModal";
import ImagePreviewModal from "../components/ImagePreviewModal";
import InstallAppModal from "../components/InstallAppModal";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { sendPushNotification } from "../utils/push";
import { Log, Leave, Staff } from "../types";
import { AnimatePresence, motion } from "motion/react";
import { formatCurrency, cn } from "../lib/utils";
import { format, differenceInMinutes, differenceInSeconds, parseISO, parse, getDaysInMonth } from "date-fns";
import { km, enUS } from "date-fns/locale";
import { calculateShiftStatus, getExpectedShiftDuration, getConfiguredShiftTimes, calculateOvertimePay, getCalculatedHourlyRate } from "../utils/shiftUtils";
import { formatLiveClock, formatLiveFullDate, formatLiveHeaderDate, formatTimeWithLocale } from "../utils/khmerDateUtils";
import { sendTelegramNotification, sendDirectTelegramMessage } from "../utils/telegramUtils";
import { TelegramConnectWidget } from "../components/TelegramConnectWidget";

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

import { compressImage } from "../utils/imageUtils";

export default function EmployeeDashboard() {
  const { user, setUser } = useAuthStore();
  const { settings } = useSettingsStore();
  const outletContext = useOutletContext<{ isRefreshing?: boolean }>() || {};
  const isRefreshing = outletContext.isRefreshing || false;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Max size is 10MB.");
      return;
    }

    try {
      const base64String = await compressImage(file);
      if (user) {
        await updateDoc(doc(db, "staff", user.id), { avatar: base64String });
        setUser({ ...user, avatar: base64String });
      }
    } catch (error) {
      console.error("Error updating photo", error);
      alert("Failed to update profile photo.");
    }
  };

  const { t, i18n } = useTranslation();

  const [activeLog, setActiveLog] = useState<Log | null>(null);
  const [todayLog, setTodayLog] = useState<Log | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isKm = i18n.language?.startsWith("km") || localStorage.getItem("lang") === "km";
  const dateLocale = isKm ? km : enUS;
  const liveClock = formatLiveClock(currentTime, isKm);
  const liveHeaderDate = formatLiveHeaderDate(currentTime, isKm);
  const liveFullDate = formatLiveFullDate(currentTime, isKm);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveType, setLeaveType] = useState<"permission" | "day_off">("permission");
  const [cameraResolve, setCameraResolve] = useState<{ resolve: (url?: string) => void } | null>(null);

  const [activeTab, setActiveTab] = useState<"home" | "history" | "profile" | "planner">("home");

  useEffect(() => {
    // Scroll to top when tab changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const isExpired = Boolean(
    settings && settings.companyId && (
      !settings.subscription ||
      settings.subscription.status === 'pending' || 
      settings.subscription.status === 'expired' || 
      (settings.subscription.expiresAt && new Date(settings.subscription.expiresAt).getTime() < Date.now())
    )
  );

  useEffect(() => {
    if (isExpired && activeTab !== "home") {
      setActiveTab("home");
    }
  }, [isExpired, activeTab]);

  const [leaves, setLeaves] = useState<Leave[]>([]);

  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: "",
    email: "",
    startingDate: "",
    address: "",
    bankQrUrl: "",
    avatar: "",
    nationalIdCardUrl: ""
  });

  useEffect(() => {
    if (user && (!user.phone || !user.startingDate || !user.bankQrUrl || !user.nationalIdCardUrl)) {
      setShowProfileSetup(true);
      setProfileForm({
        phone: user.phone || "",
        email: user.email || "",
        startingDate: user.startingDate || "",
        address: user.address || "",
        bankQrUrl: user.bankQrUrl || "",
        avatar: user.avatar || "",
        nationalIdCardUrl: user.nationalIdCardUrl || ""
      });
    }
  }, [user]);

  

  const handleSetupTelegramDetected = async (chatId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "staff", user.id), { telegramChatId: chatId });
      setUser({ ...user, telegramChatId: chatId });
    } catch (err) {
      console.error("Error saving setup telegram chat id:", err);
    }
  };

  const handleProfileSubmit = async (profileData: any) => {
    if (!user) return;
    setIsSubmittingProfile(true);
    try {
      await updateDoc(doc(db, "staff", user.id), {
        name: profileData.name,
        phone: profileData.phone,
        email: profileData.email,
        startingDate: profileData.startingDate,
        address: profileData.address,
        bankQrUrl: profileData.bankQrUrl,
        avatar: profileData.avatar,
        nationalIdCardUrl: profileData.nationalIdCardUrl,
      });
      setUser({
        ...user,
        name: profileData.name,
        phone: profileData.phone,
        email: profileData.email,
        startingDate: profileData.startingDate,
        address: profileData.address,
        bankQrUrl: profileData.bankQrUrl,
        avatar: profileData.avatar,
        nationalIdCardUrl: profileData.nationalIdCardUrl,
      });
      setShowProfileSetup(false);
    } catch (error) {
      console.error("Error saving profile", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Max size is 10MB.");
      return;
    }
    try {
      const compressedUrl = await compressImage(file);
      setProfileForm({ ...profileForm, bankQrUrl: compressedUrl });
    } catch (error) {
      console.error("Error compressing QR code", error);
      alert("Failed to process QR code image.");
    }
  };

  const handleNationalIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Max size is 10MB.");
      return;
    }
    try {
      const compressedUrl = await compressImage(file);
      setProfileForm({ ...profileForm, nationalIdCardUrl: compressedUrl });
    } catch (error) {
      console.error("Error compressing national ID card", error);
      alert("Failed to process National ID card image.");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Max size is 10MB.");
      return;
    }
    try {
      const compressedUrl = await compressImage(file);
      setProfileForm({ ...profileForm, avatar: compressedUrl });
    } catch (error) {
      console.error("Error compressing avatar", error);
      alert("Failed to process profile image.");
    }
  };

  const [shiftNearing, setShiftNearing] = useState(false);
  const [shiftEndMinutesLeft, setShiftEndMinutesLeft] = useState<number | null>(null);
  const notifiedShiftEndRef = React.useRef(false);
  
  const [isStandalone, setIsStandalone] = useState(true);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // Check if app is already installed or running in standalone mode
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isPWA);
  }, []);


  useEffect(() => {
    if (!user || user.role === "admin") return;
    let expectedEnd: Date | null = null;
    let expectedEnd2: Date | null = null;

    if (user.shiftEnd) {
      expectedEnd = parse(user.shiftEnd, "HH:mm", new Date());
      if (user.shiftStart && user.shiftEnd && user.shiftEnd < user.shiftStart) {
        expectedEnd.setDate(expectedEnd.getDate() + 1);
      }
    }
    if (user.shift2End) {
       expectedEnd2 = parse(user.shift2End, "HH:mm", new Date());
       if (user.shift2Start && user.shift2End && user.shift2End < user.shift2Start) {
         expectedEnd2.setDate(expectedEnd2.getDate() + 1);
       }
    }

    let targetEnd = null;
    if (activeLog?.status === "active" && expectedEnd) targetEnd = expectedEnd;
    else if (activeLog?.status === "active2" && expectedEnd2) targetEnd = expectedEnd2;

    if (targetEnd && activeLog && !activeLog.timeOut && activeLog.status !== 'break') {
      const diff = differenceInMinutes(targetEnd, currentTime);
      setShiftEndMinutesLeft(diff);

      if (diff <= 15 && diff > 0) {
        setShiftNearing(true);
        if (!notifiedShiftEndRef.current && Notification.permission === "granted") {
          const title = i18n.t("shiftEndingSoon");
          const options = {
            body: `${i18n.t("shiftTerminatesIn")} ${diff} ${i18n.t("minutes")}. ${i18n.t("pleasePrepareToCheckout")}`,
            icon: "/logo.png"
          };
          if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, options);
            }).catch(() => {
              new Notification(title, options);
            });
          } else {
            new Notification(title, options);
          }
          notifiedShiftEndRef.current = true;
        }
      } else {
        setShiftNearing(false);
        setShiftEndMinutesLeft(null);
        if (diff > 30) {
          notifiedShiftEndRef.current = false;
        }
      }
    }
  }, [currentTime, activeLog, user, i18n]);

  useEffect(() => {
    const intervalMs = activeLog ? 1000 : 10000;
    const timer = setInterval(() => setCurrentTime(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [activeLog]);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    
    const today = format(new Date(), "yyyy-MM-dd");
    const logsQ = query(
      collection(db, "logs"), 
      where("staffId", "==", user.id), 
      where("date", "==", today)
    );
    
    const unsubLogs = onSnapshot(logsQ, (snap) => {
      const companyLogs = snap.docs.filter(d => d.data().companyId === user.companyId);
      const openLog = companyLogs.find(d => ["active", "break", "active2"].includes(d.data().status));
      const latestLog = companyLogs.sort((a, b) => new Date(b.data().timeIn).getTime() - new Date(a.data().timeIn).getTime())[0];
      
      if (openLog) setActiveLog({ id: openLog.id, ...openLog.data() } as Log);
      else setActiveLog(null);
      
      if (latestLog) setTodayLog({ id: latestLog.id, ...latestLog.data() } as Log);
      else setTodayLog(null);
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });

    const leavesQ = query(
      collection(db, "permissions"),
      where("staffId", "==", user.id)
    );
    
    const unsubLeaves = onSnapshot(leavesQ, (snap) => {
      setLeaves(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Leave));
    });

    return () => {
      unsubLogs();
      unsubLeaves();
    };
  }, [user]);


  const performCheckIn = async (data?: { lat?: number, lng?: number, photoUrl?: string }) => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const checkInDate = new Date();
    const nowISO = checkInDate.toISOString();
    
    const statuses = calculateShiftStatus(checkInDate, checkInDate, user.shiftStart, user.shiftEnd, (user as any).shiftOverrides, null, null, user.shift2Start, user.shift2End, settings?.gracePeriodMinutes || 0, user.breakHours);

    const hasApprovedLateCheckin = leaves.some(l => l.date === today && l.type === 'late_checkin' && l.status === 'approved');

    const logData: any = {
      companyId: user.companyId,
      staffId: user.id,
      date: today,
      timeIn: nowISO,
      status: "active",
      lateCheckIn: hasApprovedLateCheckin ? false : statuses.lateCheckIn,
      earlyCheckIn: statuses.earlyCheckIn,
      late: hasApprovedLateCheckin ? false : statuses.lateCheckIn,
      earlyLeave: false,
      regularHours: 0,
      overtimeHours: 0,
      dailySalary: 0,
      totalEarnings: 0,
      ...(data?.lat ? { checkInLat: data.lat, checkInLng: data.lng } : {}),
      ...(data?.photoUrl ? { checkInPhotoUrl: data.photoUrl } : {}),
    };

    const docRef = await addDoc(collection(db, "logs"), logData);
    setActiveLog({ id: docRef.id, ...logData });

    // Save notification for admins
    try {
      const isLateCheckin = hasApprovedLateCheckin ? false : statuses.lateCheckIn;
      const lateText = isLateCheckin ? " (Late)" : "";
      const title = "Employee Checked In";
      const message = `${user.nameKh || user.name} checked in at ${format(checkInDate, 'hh:mm a')}${lateText}`;
      
      await sendPushNotification(null, "admin", user.companyId, title, message);
      await addDoc(collection(db, "notifications"), {
        companyId: user.companyId,
        role: "admin",
        type: "attendance",
        title: title,
        message: message,
        read: false,
        createdAt: nowISO
      });
    } catch (e) {
      console.error(e);
    }

    let statusText = statuses.lateCheckIn ? "យឺត" : (statuses.earlyCheckIn ? "មុនម៉ោង" : "ទាន់ម៉ោង");
    let lateDetails = "";
    if (statuses.lateCheckIn && statuses.lateMinutes > 0) {
      const lHours = Math.floor(statuses.lateMinutes / 60);
      const lMins = Math.round(statuses.lateMinutes % 60);
      lateDetails = `\n(យឺត: ${lHours > 0 ? lHours + 'ម៉ោង ' : ''}${lMins}នាទី)`;
    }

    const checkInMessage = `🟢 <b>ចុះឈ្មោះចូល (Check In)</b>\n<b>បុគ្គលិក:</b> ${user.nameKh || user.name}\n<b>ម៉ោងចុះឈ្មោះ:</b> ${format(checkInDate, "hh:mm a")}\n<b>កាលបរិច្ឆេទ:</b> ${today}\n<b>ស្ថានភាព:</b> ${statusText} ${lateDetails}`;
    
    sendTelegramNotification(checkInMessage);
    
        setLoading(false);
  };

  const requestPhoto = (): Promise<string | undefined> => {
    return new Promise((resolve) => {
      setCameraResolve({ resolve });
    });
  };

  const verifyLocationAndExecute = async (actionFn: (data?: { lat?: number, lng?: number, photoUrl?: string }) => Promise<void>, actionType: 'CHECKIN' | 'CHECKOUT') => {
    const reqPhoto = settings?.requirePhoto || 'NONE';
    const needsPhoto = reqPhoto === 'BOTH' || (reqPhoto === 'CHECKIN' && actionType === 'CHECKIN') || (reqPhoto === 'CHECKOUT' && actionType === 'CHECKOUT');
    
    let photoUrl: string | undefined = undefined;
    if (needsPhoto) {
      photoUrl = await requestPhoto();
      if (!photoUrl) {
         return;
      }
    }

    const executeWithAlert = async (lat?: number, lng?: number) => {
      try {
        await actionFn({ lat, lng, photoUrl });
      } catch (err) {
        console.error(err);
        alert(i18n.t("actionFailed") || "Action failed. Please try again.");
      }
    };

    const reqGeo = settings?.requireGeolocation || 'NONE';
    const needsLocation = 
      reqGeo === 'BOTH' || 
      (reqGeo === 'CHECKIN' && actionType === 'CHECKIN') || 
      (reqGeo === 'CHECKOUT' && actionType === 'CHECKOUT');

    if (!needsLocation) {
      setLoading(true);
      await executeWithAlert();
      setLoading(false);
      return;
    }

    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const targetLat = settings?.officeLat ?? 11.567048;
          const targetLng = settings?.officeLng ?? 104.893430;
          const officeRadius = settings?.officeRadius ?? 100;
          const distance = getDistanceFromLatLonInMeters(lat, lng, targetLat, targetLng);
          
          if (distance > officeRadius) {
            alert(i18n.t("locationOutsideOffice", { distance: Math.round(distance), radius: officeRadius }));
            setLoading(false);
            return;
          }
          await executeWithAlert(lat, lng);
          setLoading(false);
        },
      async (error) => {
        console.warn("Geolocation failed, using IP fallback", error.message);
        try {
          const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
          if (!res.ok) throw new Error('geojs rate limit');
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const lat = parseFloat(data.latitude);
            const lng = parseFloat(data.longitude);
            const targetLat = settings?.officeLat ?? 11.567048;
            const targetLng = settings?.officeLng ?? 104.893430;
            const officeRadius = settings?.officeRadius ?? 100;
            const distance = getDistanceFromLatLonInMeters(lat, lng, targetLat, targetLng);
            
            if (distance > officeRadius) {
              alert(i18n.t("locationOutsideOffice", { distance: Math.round(distance), radius: officeRadius }));
              setLoading(false);
              return;
            }
            await executeWithAlert(lat, lng);
          } else {
            alert(i18n.t("requireLocation") || "Location access is required.");
          }
        } catch (err) {
           alert(i18n.t("requireLocation") || "Location access is required.");
        } finally {
          setLoading(false);
        }
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };

  const handleCheckIn = async () => verifyLocationAndExecute(performCheckIn, 'CHECKIN');

  const performCheckOut = async (data?: { lat?: number, lng?: number, photoUrl?: string }) => {
    if (!activeLog || !user) return;
    const now = new Date();
    const timeIn = parseISO(activeLog.timeIn);
    const timeIn2 = activeLog.timeIn2 ? parseISO(activeLog.timeIn2) : null;
    const isFinalCheckout = activeLog.status === "active2" || !user.shift2Start;

    const updates: any = {};
    if (data?.lat) {
       if (activeLog.status === "active") {
          updates.checkOutLat = data.lat;
          updates.checkOutLng = data.lng;
       } else {
          updates.checkOut2Lat = data.lat;
          updates.checkOut2Lng = data.lng;
       }
    }
    if (data?.photoUrl) {
       if (activeLog.status === "active") {
          updates.checkOutPhotoUrl = data.photoUrl;
       } else {
          updates.checkOut2PhotoUrl = data.photoUrl;
       }
    }
    
    if (activeLog.status === "active") {
        updates.timeOut = now.toISOString();
    } else if (activeLog.status === "active2") {
        updates.timeOut2 = now.toISOString();
    }

    let checkOutMessage = "";

    if (isFinalCheckout) {
        const { isEarlyCheckOut, isExtraTime, shiftDurationHours, lateMinutes, extraMinutes, finalExpectedCheckOut } = calculateShiftStatus(
            timeIn, 
            activeLog.status === "active" ? now : (activeLog.timeOut ? parseISO(activeLog.timeOut) : now), 
            user.shiftStart, 
            user.shiftEnd, 
            (user as any).shiftOverrides, 
            timeIn2, 
            activeLog.status === "active2" ? now : null,
            user.shift2Start,
            user.shift2End,
            settings?.gracePeriodMinutes || 0,
            user.breakHours
        );

        let totalMins = differenceInMinutes(activeLog.status === "active" ? now : (activeLog.timeOut ? parseISO(activeLog.timeOut) : now), timeIn);
        if (activeLog.status === "active2" && timeIn2) {
             totalMins += differenceInMinutes(now, timeIn2);
        }
        const totalHours = Number((Math.max(1, totalMins) / 60).toFixed(4));
        
        const baseHours = shiftDurationHours;
        const overtimeGraceHours = (settings?.overtimeGraceMinutes || 0) / 60;
        const extraHours = baseHours === 0 ? totalHours : ((extraMinutes || 0) / 60);
        const overtimeHours = baseHours === 0 ? totalHours : (extraHours >= overtimeGraceHours ? extraHours : 0);
        const regularHours = baseHours === 0 ? 0 : Math.max(0, Math.min(baseHours, totalHours - extraHours));

        const todayDate = format(new Date(), "yyyy-MM-dd");
        const daysInMonth = getDaysInMonth(timeIn);
        const dailySalaryBase = user.monthlySalary ? (user.monthlySalary / daysInMonth) : (baseHours * (user.hourlyRate || 0));
        const calculatedHourlyRate = getCalculatedHourlyRate(user, todayDate);
        const otPayAmount = calculateOvertimePay(overtimeHours, calculatedHourlyRate, settings || undefined);
        const unpenalizedSalary = baseHours > 0 ? ((regularHours / baseHours) * dailySalaryBase) + otPayAmount : dailySalaryBase + otPayAmount;
        const hasApprovedEarlyLeave = leaves.some(l => l.date === todayDate && l.type === 'early_leave' && l.status === 'approved');
        const hasApprovedLateCheckin = leaves.some(l => l.date === todayDate && l.type === 'late_checkin' && l.status === 'approved');

        const lateDeductionAmount = (hasApprovedLateCheckin || baseHours === 0) ? 0 : ((lateMinutes / 60) * (settings?.lateDeductionPerHour ?? (calculatedHourlyRate || 0)) || 0);
        const dailySalary = unpenalizedSalary - lateDeductionAmount;
        const totalEarnings = dailySalary;

        updates.status = "checked_out";
        updates.regularHours = regularHours;
        updates.lateMinutes = lateMinutes;
        updates.overtimeHours = overtimeHours;
        updates.dailySalary = dailySalary;
        updates.totalEarnings = totalEarnings;
        updates.earlyLeave = hasApprovedEarlyLeave ? false : isEarlyCheckOut;
        updates.earlyCheckOut = hasApprovedEarlyLeave ? false : isEarlyCheckOut;
        updates.extraTime = isExtraTime;
        updates.lateDeduction = lateDeductionAmount;
        
        const actualCheckOut = activeLog.status === "active" ? now : (activeLog.timeOut ? parseISO(activeLog.timeOut) : now);
        const extraMinsRaw = differenceInMinutes(actualCheckOut, finalExpectedCheckOut);
        const extraMins = Math.max(0, extraMinsRaw);
        
        let statusTextOut = isEarlyCheckOut ? "មុនម៉ោង" : (extraMins > 0 ? "បន្ថែមម៉ោង" : "ទាន់ម៉ោង");
        let otDetails = "";
        if (extraMins > 0) {
            const otHours = Math.floor(extraMins / 60);
            const otM = extraMins % 60;
            otDetails = `\n(ថែមម៉ោង: ${otHours > 0 ? otHours + 'ម៉ោង ' : ''}${otM}នាទី)`;
        }
        
        checkOutMessage = `🔴 <b>ចុះឈ្មោះចេញ (Check Out)</b>\n<b>បុគ្គលិក:</b> ${user.nameKh || user.name}\n<b>ម៉ោងចុះឈ្មោះ:</b> ${format(now, "hh:mm a")}\n<b>កាលបរិច្ឆេទ:</b> ${format(now, "yyyy-MM-dd")}\n<b>ស្ថានភាព:</b> ${statusTextOut} ${otDetails}`;
    } else {
        updates.status = "break";
    }

    await updateDoc(doc(db, "logs", activeLog.id), updates);
    
    // Save notifications for admins
    try {
      const outTitle = isFinalCheckout ? "Employee Checked Out" : "Employee On Break";
      const outMessage = isFinalCheckout
        ? `${user.nameKh || user.name} checked out at ${format(now, 'hh:mm a')}`
        : `${user.nameKh || user.name} is on break. Time: ${format(now, 'hh:mm a')}`;
        
      await sendPushNotification(null, "admin", user.companyId, outTitle, outMessage);
      await addDoc(collection(db, "notifications"), {
        companyId: user.companyId,
        role: "admin",
        type: "attendance",
        title: outTitle,
        message: outMessage,
        read: false,
        createdAt: now.toISOString()
      });
    } catch (e) {
      console.error(e);
    }
    
    if (isFinalCheckout) {
        setActiveLog(null);
        await sendTelegramNotification(checkOutMessage);

        
            } else {
        setActiveLog({ ...activeLog, ...updates });
        const breakMessage = `☕ <b>ចេញសម្រាក (Break)</b>\n<b>បុគ្គលិក:</b> ${user.nameKh || user.name}\n<b>ម៉ោងចុះឈ្មោះ:</b> ${format(now, "hh:mm a")}\n<b>កាលបរិច្ឆេទ:</b> ${format(now, "yyyy-MM-dd")}`;
        await sendTelegramNotification(breakMessage);
        
            }
  };

  const handleCheckOut = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await verifyLocationAndExecute(performCheckOut, 'CHECKOUT');
  };

  const performResumeShift = async (data?: { lat?: number, lng?: number, photoUrl?: string }) => {
    if (!activeLog || !user) return;
    const now = new Date();
    const updates: any = { timeIn2: now.toISOString(), status: "active2" as const };
    if (data?.lat) {
       updates.checkIn2Lat = data.lat;
       updates.checkIn2Lng = data.lng;
    }
    if (data?.photoUrl) {
       updates.checkIn2PhotoUrl = data.photoUrl;
    }
    await updateDoc(doc(db, "logs", activeLog.id), updates);
    setActiveLog({ ...activeLog, ...updates });

    // Save notification for admins
    try {
      await sendPushNotification(null, "admin", user.companyId, "Employee Resumed Shift", `${user.nameKh || user.name} returned from break for shift 2 at ${format(now, 'hh:mm a')}`);
      await addDoc(collection(db, "notifications"), {
        companyId: user.companyId,
        role: "admin",
        type: "attendance",
        title: "Employee Resumed Shift",
        message: `${user.nameKh || user.name} returned from break for shift 2 at ${format(now, 'hh:mm a')}`,
        read: false,
        createdAt: now.toISOString()
      });
    } catch (e) {
      console.error(e);
    }

    let targetDay = now.getDay();
    if (now.getHours() < 6) {
      let prevDayDate = new Date(now);
      prevDayDate.setDate(prevDayDate.getDate() - 1);
      targetDay = prevDayDate.getDay();
    }
    const { s2StartHour, s2StartMin, hasSecondShift } = getConfiguredShiftTimes(targetDay, user.shiftStart, user.shiftEnd, (user as any).shiftOverrides, user.shift2Start, user.shift2End, user.breakHours);
    
    let statusText = "ទាន់ម៉ោង";
    let lateDetails = "";
    if (hasSecondShift) {
        let expectedCheckIn2 = new Date(now);
        expectedCheckIn2.setHours(s2StartHour, s2StartMin, 0, 0);
        
        const checkIn2Diff = differenceInMinutes(now, expectedCheckIn2);
        const lateMins = checkIn2Diff - (settings?.gracePeriodMinutes || 0);
        if (lateMins > 0) {
            statusText = "យឺត";
            const lHours = Math.floor(lateMins / 60);
            const lMins = Math.round(lateMins % 60);
            lateDetails = `\n(យឺត: ${lHours > 0 ? lHours + 'ម៉ោង ' : ''}${lMins}នាទី)`;
        } else if (checkIn2Diff < 0) {
            statusText = "មុនម៉ោង";
        }
    }

    const today = format(now, "yyyy-MM-dd");
    const checkIn2Message = `🟢 <b>ចូលវេនទី2 (Check In 2)</b>\n<b>បុគ្គលិក:</b> ${user.nameKh || user.name}\n<b>ម៉ោងចុះឈ្មោះ:</b> ${format(now, "hh:mm a")}\n<b>កាលបរិច្ឆេទ:</b> ${today}\n<b>ស្ថានភាព:</b> ${statusText} ${lateDetails}`;
    await sendTelegramNotification(checkIn2Message);
    
      };

  const handleResumeShift = async () => {
    await verifyLocationAndExecute(performResumeShift, 'CHECKIN');
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingLeave(true);

    try {
      const reqData = {
        companyId: user.companyId,
        staffId: user.id,
        date: leaveDate,
        reason: leaveReason,
        type: leaveType,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };

      const permDoc = await addDoc(collection(db, "permissions"), reqData);

      // Save pending leave notification for admins
      try {
        await sendPushNotification(null, "admin", user.companyId, "Pending Leave Request", `${user.nameKh || user.name} requested leave for ${leaveDate}. Reason: ${leaveReason}`);
        
        const leaveTypeText = leaveType === 'permission' ? 'សុំច្បាប់ (Permission)' : leaveType === 'day_off' ? 'ឈប់សម្រាក (Day Off)' : leaveType === 'late_checkin' ? 'សុំចូលធ្វើការយឺត (Late Check-in)' : leaveType === 'early_leave' ? 'សុំចេញមុនម៉ោង (Early Leave)' : leaveType;
        const telegramMessage = `📝 <b>សំណើសុំច្បាប់ (Leave Request)</b>\n<b>បុគ្គលិក:</b> ${user.nameKh || user.name}\n<b>ប្រភេទ:</b> ${leaveTypeText}\n<b>កាលបរិច្ឆេទ:</b> ${leaveDate}\n<b>មូលហេតុ:</b> ${leaveReason}`;
        await sendTelegramNotification(telegramMessage, true);

        if (user.telegramChatId) {
          await sendDirectTelegramMessage(
            user.telegramChatId,
            `📝 <b>បានដាក់សំណើសុំច្បាប់ (Leave Request Submitted)</b>\n<b>ប្រភេទ:</b> ${leaveTypeText}\n<b>កាលបរិច្ឆេទ:</b> ${leaveDate}\n<b>មូលហេតុ:</b> ${leaveReason}\n<b>ស្ថានភាព:</b> កំពុងរង់ចាំការពិនិត្យ (Pending Review ⏳)`
          );
        }

        await addDoc(collection(db, "notifications"), {
          companyId: user.companyId,
          role: "admin",
          type: "leave_pending",
          title: "Pending Leave Request",
          message: `${user.nameKh || user.name} requested leave for ${leaveDate}. Reason: ${leaveReason}`,
          read: false,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.error(e);
      }

      setLeaveDate("");
      setLeaveReason("");
      setShowLeaveModal(false);
    } catch (error) {
      console.error("Error submitting leave request", error);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  if (!user || user.role === "admin") {
    return <div className="text-center mt-10">Unauthorized or Loading...</div>;
  }

  let liveElapsedSeconds = 0;
  if (activeLog && user && (activeLog.status === "active" || activeLog.status === "active2")) {
    const timeInDate = parseISO(activeLog.timeIn);
    if (activeLog.status === "active") {
      liveElapsedSeconds = differenceInSeconds(currentTime, timeInDate);
    } else if (activeLog.status === "active2" && activeLog.timeIn2 && activeLog.timeOut) {
      liveElapsedSeconds = differenceInSeconds(parseISO(activeLog.timeOut), timeInDate) + differenceInSeconds(currentTime, parseISO(activeLog.timeIn2));
    }
  }

  const liveHours = Math.floor(liveElapsedSeconds / 3600);
  const liveMinutes = Math.floor((liveElapsedSeconds % 3600) / 60);
  const liveSecs = liveElapsedSeconds % 60;

  const isFinalCheckout = activeLog && (activeLog.status === "active2" || !user.shift2Start);



  let targetDayForDisplay = currentTime.getDay();
  if (currentTime.getHours() < 6) {
    let prevDayDate = new Date(currentTime);
    prevDayDate.setDate(prevDayDate.getDate() - 1);
    targetDayForDisplay = prevDayDate.getDay();
  }

  const { shiftStartHour, shiftStartMin, shiftEndHour, shiftEndMin, s2StartHour, s2StartMin, s2EndHour, s2EndMin, hasSecondShift, isOff } = getConfiguredShiftTimes(
    targetDayForDisplay, 
    user.shiftStart, 
    user.shiftEnd, 
    (user as any).shiftOverrides, 
    user.shift2Start, 
    user.shift2End
  );

  const formatTime = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  if (showProfileSetup) {
    return (
      <EmployeeProfileSetupWizard 
        user={user}
        onComplete={handleProfileSubmit}
        onTelegramDetect={handleSetupTelegramDetected}
      />
    );
  }



  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 fade-in w-full overflow-x-hidden md:max-w-2xl lg:max-w-4xl relative z-10 transition-colors duration-300">
      {activeTab === "home" && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 mt-4 sm:mt-6 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col gap-5 sm:gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-bl-[100px] -z-10" />
          <div className="flex items-center gap-4 w-full">
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] bg-indigo-50 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm relative group cursor-pointer overflow-hidden flex-shrink-0 transition-transform hover:scale-105"
              onClick={() => fileInputRef.current?.click()}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl uppercase bg-gradient-to-br from-indigo-100 to-white dark:from-slate-800 dark:to-slate-700">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white drop-shadow-md" />
              </div>
              <input 
                type="file" 
                accept="image/*" 
                capture="user"
                className="hidden" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white truncate tracking-tight">
                {t("welcome")},{" "}
                {i18n.language === "km" && user.nameKh ? (
                  <>
                    <span>{user.nameKh}</span>
                    <span className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 ml-1.5">({user.name})</span>
                  </>
                ) : user.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm truncate">
                  {liveHeaderDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "home" && (
        <>
          {isExpired && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-start gap-3 mt-4"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-red-800 dark:text-red-200">Workspace Subscription Inactive</h4>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1 leading-relaxed">
                  Your company's Workspace subscription is inactive or has expired. Please contact your administrator to renew the subscription and restore access. You can only check in and check out during this time.
                </p>
              </div>
            </motion.div>
          )}
          {shiftNearing && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-start gap-3 mt-4"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-800 dark:text-red-200">{t("shiftEndingSoon")}</h4>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1 leading-relaxed">
               {t("shiftTerminatesIn")} <span className="font-bold">{shiftEndMinutesLeft} {t("minutes")}</span>. {t("pleasePrepareToCheckout")}
            </p>
          </div>
        </motion.div>
      )}

      <motion.div 
        id="tour-clock"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center flex flex-col items-center justify-center relative overflow-hidden"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm mb-8">
          <Clock className="w-7 h-7 text-indigo-500 dark:text-indigo-400 stroke-[2]" />
        </div>
        <div className="text-5xl md:text-6xl font-bold tracking-tighter text-slate-900 dark:text-white mb-2 drop-shadow-sm flex items-baseline justify-center font-display">
          {liveClock.time}
          <span className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 ml-3 font-medium tracking-tight">
            {liveClock.period}
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-sm md:text-base tracking-wide">
          {liveFullDate}
        </p>

        {liveElapsedSeconds > 0 && activeLog?.status !== "break" && (
          <div className="mb-10 font-mono text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-5 py-2.5 rounded-2xl w-fit mx-auto border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center gap-2 shadow-sm">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
             <span className="tracking-wide text-sm">{t("timeOnShift")}: </span>
             <span className="tracking-wider text-base">{String(liveHours).padStart(2, '0')}:{String(liveMinutes).padStart(2, '0')}:{String(liveSecs).padStart(2, '0')}</span>
          </div>
        )}

        {loading ? (
          <div className="w-full max-w-xs relative z-10">
            <button
              disabled
              className="w-full flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-4 rounded-2xl text-lg font-bold transition-all tracking-wide border border-slate-200 dark:border-slate-700"
            >
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>{t("processing") || "Processing..."}</span>
            </button>
          </div>
        ) : !activeLog ? (
          <div className="w-full max-w-xs relative z-10 mt-2">
              <div className="relative group rounded-2xl">
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckIn}
                  className="relative w-full flex items-center justify-center gap-3 bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 dark:hover:bg-indigo-600 py-4 rounded-2xl text-lg font-bold transition-all tracking-wide overflow-hidden border border-transparent"
                >
                  
                  <LogIn className="w-5 h-5 relative z-10 text-white" />
                  <span className="relative z-10">{t("checkIn")}</span>
                </motion.button>
              </div>
          </div>
        ) : activeLog.status === "break" ? (
          <div className="w-full max-w-xs relative z-10 mt-2 space-y-4">
              <div className="relative group rounded-2xl">
                
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleResumeShift} className="relative w-full flex items-center justify-center gap-3 bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 dark:hover:bg-emerald-600 py-4 rounded-2xl text-lg font-bold transition-all tracking-wide overflow-hidden border border-transparent"
                >
                  
                  <LogIn className="w-5 h-5 relative z-10 text-white" />
                  <span className="relative z-10">{t("resumeShift")}</span>
                </motion.button>
              </div>
          </div>
        ) : (
           <div className="w-full max-w-xs space-y-4 relative z-10 mt-2">
              <div className="relative group rounded-2xl">
                
                <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleCheckOut()}
                   className={cn("relative w-full flex items-center justify-center gap-3 shadow-lg py-4 rounded-2xl text-lg font-bold transition-all tracking-wide overflow-hidden border border-transparent text-white", isFinalCheckout ? "bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 shadow-rose-500/25" : "bg-amber-500 dark:bg-amber-400 hover:bg-amber-600 dark:hover:bg-amber-500 shadow-amber-500/25")} >
                   {isFinalCheckout ? <LogOut className="w-5 h-5 relative z-10 text-white" /> : <Coffee className="w-5 h-5 relative z-10 text-white" />}
                   <span className="relative z-10">{isFinalCheckout ? t("checkOut") : t("takeBreak")}</span>
                </motion.button>
              </div>
           </div>
        )}

        {(todayLog || activeLog) && (
          <div className="w-full max-w-sm mt-6 text-left space-y-2">
             <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-white/50 dark:border-slate-700/50/50">
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">{t("shift1")}</span>
                <div className="flex items-center gap-2">
                   {((todayLog || activeLog)?.checkInPhotoUrl || (todayLog || activeLog)?.checkOutPhotoUrl) && (
                     <div className="flex items-center gap-1.5 mr-1">
                        {(todayLog || activeLog)?.checkInPhotoUrl && (
                           <button 
                             onClick={() => setPreviewImage((todayLog || activeLog)?.checkInPhotoUrl || null)}
                             type="button" 
                             title="View Check-In Photo"
                             className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-800 hover:opacity-80 transition-opacity focus:outline-none"
                           >
                              <img src={(todayLog || activeLog)?.checkInPhotoUrl} alt="Check-In" className="w-full h-full object-cover" />
                           </button>
                        )}
                        {(todayLog || activeLog)?.checkOutPhotoUrl && (
                           <button 
                             onClick={() => setPreviewImage((todayLog || activeLog)?.checkOutPhotoUrl || null)}
                             type="button" 
                             title="View Check-Out Photo"
                             className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-800 hover:opacity-80 transition-opacity focus:outline-none"
                           >
                              <img src={(todayLog || activeLog)?.checkOutPhotoUrl} alt="Check-Out" className="w-full h-full object-cover" />
                           </button>
                        )}
                     </div>
                   )}
                   <div className="text-sm font-mono text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis text-right">
                      {(todayLog || activeLog)?.timeIn ? (
                        <>
                           <span className={(todayLog || activeLog)?.lateCheckIn ? "text-orange-500 font-bold" : ""}>{formatTimeWithLocale((todayLog || activeLog)!.timeIn, isKm)}</span>
                           {(todayLog || activeLog)?.timeOut ? (
                              <> <span className="mx-1">→</span> <span className={(todayLog || activeLog)?.earlyCheckOut ? "text-orange-500 font-bold" : ""}>{formatTimeWithLocale((todayLog || activeLog)!.timeOut, isKm)}</span></>
                           ) : " → ..."}
                        </>
                      ) : "-"}
                   </div>
                </div>
             </div>
             {user.shift2Start && (
               <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-white/50 dark:border-slate-700/50/50">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">{t("shift2")}</span>
                  <div className="flex items-center gap-2">
                     {((todayLog || activeLog)?.checkIn2PhotoUrl || (todayLog || activeLog)?.checkOut2PhotoUrl) && (
                       <div className="flex items-center gap-1.5 mr-1">
                          {(todayLog || activeLog)?.checkIn2PhotoUrl && (
                             <button 
                               onClick={() => setPreviewImage((todayLog || activeLog)?.checkIn2PhotoUrl || null)}
                               type="button" 
                               title="View Shift 2 Check-In Photo"
                               className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-800 hover:opacity-80 transition-opacity focus:outline-none"
                             >
                                <img src={(todayLog || activeLog)?.checkIn2PhotoUrl} alt="Shift 2 Check-In" className="w-full h-full object-cover" />
                             </button>
                          )}
                          {(todayLog || activeLog)?.checkOut2PhotoUrl && (
                             <button 
                               onClick={() => setPreviewImage((todayLog || activeLog)?.checkOut2PhotoUrl || null)}
                               type="button" 
                               title="View Shift 2 Check-Out Photo"
                               className="w-7 h-7 rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-800 hover:opacity-80 transition-opacity focus:outline-none"
                             >
                                <img src={(todayLog || activeLog)?.checkOut2PhotoUrl} alt="Shift 2 Check-Out" className="w-full h-full object-cover" />
                             </button>
                          )}
                       </div>
                     )}
                     <div className="text-sm font-mono text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis text-right">
                        {(todayLog || activeLog)?.timeIn2 ? (
                          <>
                             <span>{formatTimeWithLocale((todayLog || activeLog)!.timeIn2, isKm)}</span>
                             {(todayLog || activeLog)?.timeOut2 ? (
                                <> <span className="mx-1">→</span> <span>{formatTimeWithLocale((todayLog || activeLog)!.timeOut2, isKm)}</span></>
                             ) : " → ..."}
                          </>
                        ) : "-"}
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
      >
         {!isExpired && ( <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2rem] sm:px-8 border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-900 dark:text-slate-100">{t("recentLeaves")}</h3>
             <button
               id="tour-request-off"
               onClick={() => setShowLeaveModal(true)}
               className="text-sm font-semibold text-ice-600 dark:text-ice-400 hover:text-ice-700 dark:hover:text-ice-300 transition shadow-sm bg-ice-50 dark:bg-ice-900/20 px-3 py-1.5 rounded-xl border border-ice-100 dark:border-ice-900/30"
             >
               + {t("requestOff")}
             </button>
           </div>
           
           <div className="space-y-3">
             {leaves.slice(0, 3).map((leave, idx) => (
               <div key={`${leave.id}-${idx}`} className="flex justify-between items-center text-sm p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                 <div>
                   <div className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">{format(parseISO(leave.date), "MMM d, yyyy")}</div>
                   <div className="text-slate-500 dark:text-slate-400 capitalize text-xs font-medium">{leave.type === 'permission' ? t("permission") : leave.type === 'day_off' ? t("dayOff") : leave.type === 'late_checkin' ? t("lateCheckinReq") : leave.type === 'early_leave' ? t("earlyLeaveReq") : (leave.type as string).replace('_', ' ')}</div>
                 </div>
                 <div className={cn(
                   "font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-lg",
                   leave.status === 'approved' ? "text-emerald-700 bg-emerald-100/50 dark:text-emerald-400 dark:bg-emerald-500/10" : 
                   leave.status === 'rejected' ? "text-rose-700 bg-rose-100/50 dark:text-rose-400 dark:bg-rose-500/10" : "text-amber-700 bg-amber-100/50 dark:text-amber-400 dark:bg-amber-500/10"
                 )}>
                   {leave.status}
                 </div>
               </div>
             ))}
             {leaves.length === 0 && (
               <div className="text-center text-slate-400 py-6 text-sm font-medium bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50">{t("noRecentRequests")}</div>
             )}
           </div>
         </div>
         )}

         {!isExpired && ( <div id="tour-schedule" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2rem] sm:px-8 border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-center items-center text-center">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6">{t("schedule")}</h3>
            <div className="space-y-4 w-full">
               {isOff ? (
                 <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="font-display text-xl font-bold text-slate-500 dark:text-slate-400">
                       Day Off
                    </div>
                 </div>
               ) : (
                 <>
                   <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30 shadow-sm transition-all hover:shadow-md">
                     <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-widest">{t("shift1")}</div>
                     <div className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                        {formatTime(shiftStartHour, shiftStartMin)} <span className="text-indigo-300 dark:text-indigo-600 font-sans">→</span> {formatTime(shiftEndHour, shiftEndMin)}
                     </div>
                   </div>
                   {hasSecondShift && (
                     <div className="bg-teal-50/50 dark:bg-teal-900/10 p-5 rounded-2xl border border-teal-100/50 dark:border-teal-800/30 shadow-sm transition-all hover:shadow-md">
                       <div className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-2 uppercase tracking-widest">{t("shift2")}</div>
                       <div className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                          {formatTime(s2StartHour, s2StartMin)} <span className="text-teal-300 dark:text-teal-600 font-sans">→</span> {formatTime(s2EndHour, s2EndMin)}
                       </div>
                     </div>
                   )}
                 </>
               )}
            </div>
         </div>

         )}
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2rem] sm:px-8 col-span-1 md:col-span-2 overflow-hidden flex flex-col h-[350px] border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
               <MapPin className="w-5 h-5 text-indigo-500" /> Office Location
             </h3>
             <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
               Radius: {settings?.officeRadius ?? 100}m
             </span>
           </div>
           <div className="flex-1 rounded-[1.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm relative group">
              <iframe
                title="Office Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${settings?.officeLat ?? 11.567048},${settings?.officeLng ?? 104.893430}&hl=en&z=16&output=embed`}
                allowFullScreen
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none group-hover:bg-transparent transition-colors" />
           </div>
         </div>
      </motion.div>
      </>
      )}

      {activeTab === "history" && (
        <EmployeeHistory />
      )}
      
      {activeTab === "planner" && (
        <div className="glass-panel border border-white/60 dark:border-slate-700/50 shadow-md dark:shadow-lg p-4 sm:p-6 md:p-8 rounded-xl md:rounded-2xl overflow-hidden mt-4 pb-24">
          <MasterShiftPlanner />
        </div>
      )}

      {activeTab === "profile" && (
        <div className="flex flex-col gap-4">
          {!isStandalone && (
            <div
              onClick={() => setShowInstallGuide(true)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 p-4 sm:p-5 rounded-xl flex items-center justify-between gap-4 shadow-sm cursor-pointer transition-all group mt-2"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {t("installAppQuickAccess")}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("tapSeeInstall")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                  <Download className="w-3.5 h-3.5" />
                  {t("install") || "Install"}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          )}
          <EmployeeProfile />
        </div>
      )}

      {showLeaveModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden overscroll-none">
          <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t("requestTimeOff")}</h3>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLeaveRequest} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">{t("requestDate")}</label>
                    <input type="date" required value={leaveDate} onChange={e => setLeaveDate(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">{t("requestType")}</label>
                    <select value={leaveType} onChange={e => setLeaveType(e.target.value as any)} className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200">
                      <option value="permission">{t("permissionUnpaid") || t("permission")}</option>
                      <option value="day_off">{t("dayOffPaid") || t("dayOff")}</option>
                      <option value="late_checkin">{t("lateCheckinReq")}</option>
                      <option value="early_leave">{t("earlyLeaveReq")}</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">{t("requestReason")}</label>
                    <textarea required value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200 min-h-[100px]" placeholder="Why do you need this time off?" />
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/20 pb-safe-bottom">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 sm:flex-none py-2.5 px-4 font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 sm:border-transparent transition-colors text-sm text-center"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLeave}
                  className="flex-1 sm:flex-none sm:w-28 py-2.5 px-4 font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
                >
                  {isSubmittingLeave ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t("submit")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <InstallAppModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />

      <AnimatePresence>
        {cameraResolve && (
          <CameraModal
            onCapture={(url) => {
              cameraResolve.resolve(url);
              setCameraResolve(null);
            }}
            onClose={() => {
              cameraResolve.resolve(undefined);
              setCameraResolve(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      {!isExpired && !loading && !isRefreshing && !showLeaveModal && !showInstallGuide && !cameraResolve && !previewImage && createPortal(
        <div className="fixed bottom-0 left-0 right-0 w-full z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-md sm:max-w-xl md:max-w-3xl mx-auto flex items-center justify-around h-16 sm:h-16 px-1">
            <button
              onClick={() => { setActiveTab("home"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={cn("relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200", activeTab === "home" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/30")}
            >
              {activeTab === "home" && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 sm:max-w-[4rem] h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-b-full" />}
              <Home className="w-[22px] h-[22px] sm:w-5 sm:h-5 shrink-0" strokeWidth={activeTab === "home" ? 2.5 : 2} />
              <span className={cn("block text-[10px] sm:text-[11px] font-medium transition-all", activeTab === "home" && "font-bold")}>{t("home")}</span>
            </button>
            
            <button
              onClick={() => { setActiveTab("history"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={cn("relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200", activeTab === "history" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/30")}
            >
              {activeTab === "history" && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 sm:max-w-[4rem] h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-b-full" />}
              <FileText className="w-[22px] h-[22px] sm:w-5 sm:h-5 shrink-0" strokeWidth={activeTab === "history" ? 2.5 : 2} />
              <span className={cn("block text-[10px] sm:text-[11px] font-medium transition-all", activeTab === "history" && "font-bold")}>{t("historyPayroll")}</span>
            </button>

            <button
              onClick={() => { setActiveTab("planner"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={cn("relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200", activeTab === "planner" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/30")}
            >
              {activeTab === "planner" && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 sm:max-w-[4rem] h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-b-full" />}
              <Calendar className="w-[22px] h-[22px] sm:w-5 sm:h-5 shrink-0" strokeWidth={activeTab === "planner" ? 2.5 : 2} />
              <span className={cn("block text-[10px] sm:text-[11px] font-medium transition-all", activeTab === "planner" && "font-bold")}>{t("planner")}</span>
            </button>

            <button
              onClick={() => { setActiveTab("profile"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={cn("relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200", activeTab === "profile" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/30")}
            >
              {activeTab === "profile" && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 sm:max-w-[4rem] h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-b-full" />}
              <User className="w-[22px] h-[22px] sm:w-5 sm:h-5 shrink-0" strokeWidth={activeTab === "profile" ? 2.5 : 2} />
              <span className={cn("block text-[10px] sm:text-[11px] font-medium transition-all", activeTab === "profile" && "font-bold")}>{t("profile")}</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
