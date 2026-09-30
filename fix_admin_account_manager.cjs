const fs = require('fs');
let content = fs.readFileSync('src/components/AdminAccountManager.tsx', 'utf-8');

// Add state for deleting admin
content = content.replace(
`  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const cardPhotoInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoTargetId, setActivePhotoTargetId] = useState<string | null>(null);`,
`  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const cardPhotoInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoTargetId, setActivePhotoTargetId] = useState<string | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);`
);

// Replace handleDeleteAdmin
content = content.replace(
`  const handleDeleteAdmin = async (adminId: string) => {
    if (adminId === user?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    
    if (window.confirm("Are you sure you want to remove this admin?")) {
      try {
        await deleteDoc(doc(db, 'staff', adminId));
        fetchAdmins();
      } catch (err) {
        console.error(err);
        alert("Failed to delete admin.");
      }
    }
  };`,
`  const handleDeleteAdmin = async (adminId: string) => {
    if (adminId === user?.id) {
      setError("You cannot delete your own account.");
      return;
    }
    setAdminToDelete(adminId);
  };
  
  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      await deleteDoc(doc(db, 'staff', adminToDelete));
      fetchAdmins();
      setAdminToDelete(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete admin.");
    }
  };`
);

// Add modal to render
content = content.replace(
`  if (loading) {`,
`  if (loading) {`
);

content = content.replace(
`    </div>
  );
}`,
`      {adminToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Admin</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Are you sure you want to remove this admin? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAdminToDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAdmin}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`
);

// We should also replace the alert("You cannot delete your own account.") with setError
// Wait, already did that in the replacement above!

// There is one more alert() I should check
content = content.replace(
`        alert("Failed to delete admin.");`,
`        setError("Failed to delete admin.");`
);

fs.writeFileSync('src/components/AdminAccountManager.tsx', content);
