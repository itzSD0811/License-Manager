"use client";

import { Activity, ShieldAlert, CheckCircle2, XCircle, Calendar, ShieldCheck } from "lucide-react";

export default function DashboardClientUI({ license, stats }: { license: any, stats: any }) {
  const statusColors: any = {
    "Active": "bg-green-50 text-green-600",
    "Expired": "bg-red-50 text-red-600",
    "Not Activated": "bg-gray-100 text-gray-600",
    "Disabled": "bg-red-50 text-red-600",
    "FROZEN": "bg-blue-50 text-blue-600"
  };

  return (
    <div className="max-w-6xl space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Overview</h1>
        <p className="text-sm text-gray-500 font-medium">Manage your license and monitor API usage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: License Details */}
        <div className="lg:col-span-1 space-y-8">
          
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">License Details</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-1">PRODUCT</p>
                <p className="text-sm font-bold text-gray-900">{license.product.name}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-1">LICENSE ID</p>
                <p className="text-sm font-bold text-gray-900">{license.id}</p>
              </div>
              
              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-1">LICENSE KEY</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-bold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    {license.key.replace(/^(.{4}).*(.{4})$/, "$1-XXXX-XXXX-$2")}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(license.key)}
                    className="p-2 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-2">STATUS</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black tracking-wide uppercase ${statusColors[license.status] || "bg-gray-100 text-gray-600"}`}>
                  {license.status}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 mb-1">EXPIRES AT</p>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : "Never"}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Stats */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <Activity className="w-5 h-5 text-blue-500 mb-4" />
              <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Requests</p>
              <p className="text-2xl font-black text-gray-900">{stats.totalRequests}</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <CheckCircle2 className="w-5 h-5 text-green-500 mb-4" />
              <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Success</p>
              <p className="text-2xl font-black text-gray-900">{stats.successRequests}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <XCircle className="w-5 h-5 text-red-500 mb-4" />
              <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Failed</p>
              <p className="text-2xl font-black text-gray-900">{stats.failedRequests}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <ShieldAlert className="w-5 h-5 text-orange-500 mb-4" />
              <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Success Rate</p>
              <p className="text-2xl font-black text-gray-900">{stats.successRate}%</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Unauthorized Requests</h3>
            </div>
            
            {stats.unauthorizedRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Time</th>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">IP Address</th>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Hardware ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.unauthorizedRequests.map((req: any) => (
                      <tr key={req.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-xs font-medium text-gray-500">{new Date(req.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 text-xs font-mono text-gray-900">{req.ipAddress || "Unknown"}</td>
                        <td className="py-3 px-4 text-xs font-mono text-red-600">{req.installationId || "Unknown"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">No unauthorized requests</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Your license usage is secure.</p>
              </div>
            )}
        </div>
        </div>
      </div>
    </div>
  );
}
