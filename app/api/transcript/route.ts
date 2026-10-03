import { NextResponse } from 'next/server';
import { getJson } from 'serpapi';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('v');
  const language_code = searchParams.get('lc') || searchParams.get('language_code');

  console.log(`[SerpAPI] Fetching transcript for video: ${videoId}, language: ${language_code || 'default'}`);

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  const serpApiKey = process.env.SERP_API_KEY || "f13124b6029a1c5388dfa2c856bf2fd6128410bf314e49a5d935b0a67cb0bc8a";
  if (!serpApiKey) {
    return NextResponse.json({ error: 'Server missing SerpAPI credentials.' }, { status: 500 });
  }

  try {
    const params: any = {
      engine: 'youtube_video_transcript',
      v: videoId,
      api_key: serpApiKey,
    };
    if (language_code) {
      params.language_code = language_code;
    }

    console.log(`[SerpAPI] Requesting transcript with params:`, { ...params, api_key: '***' });
    const data = await getJson(params);

    if (!data.transcript || data.transcript.length === 0) {
      return NextResponse.json({
        error: "No captions available for this video.",
        hint: "This video may not have subtitles, or it may be restricted/private."
      }, { status: 404 });
    }

    // SerpAPI returns { transcript, chapters, available_transcripts } 
    // transcript items have: start_ms, end_ms, snippet, start_time_text
    const summarySnippets = data.transcript.slice(0, Math.min(10, data.transcript.length));
    const summary = summarySnippets.map((s: any) => s.snippet || s.text || '').join(' ').substring(0, 500);

    return NextResponse.json({
      transcript: data.transcript,
      title: `Transcript for ${videoId}`,
      summary: summary,
      chapters: data.chapters || [],
      available_transcripts: data.available_transcripts || [],
    });

  } catch (error: any) {
    console.error("[SerpAPI] Transcript fetch error:", error.message || error);
    return NextResponse.json({
      error: "Failed to fetch transcript.",
      details: error.message || String(error),
      hint: "The SerpAPI service may be unavailable or the video ID is invalid."
    }, { status: 500 });
  }
}
