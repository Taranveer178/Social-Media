import { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Database,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Shield,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useData } from '../contexts/useData';
import { DEFAULT_USER_SETTINGS } from '../services/firebaseData';
import { uploadMedia } from '../services/storage';
import { Avatar } from '../components/ui/Avatar';

export const SettingsView = () => {
  const { user, changePassword, sendPasswordReset } = useAuth();
  const { updateProfile, updateSettings, seedDemoData, showToast } = useData();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [vibe, setVibe] = useState(user?.vibe || '🔥 Focused');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const [openSection, setOpenSection] = useState('privacy');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const currentSettings = user?.settings || DEFAULT_USER_SETTINGS;

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const avatar = avatarFile ? await uploadMedia(avatarFile) : user?.avatar;
      await updateProfile({ name, username, bio, vibe, avatar });
      setAvatarFile(null);
      setSaved(true);
      showToast('Profile saved to Firebase! ✨');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSetting = async (category, key) => {
    const categoryObj = currentSettings[category] || {};
    const updatedCategory = {
      ...categoryObj,
      [key]: !categoryObj[key],
    };
    try {
      await updateSettings({
        ...currentSettings,
        [category]: updatedCategory,
      });
    } catch (error) {
      showToast(error.message);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus('Password must be at least 6 characters.');
      return;
    }
    try {
      await changePassword(newPassword);
      setNewPassword('');
      setPasswordStatus('Password updated in Firebase Auth! 🔒');
    } catch (error) {
      setPasswordStatus(error.message);
    }
  };

  const handleResetEmail = async () => {
    try {
      await sendPasswordReset(user?.email);
      setPasswordStatus(`Password reset email sent to ${user?.email}! 📧`);
    } catch (error) {
      setPasswordStatus(error.message);
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
    } catch (error) {
      showToast(error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile & Settings</h1>
            <p className="text-xs text-slate-500">Manage your public profile and account preferences in Firebase.</p>
          </div>
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 text-violet-600 dark:text-violet-400 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-violet-200 dark:border-violet-800"
          >
            <Database size={14} />
            <span>{isSeeding ? 'Seeding...' : 'Seed Demo Data'}</span>
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Public Profile</h2>

          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar} name={user?.name} size="lg" isOnline={true} vibe={vibe} />
            <label className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-3.5 py-2 rounded-2xl cursor-pointer hover:bg-violet-100">
              <ImageIcon size={16} />
              <span>{avatarFile?.name || 'Upload New Photo'}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Full Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Username</label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username"
                className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Current Vibe</label>
            <input
              value={vibe}
              onChange={(event) => setVibe(event.target.value)}
              placeholder="Current vibe (e.g. 💻 Coding)"
              className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Tell people about your vibe..."
              className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-3 rounded-2xl text-sm resize-none"
              rows="3"
            />
          </div>

          {saveError && <p role="alert" className="text-sm text-rose-500">{saveError}</p>}
          {saved && <p role="status" className="text-sm text-emerald-600 font-semibold">Profile saved to Firestore ✓</p>}

          <button
            disabled={isSaving}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-violet-500/20"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Interactive Settings Accordions Connected to Firestore */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
          {/* 1. Account Privacy */}
          <div>
            <button
              type="button"
              onClick={() => setOpenSection(openSection === 'privacy' ? null : 'privacy')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Account Privacy</h3>
                  <p className="text-xs text-slate-400">Control who sees your vibe, online status, and read receipts</p>
                </div>
              </div>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'privacy' ? 'rotate-180' : ''}`} />
            </button>
            {openSection === 'privacy' && (
              <div className="px-5 pb-5 pt-2 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                {[
                  { key: 'showOnlineStatus', label: 'Show Online Status', desc: 'Let others see when you are active on Vibely' },
                  { key: 'allowConnectionRequests', label: 'Allow Connection Requests', desc: 'Receive new mood match requests from Discover' },
                  { key: 'readReceipts', label: 'Send Read Receipts', desc: 'Show double checkmarks when you read messages' },
                ].map((item) => {
                  const enabled = currentSettings.privacy?.[item.key] !== false;
                  return (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSetting('privacy', item.key)}
                        className={`w-11 h-6 rounded-full transition-colors p-0.5 ${enabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Notifications */}
          <div>
            <button
              type="button"
              onClick={() => setOpenSection(openSection === 'notifications' ? null : 'notifications')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                  <p className="text-xs text-slate-400">Message alerts, story replies, and moment activity</p>
                </div>
              </div>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'notifications' ? 'rotate-180' : ''}`} />
            </button>
            {openSection === 'notifications' && (
              <div className="px-5 pb-5 pt-2 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                {[
                  { key: 'messageAlerts', label: 'Direct & Group Message Alerts', desc: 'Real-time notifications for incoming messages' },
                  { key: 'storyUpdates', label: 'Story Likes & Replies', desc: 'Notify when someone reacts to your Vibe Story' },
                  { key: 'momentActivity', label: 'Moments Likes & Comments', desc: 'Notify when members interact with your Moments' },
                ].map((item) => {
                  const enabled = currentSettings.notifications?.[item.key] !== false;
                  return (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSetting('notifications', item.key)}
                        className={`w-11 h-6 rounded-full transition-colors p-0.5 ${enabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Security & Password */}
          <div>
            <button
              type="button"
              onClick={() => setOpenSection(openSection === 'security' ? null : 'security')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Password</h3>
                  <p className="text-xs text-slate-400">Firebase Authentication password and account recovery</p>
                </div>
              </div>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'security' ? 'rotate-180' : ''}`} />
            </button>
            {openSection === 'security' && (
              <div className="px-5 pb-5 pt-2 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                <form onSubmit={handlePasswordChange} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                  />
                  <button
                    type="submit"
                    className="bg-violet-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <KeyRound size={14} /> Update Password
                  </button>
                </form>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Signed in as {user?.email}</span>
                  <button
                    type="button"
                    onClick={handleResetEmail}
                    className="text-xs font-bold text-violet-600 hover:underline"
                  >
                    Send Password Reset Email
                  </button>
                </div>
                {passwordStatus && <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">{passwordStatus}</p>}
              </div>
            )}
          </div>

          {/* 4. Storage & Data */}
          <div>
            <button
              type="button"
              onClick={() => setOpenSection(openSection === 'storage' ? null : 'storage')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Storage & Data</h3>
                  <p className="text-xs text-slate-400">AI voice transcripts, translations, and media quality</p>
                </div>
              </div>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${openSection === 'storage' ? 'rotate-180' : ''}`} />
            </button>
            {openSection === 'storage' && (
              <div className="px-5 pb-5 pt-2 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                {[
                  { key: 'autoTranscripts', label: 'AI Voice Transcripts', desc: 'Automatically transcribe voice notes in chats' },
                  { key: 'autoTranslate', label: 'Instant Message Translation', desc: 'Enable 1-click translation on chat messages' },
                  { key: 'highQualityMedia', label: 'High-Resolution Media Uploads', desc: 'Upload full-clarity images to Firebase Storage / Cloudinary' },
                ].map((item) => {
                  const enabled = currentSettings.storage?.[item.key] !== false;
                  return (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSetting('storage', item.key)}
                        className={`w-11 h-6 rounded-full transition-colors p-0.5 ${enabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
