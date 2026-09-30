import React, { useState, useEffect } from 'react';
import ScrollLock from './ScrollLock';
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, X, Check, Loader2, Navigation } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuthStore, useSettingsStore } from "../store";
import LocationPicker from "./LocationPicker";

export default function OfficeLocationSetupModal() {
  const { user } = useAuthStore();
  const { settings, setSettings } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [lat, setLat] = useState<number>(11.5564);
  const [lng, setLng] = useState<number>(104.9282);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Only show if user is admin, settings loaded, subscription active, office location not set, and not dismissed
    if (
      user?.role === "admin" &&
      settings.companyId &&
      settings.subscription &&
      !settings.officeLat &&
      !settings.officeLng &&
      !hasDismissed
    ) {
      setIsOpen(true);
    }
  }, [user, settings, hasDismissed]);

  const fetchLocation = () => {
    setIsFetching(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setIsFetching(false);
        },
        (error) => {
          console.warn("Geolocation failed, using IP fallback", error.message);
          fetch('https://get.geojs.io/v1/ip/geo.json')
            .then(res => {
              if (!res.ok) throw new Error('geojs limit');
              return res.json();
            })
            .then(data => {
              if (data.latitude && data.longitude) {
                setLat(parseFloat(data.latitude));
                setLng(parseFloat(data.longitude));
              }
              setIsFetching(false);
            })
            .catch(err => {
              console.warn("IP fallback failed", err.message);
              setIsFetching(false);
            });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsFetching(false);
      alert("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLocation();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!user?.companyId) return;
    setIsSaving(true);
    try {
      const newSettings = { officeLat: lat, officeLng: lng };
      await updateDoc(doc(db, "companies_settings", user.companyId), newSettings);
      setSettings({ ...settings, ...newSettings });
      setShowWelcome(true);
    } catch (error) {
      console.error("Error saving office location:", error);
      alert("Failed to save location");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    setHasDismissed(true);
    setIsOpen(false);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div key="office-location-setup-portal" className="fixed inset-0 z-[99999] flex items-center justify-center sm:p-6 bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
          <ScrollLock />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={handleDismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 sm:rounded-3xl w-full h-[100dvh] sm:h-[80vh] sm:max-h-[700px] sm:max-w-2xl shadow-2xl relative flex flex-col overflow-hidden sm:border border-slate-200/50 dark:border-slate-700/50"
          >
            {showWelcome ? (
              <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center w-full flex-1">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Check className="w-10 h-10" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                  Office Location Saved
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-base sm:text-lg">
                  Geofenced attendance tracking is now active.
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-semibold transition-all w-full sm:w-auto"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 z-10 bg-white dark:bg-slate-900">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-500" />
                      Office Location
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Drag the map to pin your workplace.
                    </p>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative bg-slate-100 dark:bg-slate-950 min-h-0">
                  {isFetching && (
                    <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      </div>
                    </div>
                  )}
                  <LocationPicker
                    lat={lat}
                    lng={lng}
                    onChange={(newLat, newLng) => {
                      setLat(newLat);
                      setLng(newLng);
                    }}
                    className="h-full w-full rounded-none border-0"
                  />
                  
                  {/* Floating GPS Button */}
                  <button
                    onClick={fetchLocation}
                    disabled={isFetching}
                    className="absolute bottom-6 right-6 p-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50 transition-colors z-20 group"
                    title="Find My Location"
                  >
                    {isFetching ? (
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Navigation className="w-5 h-5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    )}
                  </button>
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
                  <div className="flex gap-3">
                    <button
                      onClick={handleDismiss}
                      className="flex-1 px-4 py-3.5 sm:py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-[2] px-4 py-3.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Save Location"
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
