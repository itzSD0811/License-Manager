"use client";

import { useState } from "react";
import { 
  User, ShieldCheck, Database, Mail, Palette,
  Camera, Key, Smartphone, HardDrive, TestTube2,
  CheckCircle2, XCircle, Save, Download, Activity, Trash2
} from "lucide-react";
import { updateAccountSettings, updateThemeSettings, updateMailSettings, clearLoginHistory, setup2FA, verify2FASetup, disable2FA, testMailConnection, testDbConnection, testFirebaseConnection } from "@/app/actions/settings";

export default function SettingsClientUI({ builder, loginAttempts }: { builder: any, loginAttempts: any[] }) {
  const [activeTab, setActiveTab] = useState("account");
  const [twoFactorStep, setTwoFactorStep] = useState<0|1|2>(0);
  const [qrUrl, setQrUrl] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [error2FA, setError2FA] = useState("");
  const [confirmDisable2FA, setConfirmDisable2FA] = useState(false);
  
  const handleStart2FA = async () => {
    const res = await setup2FA(builder.id, builder.email as string);
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(res.otpauthUrl || "")}`);
    setTwoFactorStep(1);
  };

  const handleVerify2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError2FA("");
    const res = await verify2FASetup(builder.id, setupCode);
    if (res.success) {
      setBackupCodes(res.backupCodes || []);
      setTwoFactorStep(2);
    } else {
      setError2FA("Invalid verification code. Try again.");
    }
  };

  const [testDbStatus, setTestDbStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [testFbStatus, setTestFbStatus] = useState<"idle"|"loading"|"success"|"error">("idle");

  const initialTheme = builder.settings?.theme || "light:#5a56d6";
  const [colorMode, setColorMode] = useState(initialTheme.split(":")[0]);
  const [accentColor, setAccentColor] = useState(initialTheme.split(":")[1] || "#5a56d6");

  const tabs = [
    { id: "account", label: "Account & Security", icon: User },
    { id: "mail", label: "Mail Templates", icon: Mail },
    { id: "customization", label: "Customization", icon: Palette },
    { id: "diagnostics", label: "System Diagnostics", icon: Activity },
  ];

  // Dummy generation if not from server
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const handleDownloadCodes = () => {
    const text = backupCodes.join("\n");
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "magneticx-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setTwoFactorStep(0); // Close modal
  };

  const [testMailStatus, setTestMailStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [mailTestMessage, setMailTestMessage] = useState("");

  const [dbTestMessage, setDbTestMessage] = useState("");
  const [fbTestMessage, setFbTestMessage] = useState("");

  const simulateDbTest = async () => {
    setTestDbStatus("loading");
    const res = await testDbConnection();
    setTestDbStatus(res.success ? "success" : "error");
    setDbTestMessage(res.message);
  };

  const simulateFbTest = async () => {
    setTestFbStatus("loading");
    const res = await testFirebaseConnection();
    setTestFbStatus(res.success ? "success" : "error");
    setFbTestMessage(res.message);
  };

  const handleSimulateMailTest = async () => {
    setTestMailStatus("loading");
    const res = await testMailConnection();
    setTestMailStatus(res.success ? "success" : "error");
    setMailTestMessage(res.message);
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[var(--tw-gray-900)] tracking-tight">Builder Settings</h2>
        <p className="text-sm font-medium text-[var(--tw-gray-500)] mt-1">Manage your account, security, and portal appearance.</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-64 shrink-0 space-y-2 sticky top-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white text-[var(--tw-gray-500)] hover:bg-[var(--tw-gray-50)] hover:text-[var(--tw-gray-900)] shadow-sm border border-[var(--tw-gray-100)]"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* ACCOUNT TAB */}
          {activeTab === "account" && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-3xl p-8 border border-[var(--tw-gray-100)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-lg font-bold text-[var(--tw-gray-900)] mb-6">Profile Details</h3>
                
                <form action={updateAccountSettings} className="space-y-4">
                  <input type="hidden" name="builderId" value={builder.id} />
                  
                  <div className="flex gap-4 items-center mb-6">
                    {builder.settings?.avatarUrl ? (
                      <img src={builder.settings.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[var(--bg-app)] flex items-center justify-center text-primary">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-[var(--tw-gray-400)] tracking-wider uppercase mb-1">Avatar Image URL</label>
                      <input type="url" name="avatarUrl" defaultValue={builder.settings?.avatarUrl || ""} placeholder="https://example.com/avatar.jpg" className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-[var(--tw-gray-900)] font-bold focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--tw-gray-400)] tracking-wider uppercase mb-1">Full Name</label>
                    <input type="text" name="name" defaultValue={builder.settings?.name || ""} className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-[var(--tw-gray-900)] font-bold focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--tw-gray-400)] tracking-wider uppercase mb-1">Email Address (Login)</label>
                    <input type="email" name="email" defaultValue={builder.email} className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-[var(--tw-gray-900)] font-bold focus:ring-2 focus:ring-primary focus:bg-white transition-all sm:text-sm" />
                  </div>
                  
                  <div className="pt-4 mt-2 border-t border-[var(--tw-gray-100)]">
                    <button type="submit" className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl text-sm font-bold hover:brightness-90 transition-all">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-[var(--tw-gray-100)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-lg font-bold text-[var(--tw-gray-900)] mb-6">Security</h3>
                
                <div className="flex items-center justify-between p-5 rounded-2xl border border-[var(--tw-gray-100)] bg-[var(--bg-app)]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Smartphone className="w-4 h-4 text-[var(--tw-gray-500)]" />
                      <h4 className="font-bold text-[var(--tw-gray-900)]">Two-Factor Authentication</h4>
                    </div>
                    <p className="text-xs text-[var(--tw-gray-500)]">{builder.settings?.twoFactorEnabled ? "Active and securing your account" : "Not configured"}</p>
                  </div>
                  {builder.settings?.twoFactorEnabled ? (
                    <button type="button" onClick={() => setConfirmDisable2FA(true)} className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all bg-red-50 text-red-600 hover:bg-red-100">
                      Disable
                    </button>
                  ) : (
                    <button type="button" onClick={handleStart2FA} className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all bg-primary text-white hover:brightness-90">
                      Enable 2FA
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-[var(--tw-gray-100)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[var(--tw-gray-900)]">Recent Login History</h3>
                  {loginAttempts.length > 0 && (
                    <form action={clearLoginHistory}>
                      <input type="hidden" name="email" value={builder.email} />
                      <button type="submit" className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        Clear History
                      </button>
                    </form>
                  )}
                </div>
                {loginAttempts.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-8 h-8 text-[var(--tw-gray-300)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--tw-gray-500)] font-medium">No recent login attempts recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loginAttempts.map((attempt: any) => (
                      <div key={attempt.id} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-app)]">
                        <div>
                          <p className="text-xs font-bold text-[var(--tw-gray-900)]">{attempt.ipAddress}</p>
                          <p className="text-[10px] text-[var(--tw-gray-400)]">{new Date(attempt.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-wider uppercase ${attempt.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {attempt.success ? "Success" : "Failed"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* DIAGNOSTICS TAB */}
        {activeTab === "diagnostics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Database className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">MySQL Database Connection</h3>
              <p className="text-sm text-gray-500 mb-6">Ping the primary database to verify latency and connection stability.</p>
              
              <div className="flex items-center justify-between">
                <button 
                  onClick={simulateDbTest}
                  disabled={testDbStatus === "loading"}
                  className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <TestTube2 className="w-4 h-4" />
                  {testDbStatus === "loading" ? "Testing..." : "Run Test"}
                </button>
                
                {testDbStatus === "success" && (
                  <span className="flex items-center gap-1 text-sm font-bold text-green-500">
                    <CheckCircle2 className="w-4 h-4" /> {dbTestMessage || "Connected"}
                  </span>
                )}
                {testDbStatus === "error" && (
                  <span className="flex items-center gap-1 text-sm font-bold text-red-500">
                    <XCircle className="w-4 h-4" /> Failed: {dbTestMessage}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Firebase Authentication</h3>
              <p className="text-sm text-gray-500 mb-6">Verify communication with Firebase Auth API servers.</p>
              
              <div className="flex items-center justify-between">
                <button 
                  onClick={simulateFbTest}
                  disabled={testFbStatus === "loading"}
                  className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <TestTube2 className="w-4 h-4" />
                  {testFbStatus === "loading" ? "Testing..." : "Run Test"}
                </button>

                {testFbStatus === "success" && (
                  <span className="flex items-center gap-1 text-sm font-bold text-green-500">
                    <CheckCircle2 className="w-4 h-4" /> {fbTestMessage || "Connected"}
                  </span>
                )}
                {testFbStatus === "error" && (
                  <span className="flex items-center gap-1 text-sm font-bold text-red-500">
                    <XCircle className="w-4 h-4" /> Failed: {fbTestMessage}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                <Mail className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">SMTP Mail Server</h3>
              <p className="text-sm text-gray-500 mb-6">Test connection to the configured SMTP mailer via .env settings.</p>
              
              <div className="flex items-center justify-between">
                <button 
                  onClick={handleSimulateMailTest}
                  disabled={testMailStatus === "loading"}
                  className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <TestTube2 className="w-4 h-4" />
                  {testMailStatus === "loading" ? "Testing..." : "Run Test"}
                </button>

                {testMailStatus === "success" && (
                  <span className="flex items-center gap-1 text-sm font-bold text-green-500">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                )}
                {testMailStatus === "error" && (
                  <span className="flex items-center gap-1 text-sm font-bold text-red-500">
                    <XCircle className="w-4 h-4" /> Failed: {mailTestMessage}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MAIL TEMPLATES TAB */}
        {activeTab === "mail" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Mail Template Customization</h3>
              <p className="text-sm text-gray-500 mb-6">
                SMTP Configuration (Host, Port, Username, Password) is managed securely via your server's `.env` file. Use this section to customize the branding for automated emails.
              </p>
              <form action={updateMailSettings} className="space-y-4">
                <input type="hidden" name="builderId" value={builder.id} />

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">Brand Logo Image URL</label>
                    <input type="url" name="mailBrandLogo" defaultValue={builder.settings?.mailBrandLogo || ""} className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-primary transition-all sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-1">Terms & Conditions Link</label>
                    <input type="url" name="mailTermsLink" defaultValue={builder.settings?.mailTermsLink || ""} className="block w-full rounded-2xl border-0 bg-[var(--bg-app)] px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-primary transition-all sm:text-sm" />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#4a46c6] transition-colors">
                    <Save className="w-4 h-4" />
                    Save Templates
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOMIZATION TAB */}
        {activeTab === "customization" && (
          <div className="bg-[var(--tw-white)] rounded-3xl p-8 border border-[var(--tw-gray-100)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl">
            <h3 className="text-lg font-bold text-[var(--tw-gray-900)] mb-2">Theme & Appearance</h3>
            <p className="text-sm text-[var(--tw-gray-500)] mb-8">Customize the visual appearance of your public customer portals.</p>
            
            <form action={updateThemeSettings} className="space-y-6">
              <input type="hidden" name="builderId" value={builder.id} />
              
              <input type="hidden" name="theme" id="theme-input" value={`${colorMode}:${accentColor}`} readOnly />

              <div>
                <label className="block text-[11px] font-bold text-[var(--tw-gray-400)] tracking-wider uppercase mb-3">Color Mode</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setColorMode('light')}
                    className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${colorMode === 'light' ? 'border-primary bg-primary/10' : 'border-[var(--tw-gray-100)] hover:border-[var(--tw-gray-200)]'}`}>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-gray-900"></div>
                    </div>
                    <span className={`text-xs font-bold ${colorMode === 'light' ? 'text-[var(--tw-gray-900)]' : 'text-[var(--tw-gray-400)]'}`}>Light Mode</span>
                  </button>
                  <button type="button" onClick={() => setColorMode('dark')}
                    className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${colorMode === 'dark' ? 'border-primary bg-primary/10' : 'border-[var(--tw-gray-100)] hover:border-[var(--tw-gray-200)]'}`}>
                    <div className="w-12 h-12 rounded-full bg-gray-900 shadow-sm flex items-center justify-center border border-gray-800">
                      <div className="w-6 h-6 rounded-full bg-white"></div>
                    </div>
                    <span className={`text-xs font-bold ${colorMode === 'dark' ? 'text-[var(--tw-gray-900)]' : 'text-[var(--tw-gray-400)]'}`}>Dark Mode</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--tw-gray-400)] tracking-wider uppercase mb-3">Accent Color</label>
                <div className="flex gap-3">
                  {["#5a56d6", "#ef4444", "#f97316", "#22c55e", "#06b6d4", "#ec4899"].map((color) => (
                    <button type="button" onClick={() => setAccentColor(color)} key={color} 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${accentColor === color ? 'ring-2 ring-offset-2 ring-[var(--tw-gray-900)] scale-110' : 'hover:scale-105'}`} 
                      style={{backgroundColor: color}}>
                      {accentColor === color && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--tw-gray-100)] mt-6">
                <button type="submit" className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl text-sm font-bold hover:brightness-90 transition-all">
                  <Save className="w-4 h-4" />
                  Save Theme Preferences
                </button>
              </div>
            </form>
          </div>
        )}
        </div>
      </div>

      {/* Disable 2FA Confirmation Modal */}
      {confirmDisable2FA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Disable 2FA?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to disable Two-Factor Authentication? This will reduce the security of your account.
            </p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setConfirmDisable2FA(false)} 
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <form action={disable2FA} className="flex-1 m-0">
                <input type="hidden" name="builderId" value={builder.id} />
                <button 
                  type="submit" 
                  onClick={() => setConfirmDisable2FA(false)}
                  className="w-full px-4 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-colors"
                >
                  Yes, Disable
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {twoFactorStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-gray-100">
            {twoFactorStep === 1 ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Setup Authenticator</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Scan the QR code below with Google Authenticator, Authy, or your preferred TOTP app.
                </p>

                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm min-h-[186px] flex items-center justify-center">
                    {qrUrl ? (
                      <img src={qrUrl} alt="QR Code" width="150" height="150" className="rounded-lg" />
                    ) : (
                      <div className="w-[150px] h-[150px] bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-xs text-gray-400">Loading QR...</div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleVerify2FASetup}>
                  <div className="mb-6">
                    <label className="block text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">Enter 6-digit code</label>
                    <input type="text" maxLength={6} value={setupCode} onChange={e => setSetupCode(e.target.value)} placeholder="000000" required className="block w-full text-center text-2xl tracking-[0.5em] rounded-2xl border-0 bg-[#f8f9fc] px-4 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-primary focus:bg-white transition-all" />
                    {error2FA && <p className="text-red-500 text-xs font-bold text-center mt-3">{error2FA}</p>}
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setTwoFactorStep(0)} className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-2xl text-sm hover:bg-gray-200">
                      Cancel
                    </button>
                    <button type="submit" disabled={setupCode.length !== 6} className="flex-[2] flex items-center justify-center gap-2 px-4 py-3.5 bg-primary text-white font-bold rounded-2xl text-sm hover:brightness-90 transition-all disabled:opacity-50">
                      <CheckCircle2 className="w-4 h-4" />
                      Verify Code
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Save Backup Codes</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  2FA is now enabled! If you lose your device, these 8 backup codes are the <span className="font-bold text-gray-900">only way</span> to recover your account. Download them now.
                </p>

                <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="font-mono text-sm text-green-400 font-bold tracking-widest text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setTwoFactorStep(0)} className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-2xl text-sm hover:bg-gray-200">
                    Close
                  </button>
                  <button onClick={() => { handleDownloadCodes(); setTwoFactorStep(0); }} className="flex-[2] flex items-center justify-center gap-2 px-4 py-3.5 bg-primary text-white font-bold rounded-2xl text-sm hover:brightness-90 transition-all">
                    <Download className="w-4 h-4" />
                    Download & Finish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
