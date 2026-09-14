"use client";

import { useState, useMemo } from "react";
import { 
  Activity, CheckCircle2, XCircle, Globe2, 
  BarChart3, Filter, Trash2, AlertTriangle
} from "lucide-react";
import { clearAllApiLogs } from "@/app/actions/logs";
// Since recharts might not be installed, we will build a custom SVG chart for a sleek, lightweight feel!

export default function ApiLogsClientUI({ initialLogs }: { initialLogs: any[] }) {
  const [timeFilter, setTimeFilter] = useState("week"); // day, week, month, year
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const logs = useMemo(() => {
    const now = new Date();
    return initialLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      const diffMs = now.getTime() - logDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      if (timeFilter === "day") return diffDays <= 1;
      if (timeFilter === "week") return diffDays <= 7;
      if (timeFilter === "month") return diffDays <= 30;
      if (timeFilter === "year") return diffDays <= 365;
      return true;
    });
  }, [initialLogs, timeFilter]);

  const totalRequests = logs.length;
  const successfulHits = logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
  const failedHits = totalRequests - successfulHits;
  const successRate = totalRequests === 0 ? 0 : Math.round((successfulHits / totalRequests) * 100);
  const uniqueIps = new Set(logs.map(l => l.ipAddress)).size;

  // Group data for the chart based on time filter
  const chartData = useMemo(() => {
    const data: { [key: string]: { success: number, failed: number } } = {};
    
    logs.forEach(log => {
      const date = new Date(log.createdAt);
      let key = "";
      
      if (timeFilter === "day") {
        key = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeFilter === "year") {
        key = date.toLocaleDateString([], { month: 'short' });
      } else {
        key = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }

      if (!data[key]) data[key] = { success: 0, failed: 0 };
      
      if (log.statusCode >= 200 && log.statusCode < 300) {
        data[key].success++;
      } else {
        data[key].failed++;
      }
    });

    return Object.entries(data).map(([label, counts]) => ({
      label,
      ...counts,
      total: counts.success + counts.failed
    })).reverse(); // Oldest to newest
  }, [logs, timeFilter]);

  const maxChartValue = Math.max(...chartData.map(d => d.total), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--bg-app)] rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">API Analytics</h2>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              Monitor your license endpoint performance and traffic.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 flex items-center">
            {["day", "week", "month", "year"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  timeFilter === t 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Last {t}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center w-10 h-10 bg-white rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors shadow-sm"
            title="Clear all logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform">
            <BarChart3 className="w-16 h-16 text-primary" />
          </div>
          <p className="text-[11px] font-black text-gray-400 tracking-wider uppercase mb-1">Total Requests</p>
          <p className="text-4xl font-black text-gray-900">{totalRequests.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <p className="text-[11px] font-black text-gray-400 tracking-wider uppercase mb-1">Success Rate</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-black text-gray-900">{successRate}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-[11px] font-black text-gray-400 tracking-wider uppercase mb-1">Failed Hits</p>
          <p className="text-4xl font-black text-gray-900">{failedHits.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform">
            <Globe2 className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-[11px] font-black text-gray-400 tracking-wider uppercase mb-1">Unique IPs</p>
          <p className="text-4xl font-black text-gray-900">{uniqueIps.toLocaleString()}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
        <h3 className="text-lg font-black text-gray-900 tracking-tight mb-8">Traffic Overview</h3>
        
        <div className="h-64 flex items-end gap-2">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm font-bold">No data for this time period</p>
            </div>
          ) : (
            chartData.map((d, i) => {
              const successHeight = (d.success / maxChartValue) * 100;
              const failedHeight = (d.failed / maxChartValue) * 100;

              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] p-2 rounded-lg pointer-events-none whitespace-nowrap z-10 flex flex-col gap-1">
                    <span className="font-bold border-b border-gray-700 pb-1">{d.label}</span>
                    <span className="text-green-400">{d.success} Successful</span>
                    {d.failed > 0 && <span className="text-red-400">{d.failed} Failed</span>}
                  </div>

                  <div className="w-full max-w-[40px] flex flex-col justify-end gap-0.5 relative h-[calc(100%-24px)]">
                    {/* Failed Stack */}
                    {d.failed > 0 && (
                      <div 
                        className="w-full bg-red-400/80 rounded-t-sm transition-all duration-500" 
                        style={{ height: `${failedHeight}%` }}
                      ></div>
                    )}
                    {/* Success Stack */}
                    <div 
                      className={`w-full bg-primary transition-all duration-500 ${d.failed === 0 ? 'rounded-t-sm' : ''} rounded-b-sm`} 
                      style={{ height: `${successHeight}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 mt-2 truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Logs Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Recent API Hits</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 tracking-wider uppercase">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 tracking-wider uppercase">Endpoint</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 tracking-wider uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 tracking-wider uppercase">IP Address</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 tracking-wider uppercase">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.slice(0, 50).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-900 font-mono">
                    POST {log.endpoint}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                      log.statusCode >= 200 && log.statusCode < 300 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    }`}>
                      {log.statusCode} {log.errorType || "OK"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">
                    {log.ipAddress}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                    {log.responseTimeMs}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Clear API Logs?</h3>
            <p className="text-sm text-gray-500 mb-8">
              Are you sure you want to permanently delete all API Request logs? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <form action={async () => {
                await clearAllApiLogs();
                setShowDeleteModal(false);
              }} className="flex-1">
                <button type="submit" className="w-full bg-red-500 text-white px-4 py-3.5 rounded-2xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
                  Clear All
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
