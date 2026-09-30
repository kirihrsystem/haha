import React, { useState } from 'react';
import { useAuthStore } from '../store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

export default function MakeMeSuperAdmin() {
  const { user, setUser } = useAuthStore();
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const upgrade = async () => {
    if (!user) {
      setMsg("Please login first.");
      return;
    }
    try {
      await updateDoc(doc(db, 'staff', user.id), {
        role: 'super_admin'
      });
      setUser({ ...user, role: 'super_admin' }, user.companyId, "Platform");
      setMsg("Success! You are now a super admin. Redirecting...");
      setTimeout(() => {
        navigate('/system-admin');
      }, 1500);
    } catch (e: any) {
      setMsg("Error: " + e.message);
    }
  };

  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Super Admin Access</h1>
        <p className="text-slate-500 mb-6">Click the button below to upgrade your current account to a Platform Super Admin.</p>
        <button 
          onClick={upgrade} 
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors w-full"
        >
          Upgrade My Account
        </button>
        {msg && <p className="mt-4 font-medium text-indigo-600 dark:text-indigo-400">{msg}</p>}
      </div>
    </div>
  );
}
