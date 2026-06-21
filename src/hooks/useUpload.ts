import { useCallback } from "react";
import client from "../api/client";

export function useUpload() {
  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await client.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as { url: string; name: string; type: "image" | "file" };
  }, []);

  return { uploadFile };
}
