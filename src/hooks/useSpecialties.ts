import { useState, useEffect, useCallback } from "react";
import client from "../api/client";
import { Specialty } from "../types";

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpecialties = useCallback(async () => {
    try {
      const { data } = await client.get("/specialties");
      setSpecialties(data);
    } catch (err) {
      console.error("Failed to fetch specialties:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const createSpecialty = useCallback(async (specialtyData: Partial<Specialty>) => {
    const { data } = await client.post("/specialties", specialtyData);
    setSpecialties((prev) => [data, ...prev]);
    return data;
  }, []);

  return { specialties, loading, createSpecialty, refetch: fetchSpecialties };
}
