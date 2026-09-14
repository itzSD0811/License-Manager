import { PrismaClient } from "@prisma/client";
import { CheckCircle2, Zap, Clock, Activity, AlertCircle, Monitor, Box, ShieldAlert } from "lucide-react";

const prisma = new PrismaClient();

export default async function DashboardOverview() {
  // License Stats
  const activeCount = await prisma.license.count({ where: { status: "Active" } });
  const totalCount = await prisma.license.count();
  const expiredCount = await prisma.license.count({ where: { status: "Expired" } });
  const disabledCount = await prisma.license.count({ where: { status: "Disabled" } });
  const frozenCount = await prisma.license.count({ where: { isFrozen: true } });
  const lockedCount = await prisma.license.count({ where: { isLocked: true } });
  
  const hwInstalls = await prisma.licenseInstallation.count();

  // API Stats
  const totalRequests = await prisma.apiLog.count();
  const successRequests = await prisma.apiLog.count({ where: { statusCode: 200 } });
  const failedRequests = totalRequests - successRequests;
  const successRate = totalRequests > 0 ? Math.round((successRequests / totalRequests) * 100) : 0;

  // Top Products
  const topProducts = await prisma.product.findMany({
    include: { _count: { select: { licenses: true } } },
    orderBy: { licenses: { _count: 'desc' } },
    take: 5
  });

  // Recent Failed API Requests (Security)
  const recentFails = await prisma.apiLog.findMany({
    where: { statusCode: { not: 200 } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { license: { include: { customer: true } } }
  });

  const stats = [
    { name: "ACTIVE LICENSES", value: activeCount, icon: CheckCircle2, iconColor: "text-green-500" },
    { name: "TOTAL ISSUED", value: totalCount, icon: Zap, iconColor: "text-primary" },
    { name: "HW ASSIGNMENTS", value: hwInstalls, icon: Monitor, iconColor: "text-blue-500" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] uppercase">{stat.name}</p>
            </div>
            <p className="text-4xl font-black text-gray-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity className="w-4 h-4" /> Global API Telemetry
              </h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-2xl font-black text-gray-900">{totalRequests}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Success</p>
                <p className="text-2xl font-black text-green-600">{successRequests}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Failed</p>
                <p className="text-2xl font-black text-red-500">{failedRequests}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Health</p>
                <p className="text-2xl font-black text-blue-600">{successRate}%</p>
              </div>
            </div>

            {/* Visual Health Bar */}
            <div className="w-full h-3 bg-red-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-green-500 transition-all duration-1000"
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          </div>

          {/* Security & Recent Fails */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Security & Rejections
              </h3>
            </div>

            {recentFails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Time</th>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Endpoint</th>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">Reason</th>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 tracking-widest uppercase">IP / Origin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFails.map((fail) => (
                      <tr key={fail.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {new Date(fail.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-gray-900">{fail.endpoint}</td>
                        <td className="py-3 px-4 text-xs font-bold text-red-500">{fail.errorType || "Unknown"}</td>
                        <td className="py-3 px-4 text-xs font-mono text-gray-500">{fail.ipAddress || "Unknown"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">No recent rejections</p>
                <p className="text-xs text-gray-500 mt-1">All incoming API requests are passing security checks.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* License Status Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Status Breakdown</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-bold text-gray-900">Active</span>
                </div>
                <span className="text-sm font-bold text-gray-500">{activeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span className="text-sm font-bold text-gray-900">Disabled</span>
                </div>
                <span className="text-sm font-bold text-gray-500">{disabledCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className="text-sm font-bold text-gray-900">Expired</span>
                </div>
                <span className="text-sm font-bold text-gray-500">{expiredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-bold text-gray-900">Frozen</span>
                </div>
                <span className="text-sm font-bold text-gray-500">{frozenCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-bold text-gray-900">Locked</span>
                </div>
                <span className="text-sm font-bold text-gray-500">{lockedCount}</span>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Box className="w-4 h-4" /> Top Products
            </h3>
            
            {topProducts.length > 0 ? (
              <div className="space-y-5">
                {topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 truncate pr-4">{product.name}</span>
                    <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg shrink-0">
                      {product._count.licenses} keys
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No products found.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
