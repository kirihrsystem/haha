import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from '../store';
import { Staff } from '../types';
import { sendTelegramNotification } from '../utils/telegramUtils';
import { compressImage } from '../utils/imageUtils';
import { Shield, Plus, Trash2, Mail, Lock, User as UserIcon, Edit2, Camera, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminAccountManager() {
  const { user, setUser } = useAuthStore();
  const { t } = useTranslation();
  const [admins, setAdmins] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const cardPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [activePhotoTargetId, setActivePhotoTargetId] = useState<string | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profilePictureUrl: ''
  });

  const fetchAdmins = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'staff'),
        where('companyId', '==', user.companyId),
        where('role', '==', 'admin')
      );
      const sn = await getDocs(q);
      setAdmins(sn.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));
    } catch (err) {
      console.warn("Notice fetching admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [user?.companyId]);

  const handleCardPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePhotoTargetId) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Please select a photo under 10MB.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const b64 = await compressImage(file, 400, 400, 0.8);
      
      await setDoc(doc(db, 'staff', activePhotoTargetId), {
        profilePictureUrl: b64,
        avatar: b64
      }, { merge: true });

      if (activePhotoTargetId === user?.id && user) {
        setUser({ ...user, profilePictureUrl: b64, avatar: b64 });
      }

      await fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setIsUploadingPhoto(false);
      setActivePhotoTargetId(null);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;
    setError('');

    try {
      // Check if email already exists
      const emailQ = query(
        collection(db, 'staff'),
        where('email', '==', formData.email.toLowerCase())
      );
      const existing = await getDocs(emailQ);
      if (!existing.empty && existing.docs[0].id !== editingId) {
        setError('An account with this email already exists.');
        return;
      }

      if (editingId) {
        const adminToUpdate = admins.find(a => a.id === editingId);
        if (adminToUpdate) {
          const updatedAdmin = {
            ...adminToUpdate,
            name: formData.name,
            email: formData.email.toLowerCase(),
            profilePictureUrl: formData.profilePictureUrl || adminToUpdate.profilePictureUrl,
            avatar: formData.profilePictureUrl || adminToUpdate.avatar,
            ...(formData.password ? { password: formData.password } : {})
          };
          await setDoc(doc(db, 'staff', editingId), updatedAdmin, { merge: true });
          if (editingId === user?.id && user) {
            setUser({ ...user, ...updatedAdmin });
          }
        }
      } else {
        const uid = 'admin_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        
        const newAdmin: Partial<Staff> = {
          id: uid,
          companyId: user.companyId,
          name: formData.name,
          email: formData.email.toLowerCase(),
          password: formData.password,
          role: 'admin',
          profilePictureUrl: formData.profilePictureUrl || '',
          avatar: formData.profilePictureUrl || '',
          passcode: '',
          hourlyRate: 0,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'staff', uid), newAdmin);
        await sendTelegramNotification(
          `🛡️ <b>បន្ថែមគណនីរដ្ឋបាលថ្មី (New Admin Added)</b>\n<b>ឈ្មោះ:</b> ${formData.name}\n<b>អ៊ីមែល:</b> ${formData.email}`,
          true
        );
      }
      
      setFormData({ name: '', email: '', password: '', profilePictureUrl: '' });
      setShowAddForm(false);
      setEditingId(null);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to save admin');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
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
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">{t('loadingAdmins')}</div>;
  }

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={cardPhotoInputRef}
        onChange={handleCardPhotoChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-500" />
            {t('adminAccounts')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('adminAccountsSub')}
          </p>
        </div>
        <button
          onClick={() => {
            if (showAddForm) {
              setShowAddForm(false);
              setEditingId(null);
              setFormData({ name: '', email: '', password: '', profilePictureUrl: '' });
            } else {
              setShowAddForm(true);
            }
          }}
          className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg shadow-sm transition-colors text-xs py-2.5 px-4 flex items-center gap-2 font-semibold"
        >
          {showAddForm ? t('cancel') : <><Plus className="w-4 h-4" /> {t('addAdmin')}</>}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold mb-4">{editingId ? t('editAdmin') : t('inviteNewAdmin')}</h3>
          <form onSubmit={handleAddAdmin} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                {t('fullName')}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                {t('emailAddress')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="admin@company.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                {t('temporaryPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required={!editingId}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-11 pr-12 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder={editingId ? t('leaveBlankToKeepUnchanged') : "••••••••"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                {t('adminProfilePicture')}
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.profilePictureUrl ? (
                    <img src={formData.profilePictureUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-indigo-500" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const b64 = await compressImage(file, 400, 400, 0.8);
                      setFormData(prev => ({ ...prev, profilePictureUrl: b64 }));
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-slate-800 dark:file:text-indigo-400 cursor-pointer"
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            
            <button type="submit" className="w-full py-3 mt-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm">
              {editingId ? t('saveChanges') : t('createAdminAccount')}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map((admin, idx) => {
          const pic = admin.profilePictureUrl || admin.avatar;

          return (
            <div key={`${admin.id}-${idx}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col relative group">
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingId(admin.id);
                    setFormData({
                      name: admin.name,
                      email: admin.email || '',
                      password: '',
                      profilePictureUrl: pic || ''
                    });
                    setShowAddForm(true);
                  }}
                  className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors"
                  title="Edit Admin"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {admin.id !== user?.id && (
                  <button 
                    onClick={() => handleDeleteAdmin(admin.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Remove Admin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="relative group/avatar w-14 h-14 mb-4">
                <div className="w-14 h-14 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-0.5 border border-indigo-100 dark:border-indigo-800/50 overflow-hidden">
                  {pic ? (
                    <img src={pic} alt={admin.name} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 text-white font-bold text-xl flex items-center justify-center rounded-md">
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setActivePhotoTargetId(admin.id);
                    cardPhotoInputRef.current?.click();
                  }}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-md flex items-center justify-center text-white"
                  title="Upload Admin Profile Picture"
                >
                  {isUploadingPhoto && activePhotoTargetId === admin.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>

              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-snug">{admin.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5" /> {admin.email}
              </p>
              {admin.id === user?.id && (
                <span className="mt-4 text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 px-3 py-1 rounded-full w-max border border-indigo-200 dark:border-indigo-800">
                  {t('currentAdminYou')}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {adminToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('deleteAdmin')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{t('deleteAdminConfirm')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAdminToDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDeleteAdmin}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
