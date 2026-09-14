"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { getNotifications, markNotificationsRead } from "@/app/actions/notifications";
import { useRouter } from "next/navigation";

export default function NotificationBell({ builderId }: { builderId: string }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const fetchNotifs = async () => {
      const data = await getNotifications(builderId);
      setNotifications(data);
    };
    fetchNotifs();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [builderId]);

  const handleOpen = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && unreadCount > 0) {
      await markNotificationsRead(builderId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors relative"
      >
        <Bell className="w-4 h-4 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 font-medium">No notifications yet</div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      if (n.link) {
                        router.push(n.link);
                        setShowDropdown(false);
                      }
                    }}
                    className={`p-4 border-b border-gray-50 last:border-0 ${n.link ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""} ${!n.isRead ? "bg-blue-50/30" : ""}`}
                  >
                    <p className="text-[13px] font-bold text-gray-900">{n.title}</p>
                    <p className="text-[12px] text-gray-600 mt-1 leading-snug whitespace-pre-wrap">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
