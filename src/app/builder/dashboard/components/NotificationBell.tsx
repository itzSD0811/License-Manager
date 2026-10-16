"use client";

import { useState, useEffect } from "react";
import { Bell, Trash2, X } from "lucide-react";
import { 
  getNotifications, 
  markNotificationsRead, 
  clearAllNotifications, 
  deleteNotification 
} from "@/app/actions/notifications";
import { useRouter } from "next/navigation";

export default function NotificationBell({ builderId }: { builderId: string }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isClearing, setIsClearing] = useState(false);
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

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isClearing) return;
    setIsClearing(true);
    try {
      await clearAllNotifications(builderId);
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await deleteNotification(id, builderId);
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleNotificationClick = (n: any) => {
    let targetLink = "/builder/dashboard/licenses";
    if (n.link) {
      // Ensure it never redirects to client dashboard (/dashboard)
      if (n.link.startsWith("/dashboard") && !n.link.startsWith("/builder")) {
        targetLink = "/builder/dashboard/licenses";
      } else {
        targetLink = n.link;
      }
    }
    router.push(targetLink);
    setShowDropdown(false);
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
          <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-red-50"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isClearing ? "Clearing..." : "Clear all"}</span>
                </button>
              )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 font-medium">
                  No notifications yet
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 group cursor-pointer hover:bg-gray-50/80 transition-colors relative ${!n.isRead ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-gray-900 truncate">{n.title}</p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-600 mt-1 leading-snug whitespace-pre-wrap break-words">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                          {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0"
                        title="Delete notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
