"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Key, 
  DownloadCloud, 
  Activity, 
  TerminalSquare, 
  Settings, 
  Moon,
  LogOut,
  User
} from "lucide-react";
import NotificationBell from "./components/NotificationBell";
import { auth } from "@/lib/firebase";
import { getBuilderProfile } from "@/app/actions/settings";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [builder, setBuilder] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    getBuilderProfile().then(setBuilder);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        const basePathMatch = window.location.pathname.match(/^(\/[^\/]+\/[^\/]+)/);
        const currentBasePath = basePathMatch ? basePathMatch[1] : "";
        router.push(currentBasePath || "/");
      } else {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  const basePathMatch = pathname.match(/^(\/[^\/]+\/[^\/]+)/);
  const basePath = basePathMatch ? basePathMatch[1] : "";

  const navigation = [
    { name: "Overview", href: `${basePath}/dashboard`, icon: LayoutDashboard },
    { name: "License Keys", href: `${basePath}/dashboard/licenses`, icon: Key },
    { name: "Software Releases", href: `${basePath}/dashboard/softwares`, icon: DownloadCloud },
    { name: "Audit Logs", href: `${basePath}/dashboard/logs`, icon: Activity },
    { name: "API Simulator", href: `${basePath}/dashboard/simulator`, icon: TerminalSquare },
    { name: "Settings", href: `${basePath}/dashboard/settings`, icon: Settings },
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex font-sans text-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Magneticx Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Magneticx
              </h1>
              <p className="text-[10px] font-bold text-primary tracking-wider uppercase">
                Dev Panel
              </p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== `${basePath}/dashboard`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? "bg-[var(--bg-app)] text-primary shadow-sm border border-gray-200" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center px-8 justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {navigation.find(n => pathname === n.href || (pathname.startsWith(n.href) && n.href !== `${basePath}/dashboard`))?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4 relative">
             <NotificationBell builderId={builder.id} />
             
             <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden border-2 border-transparent hover:border-primary transition-all">
               {builder?.settings?.avatarUrl ? (
                 <img src={builder.settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 builder?.settings?.name?.substring(0, 2).toUpperCase() || "SD"
               )}
             </button>

             {/* Profile Dropdown */}
             {showProfileMenu && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                 <div className="absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                   <div className="p-4 border-b border-gray-50">
                     <p className="font-bold text-gray-900 truncate">{builder?.settings?.name || "Admin User"}</p>
                     <p className="text-xs text-gray-500 truncate">{builder?.email || "admin@example.com"}</p>
                   </div>
                   <div className="p-2">
                     <Link href={`${basePath}/dashboard/settings`} onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                       <User className="w-4 h-4" />
                       Profile Settings
                     </Link>
                     <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1">
                       <LogOut className="w-4 h-4" />
                       Logout
                     </button>
                   </div>
                 </div>
               </>
             )}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
