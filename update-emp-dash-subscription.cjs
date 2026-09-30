const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeDashboard.tsx', 'utf-8');

const isExpiredLogic = `
  const isExpired = !settings?.subscription || settings?.subscription?.status === 'pending' || settings?.subscription?.status === 'expired' || 
    (settings?.subscription?.expiresAt && new Date(settings.subscription.expiresAt).getTime() < Date.now());

  useEffect(() => {
    if (isExpired && activeTab !== "home") {
      setActiveTab("home");
    }
  }, [isExpired, activeTab]);
`;

code = code.replace(
  'const [activeTab, setActiveTab] = useState<"home" | "history" | "profile" | "planner">("home");',
  'const [activeTab, setActiveTab] = useState<"home" | "history" | "profile" | "planner">("home");\n' + isExpiredLogic
);

// Remove the old early return
const oldExpiredLogic = `  const isExpired = !settings?.subscription || settings?.subscription?.status === 'pending' || settings?.subscription?.status === 'expired' || \n    (settings?.subscription?.expiresAt && new Date(settings.subscription.expiresAt).getTime() < Date.now());\n\n  if (isExpired) {\n    return (\n      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">\n        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />\n        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Workspace Subscription Inactive</h2>\n        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">\n          Your company's Workspace subscription is inactive or has expired. Please contact your administrator to renew the subscription and restore access.\n        </p>\n      </div>\n    );\n  }`;
code = code.replace(oldExpiredLogic, "");

// Add the banner in the home tab
const homeTabStart = `{activeTab === "home" && (\n        <>`;
const homeTabWithBanner = `{activeTab === "home" && (\n        <>\n          {isExpired && (\n            <motion.div \n              initial={{ opacity: 0, y: -20, scale: 0.95 }}\n              animate={{ opacity: 1, y: 0, scale: 1 }}\n              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3 mt-4"\n            >\n              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />\n              <div>\n                <h4 className="font-bold text-red-800 dark:text-red-200">Workspace Subscription Inactive</h4>\n                <p className="text-sm text-red-600 dark:text-red-300 mt-1">\n                  Your company's Workspace subscription is inactive or has expired. Please contact your administrator to renew the subscription and restore access. You can only check in and check out during this time.\n                </p>\n              </div>\n            </motion.div>\n          )}`;
code = code.replace(homeTabStart, homeTabWithBanner);

// Hide navigation bar when expired
const navBarStart = `{/* Bottom Navigation Bar */}\n      <div className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white/95`;
const navBarWithHide = `{/* Bottom Navigation Bar */}\n      {!isExpired && <div className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white/95`;
code = code.replace(navBarStart, navBarWithHide);

const navBarEnd = `</span>\n          </button>\n        </div>\n      </div>`;
const navBarEndWithHide = `</span>\n          </button>\n        </div>\n      </div>}`;
code = code.replace(navBarEnd, navBarEndWithHide);


fs.writeFileSync('src/pages/EmployeeDashboard.tsx', code, 'utf-8');
