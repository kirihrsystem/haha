import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Camera } from 'lucide-react';
import ScrollLock from './ScrollLock';
import { useTranslation } from 'react-i18next';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  const { t } = useTranslation();

  if (!imageUrl) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden overscroll-none"
      onClick={onClose}
    >
      <ScrollLock />
      <div
        className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Attendance Photo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Check-in / Check-out capture
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
          className="p-5 sm:p-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 custom-scrollbar flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/30"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          />
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
          <a
            href={imageUrl}
            download={`attendance-photo-${new Date().getTime()}.jpg`}
            className="flex-1 py-2.5 px-4 font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Photo</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
