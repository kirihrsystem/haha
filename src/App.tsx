import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useThemeStore } from './store';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeDirectAccess from './pages/EmployeeDirectAccess';
import WorkspacePortal from './pages/WorkspacePortal';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import MakeMeSuperAdmin from './pages/MakeMeSuperAdmin';
import Layout from './components/Layout';
import LiveBackground from './components/LiveBackground';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import GlobalFooter from './components/GlobalFooter';
import SplashScreen from './components/SplashScreen';
import { AnimatePresence, motion } from 'motion/react';
import { initGoogleTranslate } from './utils/googleTranslate';

function ScrollToTop() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    const resetScroll = () => {
      // Attempt instant scroll for main window
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Also reset any internal scrollable containers (like sidebars or menus)
      const scrollableDivs = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
      scrollableDivs.forEach(div => {
        div.scrollTop = 0;
      });
    };

    resetScroll();
    
    // Also try a slight delay to combat frame renders and layout shifts
    const timer1 = setTimeout(resetScroll, 50);
    const timer2 = setTimeout(resetScroll, 200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname, user?.id]);

  return null;
}

function getSubdomain() {
  if (typeof window === 'undefined') return 'main';
  const hostname = window.location.hostname;
  if (hostname.startsWith('superadmin.')) return 'superadmin';
  if (hostname.startsWith('admin.')) return 'admin';
  if (hostname.startsWith('staff.')) return 'staff';
  return 'main';
}

function RouteTransition() {
  const { user } = useAuthStore();
  const location = useLocation();
  const subdomain = getSubdomain();

  const wrapAnimation = (children: React.ReactNode) => (
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
      <motion.div key={location.pathname.split('/')[1] || '/'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col w-full h-full">
        {children}
      </motion.div>
    </AnimatePresence>
  );

  if (subdomain === 'superadmin') {
    return wrapAnimation(
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<Layout />}>
          <Route path="/" element={user?.role === 'super_admin' ? <SuperAdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/*" element={user?.role === 'super_admin' ? <SuperAdminDashboard /> : <Navigate to="/login" />} />
        </Route>
      </Routes>
    );
  }

  if (subdomain === 'admin') {
    return wrapAnimation(
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<Layout />}>
          {/* admin.kirihr.com/theirworkspacename */}
          <Route path="/:companySlug/*" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/*" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
        </Route>
      </Routes>
    );
  }

  if (subdomain === 'staff') {
    return wrapAnimation(
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        {/* staff.kirihr.com/workspace/staffname */}
        <Route path="/:companySlug/:staffId" element={<EmployeeDirectAccess />} />
        <Route element={<Layout />}>
          <Route path="/" element={user?.role === 'staff' ? <EmployeeDashboard /> : <Navigate to="/login" />} />
          <Route path="/*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    );
  }

  // Fallback for main domain (kirihr.com) and localhost/preview
  return wrapAnimation(
    <Routes location={location}>
      <Route path="/" element={
        user?.role === 'super_admin' ? <Navigate to="/system-admin" replace /> :
        user?.role === 'admin' ? <Navigate to="/admin" replace /> :
        user?.role === 'staff' ? <Navigate to="/employee" replace /> :
        <Landing />
      } />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/setup-super-admin" element={<MakeMeSuperAdmin />} />
      <Route path="/e/:companyId/:staffId" element={<EmployeeDirectAccess />} />
      <Route path="/:companySlug/e/:staffId" element={<EmployeeDirectAccess />} />
      <Route path="/:companySlug" element={<WorkspacePortal />} />
      
      <Route element={<Layout />}>
        <Route path="/employee" element={
           user?.role === 'staff' ? <EmployeeDashboard /> : <Navigate to="/login" />
        } />
        
        <Route path="/admin/*" element={
          user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login port" />
        } />

        <Route path="/system-admin" element={
          user?.role === 'super_admin' ? <SuperAdminDashboard /> : <Navigate to="/login" />
        } />
      </Route>
    </Routes>
  );
}


export default function App() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initGoogleTranslate();
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash-screen" onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>
      <Router>
        <ScrollToTop />
        <LiveBackground />
        {user && <PWAInstallPrompt />}
        <div className="flex flex-col min-h-screen relative z-10 w-full print:min-h-0 print:h-full print:overflow-visible mix-blend-normal">
          <main className="flex-grow flex flex-col w-full relative">
            <Main> the first thing</Main>
            <RouteTransition />
          </main>
          <GlobalFooter />
        </div>
      </Router>
    </>
  );
}
