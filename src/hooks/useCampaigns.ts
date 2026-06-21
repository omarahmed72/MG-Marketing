import { useState, useEffect, useCallback } from "react";
import client from "../api/client";
import { Campaign } from "../types";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data } = await client.get("/campaigns");
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (campaignData: Partial<Campaign>) => {
    const { data } = await client.post("/campaigns", campaignData);
    setCampaigns((prev) => [data, ...prev]);
    return data;
  }, []);

  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    const { data } = await client.patch(`/campaigns/${id}`, updates);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? data : c)));
    return data;
  }, []);

  return { campaigns, loading, createCampaign, updateCampaign, refetch: fetchCampaigns };
}
