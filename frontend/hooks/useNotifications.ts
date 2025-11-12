import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";

export interface Notification {
  _id: string;
  userId: string;
  type: "proposal" | "message" | "project" | "review" | "system";
  title: string;
  message: string;
  relatedId?: string;
  relatedModel?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      const { notifications: notifs, unreadCount: count } = res.data;
      setNotifications(notifs || []);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const onNewNotification = (notification: Notification) => {
      // Only show notification if it's actually for the current user
      if (notification.userId === user.id) {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("notification:new", onNewNotification);

    return () => {
      socket.off("notification:new", onNewNotification);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

