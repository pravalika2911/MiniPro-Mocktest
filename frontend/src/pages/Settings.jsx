import { useMemo, useState } from 'react';
import { Settings as SettingsIcon, Shield, User, Lock, Bell, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Identity Configuration', key: 'identity', icon: User },
  { name: 'Security Credentials', key: 'security', icon: Lock },
  { name: 'System Notifications', key: 'notifications', icon: Bell },
  { name: 'Privacy Protocols', key: 'privacy', icon: Shield },
];

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('identity');
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('sentinelProfile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {
      name: user?.name || 'John Doe',
      email: user?.email || 'user@gmail.com',
    };
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => localStorage.getItem('sentinel2fa') === 'true');
  const [saveMessage, setSaveMessage] = useState('');

  const currentUserRole = useMemo(() => String(user?.role || 'student').toLowerCase(), [user]);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('sentinelProfile', JSON.stringify(profile));
    localStorage.setItem('sentinel2fa', String(twoFactorEnabled));
    setSaveMessage('Profile updated successfully.');
    window.setTimeout(() => setSaveMessage(''), 2200);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-10 flex items-center gap-4">
        <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile Settings</h1>
          <p className="text-slate-500 font-medium">Manage your {currentUserRole === 'admin' ? 'admin' : 'candidate'} identity and security preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-50 text-indigo-600 font-bold'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.name}
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'identity' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-indigo-400 opacity-50" />
              <h2 className="text-lg font-bold mb-6 text-slate-800">Identity Configuration</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Candidate Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                  >
                    Save Credentials
                  </button>
                  {saveMessage && (
                    <span className="inline-flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-6 text-slate-800">Security Credentials</h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="font-bold text-slate-800">Password Policy</p>
                    <p className="text-sm text-slate-500">Minimum 8 characters, mixed symbol safety check enabled.</p>
                  </div>
                  <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700">Update</button>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="font-bold text-slate-800">Session Security</p>
                    <p className="text-sm text-slate-500">Auto-lock after inactivity is active.</p>
                  </div>
                  <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700">Review</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-6 text-slate-800">System Notifications</h2>
              <div className="space-y-4 text-slate-600">
                <p>Live exam reminders and security warnings are enabled.</p>
                <p>Candidate milestone emails are set to Gmail notifications only.</p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-6 text-slate-800">Privacy Protocols</h2>
              <div className="space-y-4 text-slate-600">
                <p>Data retention is limited to enrolled coursework and active sessions.</p>
                <p>Proctoring logs remain encrypted and visible only to admins.</p>
              </div>
            </div>
          )}

          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-100 flex items-center justify-between gap-4 group">
            <div className="space-y-1">
              <h3 className="text-white font-bold">2FA Multi-Factor Authentication</h3>
              <p className="text-slate-400 text-sm">Add an extra layer of security to your portal.</p>
            </div>
            <button
              type="button"
              onClick={() => setTwoFactorEnabled((prev) => !prev)}
              className={`relative w-14 h-7 rounded-full border transition-all ${
                twoFactorEnabled ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-700 border-slate-600'
              }`}
              aria-label="Toggle two-factor authentication"
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                  twoFactorEnabled ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
