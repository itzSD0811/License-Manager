"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, Activity, AlertCircle, Zap } from "lucide-react";
import { requestRateLimitReset } from "@/app/actions/customerRequests";

export default function UsageClientUI({ license }: { license: any }) {
  const [rateMsg, setRateMsg] = useState("");
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateSuccess, setRateSuccess] = useState(false);

  const handleRateReset = async () => {
    setLoadingRate(true);
    await requestRateLimitReset(rateMsg);
    setRateSuccess(true);
    setLoadingRate(false);
  };

  const rateLimitHits = license.rateLimitHits || 0;
  const rateLimit = license.rateLimit || 0;
  const isRateLimitExceeded = rateLimit > 0 && rateLimitHits >= rateLimit;
  const usagePercent = rateLimit > 0 ? Math.min(100, Math.round((rateLimitHits / rateLimit) * 100)) : 0;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">API Usage & Limits</h1>
        <p className="text-sm text-gray-500 font-medium">Monitor your request quotas and request limit adjustments.</p>
      </div>

      {/* Rate Limit Exceeded Alert */}
      {isRateLimitExceeded && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-red-700">Rate Limit Exceeded</h3>
            <p className="text-sm text-red-600 font-medium mt-1">
              You have used all {rateLimit} API requests for this {license.rateLimitWindow === "hours" ? "hour" : "day"}. Your API access is temporarily blocked. Request a reset below or wait for the next window.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Current API Usage</h3>
        
        {rateLimit > 0 ? (
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-3xl font-black text-gray-900">{rateLimitHits} <span className="text-lg text-gray-400 font-bold">/ {rateLimit}</span></p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Requests Made per {license.rateLimitWindow === "hours" ? "hour" : "day"}</p>
              </div>
              <p className={`text-xl font-black ${usagePercent >= 100 ? "text-red-500" : usagePercent > 75 ? "text-orange-500" : "text-blue-600"}`}>{usagePercent}%</p>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${usagePercent >= 100 ? 'bg-red-500' : usagePercent > 75 ? 'bg-orange-500' : 'bg-blue-500'}`} 
                style={{ width: `${usagePercent}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-900">No Rate Limit Set</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Your license has unlimited API requests.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-start gap-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6 text-orange-500" />
        </div>
        <div className="flex-1 w-full">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Rate Limit Reset</h3>
          <p className="text-sm text-gray-500 font-medium mb-6">If you've hit your API limit accidentally, you can request an emergency reset from the administrator.</p>
          
          {rateSuccess ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold inline-flex items-center gap-2 w-full">
              <CheckCircle2 className="w-5 h-5" /> Reset request sent successfully!
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Reason for reset (optional)" 
                value={rateMsg}
                onChange={e => setRateMsg(e.target.value)}
                className="flex-1 rounded-xl border-gray-200 bg-gray-50 p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              <button 
                onClick={handleRateReset}
                disabled={loadingRate}
                className="bg-orange-500 text-white font-bold text-sm px-6 py-4 rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                {loadingRate ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Request Reset"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
