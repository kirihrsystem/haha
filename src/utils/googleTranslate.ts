// Google Translate Integration Utility for full-app translation to Khmer
declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

let isInitialized = false;

// Monkey patch for React + Google Translate crash issue
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (console) {
        console.warn('Cannot remove a child from a different parent', child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.warn('Cannot insert before a reference node from a different parent', referenceNode, this);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };
}

export function initGoogleTranslate(): void {
  // Disabled Google Translate to use incode translations via i18next
}

/**
 * Sets the Google Translate language cookies across domain paths
 */
function setTranslateCookies(langCode: string): void {
  const hostname = window.location.hostname;
  const cookieVal = langCode === 'km' ? '/en/km' : '/en/en';
  
  // Set cookie for current path
  document.cookie = `googtrans=${cookieVal}; path=/;`;
  
  // Set cookie for domain if not localhost or IP
  if (hostname && !hostname.includes('localhost') && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=.${hostname};`;
  }
}

/**
 * Clears Google Translate cookies when switching back to English
 */
function clearTranslateCookies(): void {
  const hostname = window.location.hostname;
  document.cookie = `googtrans=/en/en; path=/;`;
  document.cookie = `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  
  if (hostname && !hostname.includes('localhost') && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    document.cookie = `googtrans=/en/en; path=/; domain=${hostname};`;
    document.cookie = `googtrans=/en/en; path=/; domain=.${hostname};`;
    document.cookie = `googtrans=; path=/; domain=${hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    document.cookie = `googtrans=; path=/; domain=.${hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  }
}

/**
 * Applies the translation using the Google Translate select dropdown or cookie + reload fallback
 */
export function applyGoogleTranslation(targetLang: 'en' | 'km', reloadIfNeeded: boolean = false): void {
  // Disabled Google Translate
}

/**
 * Full app language switcher that toggles i18n, saves preference, and applies Google Translate
 */
export function toggleAppLanguage(currentLang: string, i18nInstance: any): 'en' | 'km' {
  const isKm = (currentLang || '').toLowerCase().startsWith('km') || localStorage.getItem('lang') === 'km';
  const newLang = isKm ? 'en' : 'km';
  
  // 1. Save preference
  localStorage.setItem('lang', newLang);

  // 2. Update i18next instance to trigger React re-render of the language toggle button state
  if (i18nInstance && typeof i18nInstance.changeLanguage === 'function') {
    i18nInstance.changeLanguage(newLang);
  }
  
  return newLang;
}
