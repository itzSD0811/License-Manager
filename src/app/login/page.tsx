"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, ArrowRight, RefreshCw } from "lucide-react";
import { requestCustomerLogin, verifyCustomerOTP } from "@/app/actions/customerAuth";

export default function CustomerLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const [otp, setOtp] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await requestCustomerLogin(email, key);
    if (res.success) {
      setStep("otp");
    } else {
      setError(res.message || "Login failed");
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await verifyCustomerOTP(email, key, otp);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.message || "Invalid code");
      setOtp("");
      if (res.message?.includes("request a new one")) {
        setStep("credentials");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-4 font-sans text-gray-900 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]"></div>
        <div className="absolute top-[70%] -right-[5%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100/50">
          
          <div className="flex justify-center mb-10">
            <img src="/logo.png" alt="Magneticx Logo" className="w-16 h-16 object-contain" />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              {step === "credentials" ? "License Portal" : "Verification"}
            </h2>
            <p className="text-sm font-medium text-gray-400">
              {step === "credentials" 
                ? "Sign in to manage your active license" 
                : "Enter the code sent to your email"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5"></div>
              <span>{error}</span>
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div>
                <label className="block text-[11px] font-black text-gray-400 tracking-widest uppercase mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-5 py-4 rounded-2xl border-0 bg-[#f8f9fc] text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 tracking-widest uppercase mb-2">License Key</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="block w-full pl-11 pr-5 py-4 rounded-2xl border-0 bg-[#f8f9fc] text-gray-900 font-bold font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400 placeholder:font-sans"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !key}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-4 rounded-2xl text-sm font-black tracking-wide hover:bg-blue-700 transition-all disabled:opacity-50 mt-8"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Login Code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label className="block text-[11px] font-black text-gray-400 tracking-widest uppercase mb-2 text-center">
                  6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-full text-center tracking-[0.5em] text-3xl py-4 rounded-2xl border-0 bg-[#f8f9fc] text-gray-900 font-black focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-gray-300"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-4 rounded-2xl text-sm font-black tracking-wide hover:bg-blue-700 transition-all disabled:opacity-50 mt-8"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Login
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full text-center text-[13px] font-bold text-gray-500 hover:text-gray-900 mt-4 transition-colors"
              >
                Back to credentials
              </button>
            </form>
          )}

        </div>
        
        <p className="text-center text-[12px] font-bold text-gray-400 mt-8">
          Powered by <span className="text-gray-900">Magneticx</span>
        </p>
      </div>
    </div>
  );
}
