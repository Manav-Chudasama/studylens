import { getJson } from "serpapi";

const serpApiKey = process.env.SERP_API_KEY || "f13124b6029a1c5388dfa2c856bf2fd6128410bf314e49a5d935b0a67cb0bc8a";

type SerpTranscriptItem = {
  start_ms?: number;
  end_ms?: number;
  snippet?: string;
  text?: string;
  start_time_text?: string;
};

type SerpTranscriptResponse = {
  transcript?: SerpTranscriptItem[];
  error?: string;
};

/** Extract standard YouTube 11-character video ID from common URL formats */
export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  return match ? match[1] : null;
}

/** Fetch full timestamped transcript for a YouTube video via SerpAPI */
export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  if (!videoId) return "";
  try {
    const data = await new Promise<SerpTranscriptResponse>((resolve, reject) => {
      getJson({
        engine: "youtube_video_transcript",
        v: videoId,
        api_key: serpApiKey,
      }, (json: SerpTranscriptResponse) => {
        if (json.error) reject(new Error(json.error));
        else resolve(json);
      });
    });

    if (data.transcript && Array.isArray(data.transcript) && data.transcript.length > 0) {
      return data.transcript
        .map((t: SerpTranscriptItem) => `${t.start_time_text ? `[${t.start_time_text}] ` : ""}${t.snippet || t.text || ""}`.trim())
        .filter(Boolean)
        .join(" ");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[SerpAPI] Could not fetch transcript for video ${videoId}:`, msg);
  }
  return "";
}

/** Fetch video title using YouTube oEmbed endpoint */
export async function fetchYouTubeTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (res.ok) {
      const data = (await res.json()) as { title?: unknown };
      if (typeof data.title === "string" && data.title.trim()) return data.title.trim();
    }
  } catch {}
  return null;
}
