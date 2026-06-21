import { useState, useEffect, useCallback } from "react";
import client from "../api/client";
import { CRMNotification } from "../types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<CRMNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await client.get("/notifications");
      setNotifications(data);
      setUnreadCount(data.filter((n: CRMNotification) => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await client.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await client.post("/notifications/mark-all-read");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
