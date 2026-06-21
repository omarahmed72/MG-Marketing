import { useState, useEffect, useCallback } from "react";
import client from "../api/client";
import { UserProfile } from "../types";

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await client.get("/users");
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = useCallback(async (id: string, updates: Partial<UserProfile>) => {
    const { data } = await client.patch(`/users/${id}`, updates);
    setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
    return data;
  }, []);

  const rateUser = useCallback(async (id: string, overallRating: number) => {
    const { data } = await client.patch(`/users/${id}/rate`, { overallRating });
    setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
    return data;
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await client.delete(`/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  return { users, loading, updateUser, rateUser, deleteUser, refetch: fetchUsers };
}
