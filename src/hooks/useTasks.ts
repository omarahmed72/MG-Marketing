import { useState, useEffect, useCallback } from "react";
import client from "../api/client";
import { Task } from "../types";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await client.get("/tasks");
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    const { data } = await client.post("/tasks", taskData);
    setTasks((prev) => [data, ...prev]);
    return data;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const { data } = await client.patch(`/tasks/${id}`, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const updateTimer = useCallback(async (id: string, timerRemaining: number, timerIsRunning: boolean, timerStartedAt?: string) => {
    const { data } = await client.patch(`/tasks/${id}/timer`, { timerRemaining, timerIsRunning, timerStartedAt });
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await client.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, createTask, updateTask, updateTimer, deleteTask, refetch: fetchTasks };
}
