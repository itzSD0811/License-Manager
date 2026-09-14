"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { ShieldCheck, Key, ArrowRight, Lock } from "lucide-react";
import { check2FAStatus, verify2FACode, set2FAVerifiedSession } from "@/app/actions/auth";

export default function BuilderLogin() {
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); 

  // Make sure to clear Firebase session on mount so they don't bypass 2FA if they reload
  useEffect(() => {
    signOut(auth);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const checkRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || "Rate limit exceeded");

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        // Send confirmation email
        const { sendEmailVerification } = await import("firebase/auth");
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        throw new Error("Please verify your email first. A new confirmation link has been sent to your inbox.");
      }
      
      await fetch("/api/auth/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, success: true }),
      });

      const requires2FA = await check2FAStatus(email);
      
      if (requires2FA) {
        setStep("2fa");
        setLoading(false);
      } else {
        await set2FAVerifiedSession();
        const basePath = pathname.replace(/\/$/, ""); 
        router.push(`${basePath}/dashboard`);
      }
    } catch (err: any) {
      if (err.message !== "Rate limit exceeded" && !err.message.includes("wait")) {
        await fetch("/api/auth/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, success: false }),
        });
      }
      setError(err.message || "Failed to login. Please check your credentials.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first to reset your password.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setResetMessage("");
      await sendPasswordResetEmail(auth, email);
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const isValid = await verify2FACode(email, code, useBackup);
      if (!isValid) throw new Error("Invalid verification code");
      
      await set2FAVerifiedSession();
      const basePath = pathname.replace(/\/$/, ""); 
      router.push(`${basePath}/dashboard`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] p-4 font-sans text-gray-900 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-white rounded-[2rem] p-10 shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-gray-100">
          
          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="Magneticx Logo" className="w-16 h-16 object-contain" />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              {step === "credentials" ? "Welcome Back" : "Two-Factor Auth"}
            </h2>
            <p className="text-sm font-medium text-gray-400">
              {step === "credentials" ? "Sign in to manage your License Portal" : "Enter the security code to continue"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-sm font-bold text-green-600 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
              {resetMessage}
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[11px] font-black text-gray-400 tracking-widest uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  className="block w-full rounded-2xl border-0 bg-[#f8f9fc] px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-primary focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-black text-gray-400 tracking-widest uppercase">Password</label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  className="block w-full rounded-2xl border-0 bg-[#f8f9fc] px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-primary focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-primary/20"
              >
                {loading ? "Verifying..." : "Sign In to Dashboard"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FA} className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 tracking-widest uppercase mb-2 text-center">
                  {useBackup ? "Enter 8-Character Backup Code" : "Enter 6-Digit Authenticator Code"}
                </label>
                <input
                  type="text"
                  required
                  maxLength={useBackup ? 8 : 6}
                  className="block w-full text-center text-2xl tracking-[0.4em] rounded-2xl border-0 bg-[#f8f9fc] px-5 py-5 text-gray-900 font-bold focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  placeholder={useBackup ? "XXXXXXXX" : "000000"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < (useBackup ? 8 : 6)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-4 text-sm font-bold text-white hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20"
              >
                <Lock className="w-4 h-4" />
                {loading ? "Verifying..." : "Verify Identity"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setUseBackup(!useBackup); setCode(""); }}
                  className="text-xs font-bold text-gray-500 hover:text-primary transition-colors"
                >
                  {useBackup ? "Use Authenticator App Instead" : "Lost device? Use a backup code"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
