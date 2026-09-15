import React, { useState, useEffect } from 'react';
import { StaffUserEntity, Language, Theme } from '../types';
import { fetchStaffUsersAPI, createStaffUserAPI, updateStaffUserAPI, deleteStaffUserAPI } from '../services/api';
import { Users, Plus, Edit3, Trash2, X, Check, Loader2, ShieldCheck, Mail, Phone, Lock } from 'lucide-react';

interface UsersManagerProps {
  lang: Language;
  theme: Theme;
}

export const UsersManager: React.FC<UsersManagerProps> = ({ lang, theme }) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  const [users, setUsers] = useState<StaffUserEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUserEntity | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [messageToast, setMessageToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'counselor' as 'admin' | 'counselor' | 'editor' | 'staff',
    telegram_id: '',
    is_active: true,
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchStaffUsersAPI();
      setUsers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setForm({
      name: '',
      email: '',
      phone: '+966 5',
      password: '',
      role: 'counselor',
      telegram_id: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: StaffUserEntity) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.role,
      telegram_id: u.telegram_id || '',
      is_active: u.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingUser) {
        await updateStaffUserAPI(editingUser.id, form);
        setMessageToast(isAr ? 'تم تعديل المستخدم بنجاح' : 'User updated successfully');
      } else {
        await createStaffUserAPI(form);
        setMessageToast(isAr ? 'تمت إضافة المستشار/المستخدم بنجاح' : 'User created successfully');
      }
      setIsModalOpen(false);
      await loadUsers();
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessageToast(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Delete this user?')) return;
    await deleteStaffUserAPI(id);
    setMessageToast(isAr ? 'تم حذف المستخدم' : 'User deleted');
    await loadUsers();
    setTimeout(() => setMessageToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {messageToast && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{messageToast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>{isAr ? 'إدارة فريق العمل والمستشارين الأكاديميين' : 'Staff & Counselors Management'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr ? 'إدارة حسابات المستشارين، الأدوار والصلاحيات (Admin, Counselor, Editor)' : 'Manage staff roles, permissions and assignments'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة مستشار / مستخدم جديد' : 'Add Staff Member'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{isAr ? 'جاري تحميل المستخدمين...' : 'Loading users...'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div
              key={u.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                    u.role === 'admin' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : u.role === 'counselor' 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {u.role === 'admin' ? (isAr ? 'مدير نظام' : 'Admin') : u.role === 'counselor' ? (isAr ? 'مستشار أكاديمي' : 'Counselor') : u.role}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {u.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
                  </span>
                </div>
                <h3 className="text-base font-black">{u.name}</h3>
                <div className="mt-2 space-y-1 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span>{u.email}</span>
                  </p>
                  {u.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-500" />
                      <span>{u.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/60 mt-4">
                <button
                  onClick={() => openEditModal(u)}
                  className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-amber-400"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="p-2 rounded-lg border border-rose-500/30 hover:bg-rose-500/20 text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-black flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>{editingUser ? (isAr ? 'تعديل المستخدم' : 'Edit User') : (isAr ? 'إضافة مستخدم جديد' : 'Add New User')}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="د. فيصل الشمري"
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'الدور الوظيفي' : 'Role'}</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option value="counselor">{isAr ? 'مستشار أكاديمي' : 'Counselor'}</option>
                    <option value="admin">{isAr ? 'مدير نظام (Admin)' : 'Admin'}</option>
                    <option value="editor">{isAr ? 'محرر محتوى' : 'Editor'}</option>
                    <option value="staff">{isAr ? 'موظف قبول' : 'Staff'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{isAr ? 'كلمة المرور' : 'Password'}</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingUser ? (isAr ? 'اتركها فارغة لعدم التغيير' : 'Leave blank to keep') : '******'}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'حفظ' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
