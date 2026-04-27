import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/settingsService';
import { getMyProfile, updateMyProfile, changePassword } from '../../services/userService';
import {
  User,
  Bell,
  Shield,
  Save,
  Building2,
  Database,
  Cloud,
  Lock,
  Loader2,
  CheckCircle
} from 'lucide-react';

// Fallback settings in case API fails
const defaultSettings = {
  systemName: 'Project Progress Monitoring System',
  organizationName: 'Acme Corp',
  organizationLogoUrl: '',
  contactEmail: 'admin@acme.com',
  address: '123 Business Way, Tech City',
  primaryDomain: 'pms.company.com',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  maintenanceMode: false,
  enableNotifications: true,
  allowedFileTypes: ['.pdf', '.docx', '.xlsx', '.png', '.jpg'],
  maxUploadSizeMB: 10,
  retentionDays: 365
};

export default function Settings() {
  const [activeSection, setActiveSection] = useState('system');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [profile, setProfile] = useState<any>({});
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
  const isAdmin = currentUser.role === 'Admin';

  const sections = [
    { id: 'system', label: 'System Configuration', icon: Database },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'storage', label: 'Cloud Storage', icon: Cloud },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [settingsData, profileData] = await Promise.all([
          isAdmin ? getSettings().catch(() => defaultSettings) : Promise.resolve(defaultSettings),
          getMyProfile().catch(() => ({}))
        ]);
        setSettings(settingsData);
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateMyProfile({ fullName: profile.fullName, email: profile.email, phone: profile.phone });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password. Check your current password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (activeSection === 'system' || activeSection === 'organization' || activeSection === 'notifications' || activeSection === 'storage') {
      handleSaveSettings();
    } else if (activeSection === 'profile') {
      handleSaveProfile();
    } else if (activeSection === 'security') {
      handleChangePassword();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage your system configuration and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-100 disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  activeSection === section.id
                    ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <Icon className="w-5 h-5" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {activeSection === 'system' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">General Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">System Name</label>
                    <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                      value={settings.systemName || ''}
                      onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Primary Domain</label>
                    <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                      value={settings.primaryDomain || ''}
                      onChange={(e) => setSettings({ ...settings, primaryDomain: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Regional Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Timezone</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-600"
                      value={settings.timezone || 'UTC'}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      disabled={!isAdmin}
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="IST">IST (India Standard Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Date Format</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-600"
                      value={settings.dateFormat || 'YYYY-MM-DD'}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      disabled={!isAdmin}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">System Maintenance</h3>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-orange-500" />
                    <div>
                      <div className="font-bold text-orange-900">Maintenance Mode</div>
                      <div className="text-sm text-orange-700">Disable system access for regular maintenance</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox"
                      className="sr-only peer"
                      checked={settings.maintenanceMode || false}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      disabled={!isAdmin}
                    />
                    <div className="w-11 h-6 bg-orange-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">My Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    value={profile.fullName || ''}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Role</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl outline-none font-medium text-gray-500" value={profile.role || currentUser.role || ''} disabled />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current Password</label>
                  <input type="password" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                  <input type="password" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm New Password</label>
                  <input type="password" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <div className="font-bold text-gray-900">Enable Notifications</div>
                    <div className="text-sm text-gray-500">Receive system notifications</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer"
                      checked={settings.enableNotifications ?? true}
                      onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'storage' && isAdmin && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">File Storage Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Max Upload Size (MB)</label>
                  <input type="number" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    value={settings.maxUploadSizeMB || 10}
                    onChange={(e) => setSettings({ ...settings, maxUploadSizeMB: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Retention Period (Days)</label>
                  <input type="number" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                    value={settings.retentionDays || 365}
                    onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) || 365 })}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'organization' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Branding & Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Organization Name</label>
                    <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                      value={settings.organizationName || ''}
                      onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Logo URL</label>
                    <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                      placeholder="https://company.com/logo.png"
                      value={settings.organizationLogoUrl || ''}
                      onChange={(e) => setSettings({ ...settings, organizationLogoUrl: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Primary Contact Email</label>
                    <input type="email" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                      value={settings.contactEmail || ''}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Physical Address</label>
                    <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                      value={settings.address || ''}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
              </div>

              {!isAdmin && (
                <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-blue-500" />
                  <p className="text-sm text-blue-700">Only administrators can modify organization settings.</p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'storage' && !isAdmin && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Lock className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium italic">Only administrators can access storage settings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
