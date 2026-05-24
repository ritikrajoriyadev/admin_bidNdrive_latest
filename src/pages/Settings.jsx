import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';
import {
  Settings as SettingsIcon, User, Lock, Bell, Globe, Shield, Database,
  Mail, Phone, Eye, EyeOff, Save, RefreshCw, Trash2, ChevronRight, Check,
  Moon, Sun, Monitor, Palette, Key, AlertTriangle, Download, Upload
} from 'lucide-react';

/* ─── Section Wrapper ──────────────────────────────────────────────────── */
const Section = ({ title, description, icon, children }) => (
  <div className="bg-white border border-white/[0.06] rounded-2xl overflow-hidden">
    <div className="flex items-start gap-4 px-6 py-5 border-b border-white/[0.06]">
      <span className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-semibold indigo-500">{title}</h2>
        <p className="text-xs indigo-500/40 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="px-6 py-5 space-y-5">{children}</div>
  </div>
);

/* ─── Field Row ────────────────────────────────────────────────────────── */
const FieldRow = ({ label, hint, children }) => (
  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
    <div className="md:w-56 shrink-0">
      <p className="text-sm font-medium indigo-500/80">{label}</p>
      {hint && <p className="text-xs indigo-500/35 mt-0.5">{hint}</p>}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

/* ─── Toggle Switch ────────────────────────────────────────────────────── */
const Toggle = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${enabled ? 'bg-indigo-500' : 'bg-gray-700'}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

/* ─── Input ────────────────────────────────────────────────────────────── */
const Input = ({ type = 'text', value, onChange, placeholder, disabled, icon: Icon }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 indigo-500/30" size={16} />}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2 rounded-lg bg-gray-800 border border-white/10 indigo-500 placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500/50 transition disabled:opacity-40 disabled:cursor-not-allowed`}
    />
  </div>
);

/* ─── Select ───────────────────────────────────────────────────────────── */
const Select = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 indigo-500 text-sm focus:outline-none focus:border-indigo-500/50 transition"
  >
    {children}
  </select>
);

/* ─── Danger Button ────────────────────────────────────────────────────── */
const DangerButton = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/20 hover:border-red-500/40 transition w-full"
  >
    <Icon size={16} />
    {label}
  </button>
);

/* ─── Theme Option ─────────────────────────────────────────────────────── */
const ThemeOption = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition ${active
      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
      : 'bg-gray-800 border-white/10 indigo-500/50 hover:indigo-500/70 hover:bg-gray-700'
      }`}
  >
    <Icon size={20} />
    {label}
  </button>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Settings() {
  const { addToast } = useToast();

  /* General */
  const [siteName, setSiteName] = useState('BidNDrive Admin');
  const [siteEmail, setSiteEmail] = useState('admin@bidndrive.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('dark');

  /* Profile */
  const [adminName, setAdminName] = useState('Super Admin');
  const [adminEmail, setAdminEmail] = useState('admin@bidndrive.com');
  const [adminPhone, setAdminPhone] = useState('+91 98765 43210');

  /* Security */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  /* Notifications */
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [newUserAlert, setNewUserAlert] = useState(true);
  const [newEnquiryAlert, setNewEnquiryAlert] = useState(true);
  const [paymentAlert, setPaymentAlert] = useState(true);
  const [systemAlert, setSystemAlert] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);

  /* System */
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [logLevel, setLogLevel] = useState('error');

  const saveSection = (section) => {
    // Replace with actual API call per section
    addToast(`${section} settings saved successfully`, 'success');
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('Please fill all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    // Replace with actual API call
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addToast('Password changed successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold indigo-500 mb-1">Settings</h1>
            <p className="indigo-500/50">Manage your platform preferences and configurations</p>
          </div>
          <span className="flex items-center gap-2 text-xs indigo-500/30 bg-gray-800 border border-white/[0.06] px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System Online
          </span>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="bg-white border border-white/[0.06] rounded-2xl p-1.5 flex gap-1 flex-wrap">
          {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'system', label: 'System', icon: Database },
          ].map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium indigo-500/50 hover:indigo-500/80 hover:bg-white/5 transition"
            >
              <Icon size={15} />
              {label}
            </a>
          ))}
        </div>

        {/* ── General ── */}
        <div id="general">
          <Section title="General" description="Basic platform information and regional settings" icon={<Globe size={18} />}>
            <FieldRow label="Site Name" hint="Displayed in browser tab and emails">
              <Input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="Platform name" icon={SettingsIcon} />
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Contact Email" hint="Used for system notifications">
              <Input type="email" value={siteEmail} onChange={e => setSiteEmail(e.target.value)} placeholder="admin@example.com" icon={Mail} />
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Support Phone" hint="Shown to users for support">
              <Input value={supportPhone} onChange={e => setSupportPhone(e.target.value)} placeholder="+91 00000 00000" icon={Phone} />
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Timezone">
              <Select value={timezone} onChange={e => setTimezone(e.target.value)}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                <option value="America/New_York">America/New_York (EST, UTC-5)</option>
                <option value="Europe/London">Europe/London (GMT, UTC+0)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
              </Select>
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Language">
              <Select value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ar">Arabic</option>
              </Select>
            </FieldRow>
            <div className="flex justify-end pt-2">
              <button onClick={() => saveSection('General')} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 indigo-500 text-sm font-medium rounded-lg transition">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </Section>
        </div>

        {/* ── Profile ── */}
        <div id="profile">
          <Section title="Profile" description="Update your admin account information" icon={<User size={18} />}>
            {/* Avatar */}
            <FieldRow label="Profile Photo" hint="JPG, PNG up to 2MB">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center indigo-500 text-2xl font-bold shadow-lg shadow-indigo-500/30">
                  A
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/10 indigo-500/70 text-xs rounded-lg cursor-pointer transition">
                    <Upload size={14} /> Upload
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                  <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/10 text-red-400 text-xs rounded-lg transition">
                    Remove
                  </button>
                </div>
              </div>
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Full Name">
              <Input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Your name" icon={User} />
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Email Address">
              <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="you@email.com" icon={Mail} />
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Phone Number">
              <Input value={adminPhone} onChange={e => setAdminPhone(e.target.value)} placeholder="+91 00000 00000" icon={Phone} />
            </FieldRow>
            <div className="flex justify-end pt-2">
              <button onClick={() => saveSection('Profile')} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 indigo-500 text-sm font-medium rounded-lg transition">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </Section>
        </div>

        {/* ── Security ── */}
        <div id="security">
          <Section title="Security" description="Manage password and account security settings" icon={<Lock size={18} />}>
            {/* Change Password */}
            <p className="text-xs font-semibold indigo-500/30 uppercase tracking-widest">Change Password</p>
            <FieldRow label="Current Password">
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-3 pr-10 py-2 rounded-lg bg-gray-800 border border-white/10 indigo-500 placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500/50 transition"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 indigo-500/40 hover:indigo-500/70 transition">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FieldRow>
            <FieldRow label="New Password">
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-3 pr-10 py-2 rounded-lg bg-gray-800 border border-white/10 indigo-500 placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500/50 transition"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 indigo-500/40 hover:indigo-500/70 transition">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FieldRow>
            <FieldRow label="Confirm Password">
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-3 pr-10 py-2 rounded-lg bg-gray-800 border border-white/10 indigo-500 placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500/50 transition"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 indigo-500/40 hover:indigo-500/70 transition">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FieldRow>
            <div className="flex justify-end">
              <button onClick={handlePasswordChange} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 indigo-500 text-sm font-medium rounded-lg transition">
                <Key size={16} /> Update Password
              </button>
            </div>

            <div className="h-px bg-white/[0.06]" />
            <p className="text-xs font-semibold indigo-500/30 uppercase tracking-widest">Access Control</p>

            <FieldRow label="Two-Factor Authentication" hint="Adds an extra layer of security to your login">
              <div className="flex items-center gap-3">
                <Toggle enabled={twoFactor} onChange={setTwoFactor} />
                <span className={`text-sm ${twoFactor ? 'text-emerald-400' : 'indigo-500/40'}`}>
                  {twoFactor ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Session Timeout" hint="Auto logout after inactivity">
              <Select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="0">Never</option>
              </Select>
            </FieldRow>
            <div className="flex justify-end pt-2">
              <button onClick={() => saveSection('Security')} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 indigo-500 text-sm font-medium rounded-lg transition">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </Section>
        </div>

        {/* ── Notifications ── */}
        <div id="notifications">
          <Section title="Notifications" description="Control how and when you receive alerts" icon={<Bell size={18} />}>
            <p className="text-xs font-semibold indigo-500/30 uppercase tracking-widest">Channels</p>
            <FieldRow label="Email Notifications" hint="Receive alerts via email">
              <Toggle enabled={emailNotifs} onChange={setEmailNotifs} />
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Push Notifications" hint="Browser push notifications">
              <Toggle enabled={pushNotifs} onChange={setPushNotifs} />
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="SMS Notifications" hint="Receive alerts via SMS">
              <Toggle enabled={smsNotifs} onChange={setSmsNotifs} />
            </FieldRow>

            <div className="h-px bg-white/[0.06]" />
            <p className="text-xs font-semibold indigo-500/30 uppercase tracking-widest">Alert Types</p>

            {[
              { label: 'New User Registrations', hint: 'Alert when a new user signs up', val: newUserAlert, set: setNewUserAlert },
              { label: 'New Enquiries', hint: 'Alert on incoming car enquiries', val: newEnquiryAlert, set: setNewEnquiryAlert },
              { label: 'Payment Alerts', hint: 'Alert on successful transactions', val: paymentAlert, set: setPaymentAlert },
              { label: 'System Alerts', hint: 'Server and infrastructure warnings', val: systemAlert, set: setSystemAlert },
            ].map(({ label, hint, val, set }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div className="h-px bg-white/[0.06]" />}
                <FieldRow label={label} hint={hint}>
                  <Toggle enabled={val} onChange={set} />
                </FieldRow>
              </React.Fragment>
            ))}

            <div className="h-px bg-white/[0.06]" />
            <p className="text-xs font-semibold indigo-500/30 uppercase tracking-widest">Reports</p>
            <FieldRow label="Weekly Summary Report" hint="Every Monday at 9:00 AM">
              <Toggle enabled={weeklyReport} onChange={setWeeklyReport} />
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Monthly Analytics Report" hint="1st of every month">
              <Toggle enabled={monthlyReport} onChange={setMonthlyReport} />
            </FieldRow>
            <div className="flex justify-end pt-2">
              <button onClick={() => saveSection('Notification')} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 indigo-500 text-sm font-medium rounded-lg transition">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </Section>
        </div>

        {/* ── Appearance ── */}
        <div id="appearance">
          <Section title="Appearance" description="Customize the look and feel of the admin panel" icon={<Palette size={18} />}>
            <FieldRow label="Theme">
              <div className="flex gap-3 flex-wrap">
                <ThemeOption icon={Moon} label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
                <ThemeOption icon={Sun} label="Light" active={theme === 'light'} onClick={() => setTheme('light')} />
                <ThemeOption icon={Monitor} label="System" active={theme === 'system'} onClick={() => setTheme('system')} />
              </div>
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Accent Color" hint="Primary color for buttons and highlights">
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: 'Indigo', classes: 'bg-indigo-500', active: true },
                  { label: 'Violet', classes: 'bg-violet-500', active: false },
                  { label: 'Blue', classes: 'bg-blue-500', active: false },
                  { label: 'Emerald', classes: 'bg-emerald-500', active: false },
                  { label: 'Rose', classes: 'bg-rose-500', active: false },
                ].map(({ label, classes, active }) => (
                  <button key={label} title={label} className={`w-8 h-8 rounded-full ${classes} flex items-center justify-center transition hover:scale-110 ${active ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-gray-900' : ''}`}>
                    {active && <Check size={14} className="indigo-500" />}
                  </button>
                ))}
              </div>
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Sidebar" hint="Default expanded or collapsed state">
              <Select value="collapsed">
                <option value="collapsed">Start Collapsed</option>
                <option value="expanded">Start Expanded</option>
              </Select>
            </FieldRow>
            <div className="flex justify-end pt-2">
              <button onClick={() => saveSection('Appearance')} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 indigo-500 text-sm font-medium rounded-lg transition">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </Section>
        </div>

        {/* ── System ── */}
        <div id="system">
          <Section title="System" description="Advanced server and maintenance settings" icon={<Database size={18} />}>
            <FieldRow label="Maintenance Mode" hint="Disables the site for regular users">
              <div className="flex items-center gap-3">
                <Toggle enabled={maintenanceMode} onChange={setMaintenanceMode} />
                {maintenanceMode && (
                  <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-medium">
                    Site is offline for users
                  </span>
                )}
              </div>
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Debug Mode" hint="Log verbose errors to console">
              <Toggle enabled={debugMode} onChange={setDebugMode} />
            </FieldRow>
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Auto Backup" hint="Automatically backup database">
              <Toggle enabled={autoBackup} onChange={setAutoBackup} />
            </FieldRow>
            {autoBackup && (
              <>
                <div className="h-px bg-white/[0.06]" />
                <FieldRow label="Backup Frequency">
                  <Select value={backupFrequency} onChange={e => setBackupFrequency(e.target.value)}>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                </FieldRow>
              </>
            )}
            <div className="h-px bg-white/[0.06]" />
            <FieldRow label="Log Level" hint="System error reporting level">
              <Select value={logLevel} onChange={e => setLogLevel(e.target.value)}>
                <option value="error">Error only</option>
                <option value="warn">Warning & Error</option>
                <option value="info">Info</option>
                <option value="debug">Debug (verbose)</option>
              </Select>
            </FieldRow>

            <div className="h-px bg-white/[0.06]" />
            <p className="text-xs font-semibold indigo-500/30 uppercase tracking-widest">Data & Backup</p>
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <button className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 indigo-500/70 text-sm font-medium border border-white/10 hover:border-white/20 transition">
                <Download size={16} className="text-indigo-400" /> Export All Data
              </button>
              <button className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 indigo-500/70 text-sm font-medium border border-white/10 hover:border-white/20 transition">
                <RefreshCw size={16} className="text-emerald-400" /> Trigger Backup Now
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => saveSection('System')} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 indigo-500 text-sm font-medium rounded-lg transition">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </Section>
        </div>

        {/* ── Danger Zone ── */}
        <div className="bg-white border border-red-500/20 rounded-2xl overflow-hidden">
          <div className="flex items-start gap-4 px-6 py-5 border-b border-red-500/10">
            <span className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold indigo-500">Danger Zone</h2>
              <p className="text-xs indigo-500/40 mt-0.5">Irreversible and destructive actions</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-3">
            <DangerButton icon={RefreshCw} label="Clear All Cache" onClick={() => addToast('Cache cleared', 'success')} />
            <DangerButton icon={Trash2} label="Delete All Logs" onClick={() => { if (window.confirm('Delete all system logs? This cannot be undone.')) addToast('Logs deleted', 'success'); }} />
            <DangerButton icon={Shield} label="Reset All Permissions to Default" onClick={() => { if (window.confirm('Reset all role permissions? This cannot be undone.')) addToast('Permissions reset', 'success'); }} />
          </div>
        </div>

      </div>
    </div>
  );
}
