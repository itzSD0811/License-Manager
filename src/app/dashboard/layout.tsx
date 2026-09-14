"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, DownloadCloud, LogOut, ArrowRight, Clock, Activity, Monitor } from "lucide-react";
import { logoutCustomer } from "@/app/actions/customerAuth";

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutCustomer();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/status", label: "Status & Hardware", icon: Monitor },
    { href: "/dashboard/software", label: "Releases & Software", icon: DownloadCloud },
    { href: "/dashboard/renewal", label: "License Renewal", icon: Clock },
    { href: "/dashboard/usage", label: "API Usage & Limits", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-sans text-gray-900">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-20">
        <div className="h-20 flex items-center px-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-sm font-black text-gray-900 tracking-tight leading-tight">License Portal</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Access</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-blue-50 text-blue-600 font-bold" 
                    : "text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-900"
                }`}>
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {isActive && <ArrowRight className="w-4 h-4 text-blue-600" />}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-auto">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
