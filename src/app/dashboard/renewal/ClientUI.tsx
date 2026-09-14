"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, Send, Clock, Calendar, AlertTriangle } from "lucide-react";
import { requestRenewal } from "@/app/actions/customerRequests";

export default function RenewalClientUI({ license }: { license: any }) {
  const [renewalMsg, setRenewalMsg] = useState("");
  const [loadingRenewal, setLoadingRenewal] = useState(false);
  const [renewalSuccess, setRenewalSuccess] = useState(false);

  const handleRenewal = async () => {
    setLoadingRenewal(true);
    await requestRenewal(renewalMsg);
    setRenewalSuccess(true);
    setLoadingRenewal(false);
  };

  const now = new Date();
  const expiresAt = license.expiresAt ? new Date(license.expiresAt) : null;
  const isExpired = expiresAt ? now > expiresAt : false;
  let daysRemaining: number | null = null;
  if (expiresAt && !isExpired) {
    daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">License Renewal</h1>
        <p className="text-sm text-gray-500 font-medium">Extend your license validity and request renewals.</p>
      </div>

      {/* Expired Alert */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-red-700">License Expired</h3>
            <p className="text-sm text-red-600 font-medium mt-1">Your license expired on {expiresAt!.toLocaleDateString()}. Please send a renewal request below to restore access.</p>
          </div>
        </div>
      )}

      {/* Expiry Warning */}
      {!isExpired && daysRemaining !== null && daysRemaining <= 7 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-700">
              {daysRemaining === 0 ? "License expires today!" : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
            </h3>
            <p className="text-sm text-amber-600 font-medium mt-1">Your license will expire on {expiresAt!.toLocaleDateString()}. We recommend requesting a renewal now.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Current Expiration</h3>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isExpired ? "bg-red-50" : "bg-blue-50"}`}>
              <Calendar className={`w-6 h-6 ${isExpired ? "text-red-500" : "text-blue-500"}`} />
            </div>
            <div>
              <p className={`text-2xl font-black ${isExpired ? "text-red-600" : "text-gray-900"}`}>
                {expiresAt ? expiresAt.toLocaleDateString() : "Never"}
              </p>
              {isExpired ? (
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mt-1">License Expired</p>
              ) : daysRemaining !== null ? (
                <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${daysRemaining <= 7 ? "text-amber-500" : "text-gray-400"}`}>
                  {daysRemaining === 0 ? "Expires today" : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
                </p>
              ) : (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Status: {license.status}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Request Extension</h3>
          {renewalSuccess ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold flex gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Renewal request sent successfully. We will be in touch!
            </div>
          ) : (
            <div className="space-y-4">
              <textarea 
                rows={3} 
                placeholder="Optional message to your provider..." 
                value={renewalMsg}
                onChange={e => setRenewalMsg(e.target.value)}
                className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-none"
              />
              <button 
                onClick={handleRenewal}
                disabled={loadingRenewal}
                className="w-full bg-blue-600 text-white font-bold text-sm px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {loadingRenewal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Renewal Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
