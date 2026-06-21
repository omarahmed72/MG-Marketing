import { useState, useEffect, useCallback } from "react";
import client from "../api/client";
import { TaskReport, TaskAttachment } from "../types";

export function useReports() {
  const [reports, setReports] = useState<TaskReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await client.get("/reports");
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const submitReport = useCallback(async (taskId: string, summary: string, attachments: TaskAttachment[]) => {
    const { data } = await client.post("/reports", { taskId, summary, attachments });
    setReports((prev) => [data, ...prev]);
    return data;
  }, []);

  const approveReport = useCallback(async (reportId: string, feedback: string, stars: number) => {
    const { data } = await client.patch(`/reports/${reportId}/approve`, { feedback, stars });
    setReports((prev) => prev.map((r) => (r.id === reportId ? data : r)));
    return data;
  }, []);

  const rejectReport = useCallback(async (reportId: string, feedback: string) => {
    const { data } = await client.patch(`/reports/${reportId}/reject`, { feedback });
    setReports((prev) => prev.map((r) => (r.id === reportId ? data : r)));
    return data;
  }, []);

  const resubmitReport = useCallback(async (reportId: string, updates: { summary?: string; rejectionExplanation?: string }) => {
    const { data } = await client.patch(`/reports/${reportId}/resubmit`, updates);
    setReports((prev) => prev.map((r) => (r.id === reportId ? data : r)));
    return data;
  }, []);

  return { reports, loading, submitReport, approveReport, rejectReport, resubmitReport, refetch: fetchReports };
}
