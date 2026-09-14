"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, Send, Clock, Calendar } from "lucide-react";
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

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">License Renewal</h1>
        <p className="text-sm text-gray-500 font-medium">Extend your license validity and request renewals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Current Expiration</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : "Never"}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Status: {license.status}</p>
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
