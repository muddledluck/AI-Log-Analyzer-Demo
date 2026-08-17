import type { AnalyzeError, AnalyzeResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function analyzeLog(logText: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logText }),
  });

  const data = (await response.json()) as AnalyzeResponse | AnalyzeError;

  if (!response.ok) {
    throw new Error(
      "error" in data ? data.error : "The analyzer could not read that snippet."
    );
  }

  return data as AnalyzeResponse;
}
