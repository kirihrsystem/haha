import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuthStore } from "../store";
import { Staff } from "../types";

export default function EmployeeDirectAccess() {
  const { companyId, staffId, companySlug } = useParams();
  const resolvedCompanyId = companySlug || companyId;
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    async function authEmployee() {
      if (!resolvedCompanyId || !staffId) {
        setError("Invalid link.");
        return;
      }
      try {
        // Resolve real companyId if companyId is a slug or code
        let realCompanyId = resolvedCompanyId;
        let companyName = "Workspace";

        // Try direct lookup first
        const directCompSnap = await getDoc(doc(db, "companies_settings", resolvedCompanyId));
        if (directCompSnap.exists()) {
          realCompanyId = directCompSnap.id;
          companyName = directCompSnap.data().companyName || "Workspace";
        } else {
          // Search by slug or companyCode
          const cleanSearch = resolvedCompanyId.trim();
          let compSnaps = await getDocs(query(collection(db, "companies_settings"), where("slug", "==", cleanSearch.toLowerCase().replace(/[^a-z0-9]/g, ''))));
          if (compSnaps.empty) {
            compSnaps = await getDocs(query(collection(db, "companies_settings"), where("slug", "==", cleanSearch.toLowerCase())));
          }
          if (compSnaps.empty) {
            compSnaps = await getDocs(query(collection(db, "companies_settings"), where("companyCode", "==", cleanSearch.toUpperCase())));
          }

          if (!compSnaps.empty) {
            realCompanyId = compSnaps.docs[0].id;
            companyName = compSnaps.docs[0].data().companyName || "Workspace";
          }
        }

        const staffDocRef = doc(db, "staff", staffId);
        const staffSnap = await getDoc(staffDocRef);
        if (!staffSnap.exists()) {
          setError("Employee not found.");
          return;
        }
        
        const staffData = { id: staffSnap.id, ...staffSnap.data() } as Staff;
        if (!staffData.role) staffData.role = "staff";
        
        if (staffData.companyId !== realCompanyId) {
           setError("Link mismatch.");
           return;
        }

        setUser(staffData, realCompanyId, companyName);
        navigate("/employee", { replace: true });

      } catch (err: any) {
        setError("Error authenticating: " + err.message);
      }
    }

    authEmployee();
  }, [resolvedCompanyId, staffId, navigate, setUser]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <div className="glass-panel p-8 rounded-3xl border border-red-500/30 bg-red-50/10 text-center">
           <h2 className="text-xl font-bold text-red-600 mb-2">Access Error</h2>
           <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
       <div className="flex flex-col items-center gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50">
         <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-full animate-pulse"></div>
            </div>
         </div>
         <p className="text-lg font-semibold animate-pulse">Connecting securely...</p>
       </div>
    </div>
  );
}
