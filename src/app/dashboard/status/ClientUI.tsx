"use client";

import { useState } from "react";
import { MonitorX, Monitor, ShieldAlert, Cpu, Activity, RefreshCw } from "lucide-react";
import { requestUnassignOTP, verifyUnassignOTP } from "@/app/actions/customerHardware";
import { useRouter } from "next/navigation";

export default function StatusClientUI({ license }: { license: any }) {
  const router = useRouter();
  
  // States for OTP modal
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"confirm" | "otp">("confirm");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const firstInstall = license.installations && license.installations.length > 0 ? license.installations[0] : null;

  const handleRequestOTP = async () => {
    setLoading(true);
    setErrorMsg("");
    const res = await requestUnassignOTP();
    setLoading(false);
    if (res.success) {
      setStep("otp");
    } else {
      setErrorMsg(res.message || "Failed to send OTP.");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit code.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    const res = await verifyUnassignOTP(otp);
    setLoading(false);

    if (res.success) {
      setShowModal(false);
      router.refresh();
    } else {
      setErrorMsg(res.message || "Invalid OTP.");
      if (res.logout) {
        setTimeout(() => router.push("/login"), 1500);
      }
    }
  };

  const statusColors: any = {
    "Active": "bg-green-50 text-green-600 border-green-200",
    "Expired": "bg-red-50 text-red-600 border-red-200",
    "Not Activated": "bg-gray-100 text-gray-600 border-gray-200",
    "Disabled": "bg-red-50 text-red-600 border-red-200",
    "FROZEN": "bg-blue-50 text-blue-600 border-blue-200"
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Status & Hardware</h1>
        <p className="text-sm text-gray-500 font-medium">View your license status and manage assigned machines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* License Status */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Activity className="w-4 h-4" /> Current Status</h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold text-gray-400 mb-1">LICENSE STATUS</p>
              <div className="flex flex-col gap-2 items-start">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-wide uppercase border ${statusColors[license.status] || "bg-gray-100 text-gray-600"}`}>
                  {license.status}
                </span>
                {license.isFrozen && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">ACCOUNT FROZEN</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Machine */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Cpu className="w-4 h-4" /> Assigned Hardware</h3>
          </div>
          
          {firstInstall ? (
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-1">MACHINE ID / HWID</p>
                <p className="font-mono text-sm font-bold text-gray-900">{firstInstall.installationId}</p>
              </div>
              
              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-1">IP ADDRESS</p>
                <p className="font-mono text-sm font-bold text-gray-900">{firstInstall.ipAddress || "Unknown"}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-1">SYSTEM INFO</p>
                <p className="text-sm font-bold text-gray-900">{firstInstall.os || "Unknown OS"}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={() => { setStep("confirm"); setShowModal(true); setErrorMsg(""); setOtp(""); }}
                  className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-colors w-full justify-center"
                >
                  <MonitorX className="w-4 h-4" /> Unassign Machine
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Monitor className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-bold text-gray-900">No machine assigned</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Activate the software on a device to bind it.</p>
            </div>
          )}
        </div>
      </div>

      {/* Unassign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100">
            {step === "confirm" ? (
              <div className="p-8">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-6">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Unassign Machine</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
                  Are you sure you want to unassign this hardware? This will immediately lock the software on the current device. To confirm, we need to send a verification code to your email.
                </p>
                
                {errorMsg && (
                  <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRequestOTP}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Send Code"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                  <Cpu className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Verification Required</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
                  Enter the 6-digit verification code sent to <strong>{license.customer.email}</strong>.
                  <br/><br/>
                  <span className="text-red-600 font-bold">Warning:</span> 3 failed attempts will lock your license.
                </p>
                
                {errorMsg && (
                  <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                    {errorMsg}
                  </div>
                )}

                <div className="mb-6">
                  <input 
                    type="text" 
                    maxLength={6}
                    placeholder="123456" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full text-center text-3xl font-black tracking-[0.5em] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify & Unassign"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
