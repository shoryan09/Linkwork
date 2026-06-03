import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";

export function useUnreadCount() {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByProject, setUnreadByProject] = useState<Record<string, number>>({});

  const fetchUnreadCounts = async () => {
    if (!user) return;
    try {
      const res = await api.get("/chats/unread");
      const { totalUnread: total, unreadCounts } = res.data;
      setTotalUnread(total);
      const byProject: Record<string, number> = {};
      unreadCounts.forEach((uc: any) => {
        byProject[uc.projectId] = uc.count;
      });
      setUnreadByProject(byProject);
    } catch (error) {
      console.error("Failed to fetch unread counts:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    
    const onUnreadUpdate = () => {
      fetchUnreadCounts();
    };

    socket.on("unread:update", onUnreadUpdate);
    
    return () => {
      socket.off("unread:update", onUnreadUpdate);
    };
  }, [user]);

  return { totalUnread, unreadByProject, refetch: fetchUnreadCounts };
}

