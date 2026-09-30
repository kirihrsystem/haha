import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import {
  Smartphone,
  Download,
  X,
  Share,
  PlusSquare,
  MoreVertical,
  Laptop,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  Apple,
  ExternalLink,
} from "lucide-react";
import ScrollLock from "./ScrollLock";
import { cn } from "../lib/utils";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const { t } = useTranslation();
  const [selectedPlatform, setSelectedPlatform] = useState<"ios" | "android" | "desktop">("ios");
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setSelectedPlatform("ios");
    } else if (/android/i.test(ua)) {
      setSelectedPlatform("android");
    } else {
      setSelectedPlatform("desktop");
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopyLink = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        onClose();
      }
    } catch (err) {
      console.error("Install prompt error", err);
    }
    setDeferredPrompt(null);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden overscroll-none">
      <ScrollLock />
      <div
        className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {t("installAppQuickAccess")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t("installKiriHr")} • {t("scanQrInstall")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          className="p-5 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 custom-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Instant 1-Click Install Banner (if browser supports direct install) */}
          {deferredPrompt && (
            <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    1-Click Direct Install Ready
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Click below to install Kiri HR directly to your screen with no browser bars.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Install Now
              </button>
            </div>
          )}

          {/* Device Selection Segmented Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Select Your Device Platform
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                PWA • Works Offline
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setSelectedPlatform("ios")}
                className={cn(
                  "py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all",
                  selectedPlatform === "ios"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Apple className="w-4 h-4 shrink-0" />
                <span>iOS (Safari)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform("android")}
                className={cn(
                  "py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all",
                  selectedPlatform === "android"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Smartphone className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform("desktop")}
                className={cn(
                  "py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all",
                  selectedPlatform === "desktop"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Laptop className="w-4 h-4 shrink-0 text-sky-500" />
                <span>Desktop</span>
              </button>
            </div>
          </div>

          {/* Step by Step Instructions Card */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {selectedPlatform === "ios" && t("safariIos")}
                {selectedPlatform === "android" && t("androidChrome")}
                {selectedPlatform === "desktop" && "Desktop (Chrome / Edge / Safari)"}
              </h4>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                No Store Download
              </span>
            </div>

            <div className="space-y-3">
              {/* iOS Safari Steps */}
              {selectedPlatform === "ios" && (
                <>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      1
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Open <strong className="text-slate-900 dark:text-white">Safari</strong> on your iPhone or iPad and navigate to this website.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      2
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Tap the <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded text-blue-600 dark:text-blue-400 font-semibold"><Share className="w-3.5 h-3.5" /> Share</strong> icon at the bottom of the screen.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      3
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Scroll down in the action sheet and select <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded text-emerald-600 dark:text-emerald-400 font-semibold"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      4
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Tap <strong className="text-slate-900 dark:text-white">Add</strong> in the top-right corner. The Kiri HR app icon will now appear on your home screen!
                    </div>
                  </div>
                </>
              )}

              {/* Android Chrome Steps */}
              {selectedPlatform === "android" && (
                <>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      1
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Open this web app in <strong className="text-slate-900 dark:text-white">Google Chrome</strong> on your Android phone.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      2
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Tap the <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold"><MoreVertical className="w-3.5 h-3.5" /> Menu (3 dots)</strong> in the top-right corner.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      3
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Tap <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 rounded text-indigo-600 dark:text-indigo-400 font-semibold"><Download className="w-3.5 h-3.5" /> Install App</strong> or <strong className="text-slate-900 dark:text-white">Add to Home screen</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      4
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Tap <strong className="text-slate-900 dark:text-white">Install</strong> to confirm. The standalone app icon is now pinned to your app drawer and home screen.
                    </div>
                  </div>
                </>
              )}

              {/* Desktop Steps */}
              {selectedPlatform === "desktop" && (
                <>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      1
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      In Chrome or Microsoft Edge, look at the right side of the address bar for the <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 rounded text-indigo-600 dark:text-indigo-400 font-semibold"><Download className="w-3.5 h-3.5" /> Install</strong> button.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      2
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Alternatively, click the browser menu (3 dots) → select <strong className="text-slate-900 dark:text-white">Save and share</strong> or <strong className="text-slate-900 dark:text-white">Install Kiri HR</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      3
                    </span>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Confirm installation. The app opens in its own window and can be pinned to your Taskbar (Windows) or Dock (Mac).
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* QR Code and Direct Link Sharing */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Open Instantly on Mobile Device
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 shrink-0">
                <QRCodeSVG value={shareUrl} size={110} level="M" />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1 w-full">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Scan this QR code using your phone camera to quickly open and install Kiri HR directly on your device.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 truncate outline-none select-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex gap-3 sm:gap-4 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm"
          >
            {t("cancel") || "Close"}
          </button>
          {deferredPrompt ? (
            <button
              type="button"
              onClick={handleNativeInstall}
              className="flex-1 py-2.5 px-4 font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Install App Now</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Got It</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
