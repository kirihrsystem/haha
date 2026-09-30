const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf-8');

// Add state for deleting user
content = content.replace(
`  const [editingUser, setEditingUser] = useState<Staff | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newPasscode, setNewPasscode] = useState("");`,
`  const [editingUser, setEditingUser] = useState<Staff | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);`
);

// Replace handleDeleteUser
content = content.replace(
`  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      try {
        await deleteDoc(doc(db, 'staff', userId));
        fetchData();
      } catch (err) {
        console.error("Error deleting user", err);
      }
    }
  };`,
`  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };
  
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'staff', userToDelete));
      fetchData();
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user", err);
    }
  };`
);

// Find the last modal and add this modal right after it
// Let's add it before the final </div> of the SuperAdminDashboard
content = content.replace(
`      {/* Super Admin Profile Modal */}`,
`      {/* Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete User</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Are you sure you want to permanently delete this user? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Profile Modal */}`
);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
